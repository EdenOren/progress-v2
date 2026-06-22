# Phase 5 — Active Workout Session

## Branch
`feature/5-session`

## Goal
Flesh out `EntryComponent` from a stub into a fully interactive live workout session: items with set inputs, a live timer, per-exercise feedback and notes, and a completion flow that writes the finished entry back to Supabase.

---

## Scope Overview

| Area | Work |
|------|------|
| Data layer | 3 new data files (`items`, `item_sets`, `item_feedback`); mutations on `entries.data.ts` |
| Enums | `FeedbackRating`, `TrackingType` |
| SubjectFacade | Add `startWorkout()` — creates entry, navigates to it |
| EntryFacade | Full implementation: resources, timer, all mutation methods |
| EntryComponent | Full template replacing stub |
| Sub-components | `SessionItemComponent`, `SetRowComponent`, `AddItemDialogComponent`, `CompleteSessionDialogComponent` |
| i18n | ENTRY section fully expanded |

---

## 1. Data Layer

### 1.1 `entries.data.ts` — new mutations

```ts
createEntry(supabase, { userId, subjectId, performedAt }): Promise<Result<Entry>>
startEntry(supabase, entryId): Promise<Result<void>>           // sets started_at = NOW()
completeEntry(supabase, entryId, durationSeconds, notes?): Promise<Result<void>>
getLastCompletedEntry(supabase, subjectId, userId): Promise<Result<Entry | null>>
```

`createEntry` inserts with `is_completed = false`, `performed_at = today`.  
`startEntry` updates `started_at = NOW()` (only if null — do not overwrite).  
`completeEntry` updates `is_completed = true`, `completed_at = NOW()`, `duration_seconds`.

### 1.2 `items.data.ts` (new)

```ts
export interface Item {
  id: string;
  entryId: string;
  userId: string;
  name: string;
  position: number;
  trackingType: TrackingType;
  note: string | null;
  createdAt: string;
}
```

Functions:
```ts
getItemsForEntry(supabase, entryId): Promise<Result<Item[]>>   // ordered by position
createItem(supabase, { entryId, userId, name, position }): Promise<Result<Item>>
updateItemNote(supabase, itemId, note): Promise<Result<void>>
deleteItem(supabase, itemId): Promise<Result<void>>
```

### 1.3 `item-sets.data.ts` (new)

```ts
export interface ItemSet {
  id: string;
  itemId: string;
  userId: string;
  setIndex: number;
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  distanceM: number | null;
  notes: string | null;
  createdAt: string;
}
```

Functions:
```ts
getItemSets(supabase, itemId): Promise<Result<ItemSet[]>>        // ordered by set_index
upsertItemSet(supabase, { itemId, userId, setIndex, weightKg, reps }): Promise<Result<ItemSet>>
deleteItemSet(supabase, itemId, setIndex): Promise<Result<void>> // delete by itemId + setIndex
```

`upsertItemSet` uses `onConflict: 'item_id,set_index'`.

### 1.4 `item-feedback.data.ts` (new)

```ts
export interface ItemFeedback {
  id: string;
  itemId: string;
  userId: string;
  rating: FeedbackRating;
  comment: string | null;
  createdAt: string;
}
```

Functions:
```ts
upsertItemFeedback(supabase, { itemId, userId, rating }): Promise<Result<ItemFeedback>>
```

`upsertItemFeedback` uses `onConflict: 'item_id'`.

### 1.5 Joined session query

`getSessionItems` is NOT a separate function. Instead, `items.data.ts` exports:

```ts
getSessionData(supabase, entryId): Promise<Result<SessionItem[]>>
```

Where `SessionItem` is:
```ts
export interface SessionItem {
  id: string;
  entryId: string;
  userId: string;
  name: string;
  position: number;
  trackingType: TrackingType;
  note: string | null;
  createdAt: string;
  sets: ItemSet[];
  feedback: ItemFeedback | null;
}
```

Uses Supabase nested select:
```ts
supabase.from('items')
  .select('*, item_sets(*), item_feedback(*)')
  .eq('entry_id', entryId)
  .order('position')
```

Zod schema handles the nested arrays/object.

---

## 2. Enums

**`src/app/shared/enums/feedback-rating.enum.ts`**
```ts
export enum FeedbackRating {
  Success = 'success',
  Hard = 'hard',
  Fail = 'fail',
}
```

**`src/app/shared/enums/tracking-type.enum.ts`**
```ts
export enum TrackingType {
  WeightReps = 'weight_reps',
  Duration = 'duration',
  Distance = 'distance',
}
```

**`src/app/shared/enums/distance-unit.enum.ts`**
```ts
export enum DistanceUnit {
  Meters = 'meters',
  Yards = 'yards',
  Km = 'km',
  Miles = 'miles',
}
```

**`src/app/shared/utils/unit-conversion.ts`** (new, pure functions):
```ts
metersToKm(m: number): number      // m / 1000
metersToMiles(m: number): number   // m / 1609.344
metersToYards(m: number): number   // m / 0.9144
kmToMeters(km: number): number
milesToMeters(miles: number): number
yardsToMeters(yards: number): number
```

**`SetChangedPayload`** — defined in `session-item.component.ts`, covers all three tracking types:
```ts
export interface SetChangedPayload {
  weightKg?: number | null;
  reps?: number | null;
  durationSec?: number | null;
  distanceM?: number | null;
}
```

---

## 3. SubjectFacade additions

New method `startWorkout()`:
1. Creates a new entry (today's date, current subjectId, userId)
2. On success, navigates to `/progress/subject/:subjectId/entry/:entryId`
3. On error, sets `_errorMessage`

SubjectComponent template: add a "Start workout" button in the header (top-right) that calls `facade.startWorkout()`. Show a loading spinner when `facade.isStartingWorkout()`.

---

## 4. EntryFacade — full implementation

### Resources

```ts
private readonly _entryResource = resource({
  params: () => ({ entryId: this.entryIdParam() }),
  loader: ({ params }) => params.entryId ? getEntry(this.supabase, params.entryId) : Promise.resolve(undefined),
});

private readonly _sessionDataResource = resource({
  params: () => ({ entryId: this.entryIdParam() }),
  loader: ({ params }) => params.entryId ? getSessionData(this.supabase, params.entryId) : Promise.resolve(undefined),
});

private readonly _previousEntryResource = resource({
  params: () => ({ subjectId: this.subjectIdParam(), userId: this.authService.userId() }),
  loader: ({ params }) => params.subjectId ? getLastCompletedEntry(this.supabase, params.subjectId, params.userId) : Promise.resolve(undefined),
});

// Second resource, chained: loads items for the previous entry
private readonly _previousSessionDataResource = resource({
  params: () => {
    const result = this._previousEntryResource.value();
    const currentEntryId = this.entryIdParam();
    const prevEntry = result?.success ? result.data : null;
    // Exclude if the previous entry IS the current entry (e.g. reopening a session)
    return { entryId: prevEntry && prevEntry.id !== currentEntryId ? prevEntry.id : undefined };
  },
  loader: ({ params }) => params.entryId ? getSessionData(this.supabase, params.entryId) : Promise.resolve(undefined),
});
```

### Computed signals

```ts
readonly entry: Signal<Entry | null>          // from _entryResource
readonly items: Signal<SessionItem[]>          // from _sessionDataResource
readonly isLoading: Signal<boolean>
readonly isCompleted: Signal<boolean>          // entry.isCompleted

// Previous-session lookup: Map<itemName, ItemSet[]>
readonly previousSetsMap: Signal<Map<string, ItemSet[]>>
```

`previousSetsMap` is computed from `_previousSessionDataResource`, mapping each item by name to its sets.

### Timer

```ts
private readonly _startedAt: Signal<Date | null>    // computed from entry
private readonly _elapsedSeconds: WritableSignal<number> = signal(0)
readonly elapsedSeconds: Signal<number> = this._elapsedSeconds
readonly formattedTime: Signal<string>   // computed: MM:SS from elapsedSeconds
```

In `constructor()`:
```ts
effect((onCleanup) => {
  const startedAt = this._startedAt();
  if (!startedAt) return;
  const tick = setInterval(() => {
    this._elapsedSeconds.set(Math.floor((Date.now() - startedAt.getTime()) / 1000));
  }, 1000);
  onCleanup(() => clearInterval(tick));
});
```

Separate effect: when entry loads with `started_at === null`, call `startEntry()`.

### Mutation methods

```ts
async addItem(name: string): Promise<void>
async deleteItem(itemId: string): Promise<void>
async saveSet(itemId: string, setIndex: number, weightKg: number | null, reps: number | null): Promise<void>
async deleteSet(itemId: string, setIndex: number): Promise<void>
async saveFeedback(itemId: string, rating: FeedbackRating): Promise<void>
async saveNote(itemId: string, note: string): Promise<void>
async openAddItemDialog(): Promise<void>        // opens dialog, calls addItem on confirm
async openCompleteDialog(): Promise<void>       // opens dialog, calls completeSession on confirm
async completeSession(durationSeconds: number, notes: string): Promise<void>
navigateBack(): void
```

After each mutation, call `.reload()` on `_sessionDataResource`.  
`addItem` sets `position` to `items().length` (next index).

---

## 5. EntryComponent — template

```html
<div class="entry" [class.entry--completed]="facade.isCompleted()">
  <header class="entry__header">
    <button type="button" (click)="navigateBack()">Back</button>
    <span class="entry__timer">{{ facade.formattedTime() }}</span>
    @if (!facade.isCompleted()) {
      <button type="button" (click)="openCompleteDialog()">Finish</button>
    }
  </header>

  <div class="entry__body">
    @if (facade.isLoading()) {
      <p>Loading…</p>
    } @else if (!facade.items().length) {
      <p class="entry__empty">{{ facade.translation()['EMPTY'] }}</p>
    } @else {
      @for (item of facade.items(); track item.id) {
        <app-session-item
          [item]="item"
          [previousSets]="facade.previousSetsFor(item.name)"
          [isReadOnly]="facade.isCompleted()"
          (setChanged)="onSetChanged($event)"
          (setRemoved)="onSetRemoved($event)"
          (feedbackChanged)="onFeedbackChanged($event)"
          (noteChanged)="onNoteChanged($event)"
          (deleteRequested)="onItemDeleted($event)" />
      }
    }

    @if (!facade.isCompleted()) {
      <button type="button" (click)="openAddItemDialog()">
        Add exercise
      </button>
    }
  </div>
</div>
```

`previousSetsFor(itemName)` returns `facade.previousSetsMap().get(itemName) ?? []`.

EntryComponent methods delegate to facade:
```ts
onSetChanged(event: SetChangedEvent): void { void this.facade.saveSet(...) }
onSetRemoved(event: SetRemovedEvent): void { void this.facade.deleteSet(...) }
onFeedbackChanged(event: FeedbackChangedEvent): void { void this.facade.saveFeedback(...) }
onNoteChanged(event: NoteChangedEvent): void { void this.facade.saveNote(...) }
onItemDeleted(itemId: string): void { void this.facade.deleteItem(itemId) }
openAddItemDialog(): void { void this.facade.openAddItemDialog() }
openCompleteDialog(): void { void this.facade.openCompleteDialog() }
```

---

## 6. SessionItemComponent

**Location:** `src/app/features/entry/components/session-item/`

Dumb component.

**Inputs:**
```ts
readonly item = input.required<SessionItem>()
readonly previousSets = input<ItemSet[]>([])
readonly isReadOnly = input<boolean>(false)
```

**Outputs:**
```ts
readonly setChanged = output<SetChangedEvent>()
readonly setRemoved = output<SetRemovedEvent>()
readonly feedbackChanged = output<FeedbackChangedEvent>()
readonly noteChanged = output<NoteChangedEvent>()
readonly deleteRequested = output<string>()  // itemId
```

**Output event types (defined in session-item.component.ts):**
```ts
export interface SetChangedEvent { itemId: string; setIndex: number; weightKg: number | null; reps: number | null; }
export interface SetRemovedEvent { itemId: string; setIndex: number; }
export interface FeedbackChangedEvent { itemId: string; rating: FeedbackRating; }
export interface NoteChangedEvent { itemId: string; note: string; }
```

**Template structure:**
```
item card
├── header: item name + delete button (if !isReadOnly)
├── previous note (if item.note exists — shown in blue info box)
├── previous sets display (if previousSets.length > 0)
├── @for set of item.sets; track set.setIndex
│   └── app-set-row [set] [isReadOnly] (changed) (removed)
├── add set button (if !isReadOnly)
├── feedback buttons: Success / Hard / Fail (if !isReadOnly; highlight current rating)
└── note input (if !isReadOnly) — collapsed by default, expands on click
```

**Local signal:** `_noteExpanded: WritableSignal<boolean>` — controls note input visibility.

---

## 7. SetRowComponent

**Location:** `src/app/features/entry/components/set-row/`

Dumb component. Renders different inputs depending on `trackingType`.

**Inputs:**
```ts
readonly set = input.required<ItemSet>()
readonly setNumber = input.required<number>()    // 1-based display index
readonly trackingType = input.required<TrackingType>()
readonly distanceUnit = input<DistanceUnit>(DistanceUnit.Km)
readonly isReadOnly = input<boolean>(false)
```

**Outputs:**
```ts
readonly changed = output<SetChangedPayload>()
readonly removed = output<void>()
```

### Tracking type variants

**`WeightReps`** (default):  
`Set N: [weight] kg × [reps] reps`  
Two `<input type="number">` fields. On blur, emit `changed` with `{ weightKg, reps }`.

**`Duration`**:  
`Set N: [MM]:[SS]`  
Two `<input type="number">` fields side by side (minutes 0–99, seconds 0–59).  
Local signals: `_minutes: WritableSignal<number>`, `_seconds: WritableSignal<number>`, both initialized from `set().durationSec`.  
On blur of either field: emit `changed` with `{ durationSec: minutes * 60 + seconds }`.  
Display only — the session timer (entry-level stopwatch) is separate from this per-set duration field.

**`Distance`**:  
`Set N: [distance] {unit}`  
One `<input type="number">` field + a unit label derived from `distanceUnit()`.  
Local signal `_displayValue: WritableSignal<number>` — initialized by converting `set().distanceM` into the display unit.  
On blur: convert display value back to meters, emit `changed` with `{ distanceM }`.

Conversion helpers (pure functions in `src/app/shared/utils/unit-conversion.ts`):
```ts
metersToKm(m: number): number     // m / 1000
metersToMiles(m: number): number  // m / 1609.344
kmToMeters(km: number): number
milesToMeters(miles: number): number
```

All local signals initialized from `set()` input. No `ngOnChanges` — use a `linkedSignal()` keyed on `set()` so the display resets if the parent reloads the set.

---

## 8. AddItemDialogComponent

**Location:** `src/app/features/entry/components/add-item-dialog/`

Identical pattern to `CreateSubjectDialogComponent`. Uses Signal Forms, single field: `name` (required).

MAT_DIALOG_DATA: none needed (no pre-filled data).  
Dialog result: `string` (item name) or `undefined` (cancelled).

---

## 9. CompleteSessionDialogComponent

**Location:** `src/app/features/entry/components/complete-session-dialog/`

**MAT_DIALOG_DATA input:**
```ts
export interface CompleteSessionDialogData {
  exerciseCount: number;
  totalSets: number;
  elapsedSeconds: number;   // pre-fills duration field
}
```

**Template:**
- Workout Complete header
- Stats: X exercises, Y total sets
- Duration field (editable, in minutes, pre-filled from `elapsedSeconds / 60`)
- Optional notes textarea
- Cancel / Save buttons

Dialog result: `{ durationSeconds: number; notes: string } | undefined`

---

## 10. i18n — ENTRY section

Replace the stub `ENTRY` section with:

```json
"ENTRY": {
  "BACK": "Back",
  "FINISH": "Finish",
  "LOADING": "Loading session…",
  "EMPTY": "No exercises yet. Tap 'Add exercise' to get started.",
  "ADD_EXERCISE": "Add exercise",
  "ADD_EXERCISE_TITLE": "Add exercise",
  "EXERCISE_NAME_LABEL": "Exercise name",
  "EXERCISE_NAME_PLACEHOLDER": "e.g. Deadlift",
  "EXERCISE_NAME_REQUIRED": "Exercise name is required",
  "ADD_EXERCISE_SAVE": "Add",
  "ADD_EXERCISE_CANCEL": "Cancel",
  "PREVIOUS_LABEL": "Last time",
  "PREVIOUS_NOTE_LABEL": "Note from last session",
  "SET_NUMBER": "Set",
  "WEIGHT_UNIT": "kg",
  "REPS_UNIT": "reps",
  "ADD_SET": "Add set",
  "REMOVE_SET": "Remove",
  "FEEDBACK_LABEL": "How was it?",
  "FEEDBACK_SUCCESS": "Done",
  "FEEDBACK_HARD": "Hard",
  "FEEDBACK_FAIL": "Fail",
  "NOTE_PLACEHOLDER": "Add a note…",
  "DELETE_EXERCISE": "Delete exercise",
  "DELETE_EXERCISE_TITLE": "Delete exercise",
  "DELETE_EXERCISE_MESSAGE": "Remove this exercise and all its sets?",
  "DELETE_EXERCISE_CONFIRM": "Delete",
  "DELETE_EXERCISE_CANCEL": "Cancel",
  "COMPLETE_TITLE": "Workout Complete!",
  "COMPLETE_DURATION_LABEL": "Duration (minutes)",
  "COMPLETE_EXERCISES_LABEL": "Exercises",
  "COMPLETE_SETS_LABEL": "Total sets",
  "COMPLETE_NOTES_LABEL": "Session notes",
  "COMPLETE_NOTES_PLACEHOLDER": "Optional notes…",
  "COMPLETE_SAVE": "Save",
  "COMPLETE_CANCEL": "Cancel",
  "DISTANCE_UNIT_METERS": "m",
  "DISTANCE_UNIT_YARDS": "yd",
  "DISTANCE_UNIT_KM": "km",
  "DISTANCE_UNIT_MILES": "mi",
  "DURATION_MINUTES": "min",
  "DURATION_SECONDS": "sec"
}
```

---

## 11. User Settings — Distance Unit

`SessionItemComponent` needs to know the user's preferred distance unit to pass into `SetRowComponent`. The unit is stored in `user_settings.module_settings.workout.distance_unit` (`'km'` | `'miles'` | `'meters'`).

For Phase 5, read the setting lazily:
- Add `getUserSettings(supabase, userId): Promise<Result<UserSettings>>` to a new `src/app/core/services/data/user-settings.data.ts`.
- `EntryFacade` loads it in a resource; exposes `distanceUnit: Signal<DistanceUnit>` (defaults to `DistanceUnit.Km` while loading).
- Passed down to `SessionItemComponent` via `[distanceUnit]` input, forwarded to each `SetRowComponent`.

`UserSettings` shape (only workout slice needed here):
```ts
export interface WorkoutSettings {
  distance_unit: string;
  weight_unit: string;
}
```

---

## 13. SubjectComponent changes

Add a "Start workout" (FAB or header button) that calls `facade.startWorkout()`.  
Show a spinner while `facade.isStartingWorkout()`.  
Entry cards in the list remain clickable to view past sessions (read-only mode in EntryComponent via `isCompleted`).

---

## File Checklist

### New files
- `src/app/core/services/data/items.data.ts`
- `src/app/core/services/data/item-sets.data.ts`
- `src/app/core/services/data/item-feedback.data.ts`
- `src/app/core/services/data/user-settings.data.ts`
- `src/app/shared/enums/feedback-rating.enum.ts`
- `src/app/shared/enums/tracking-type.enum.ts`
- `src/app/shared/enums/distance-unit.enum.ts`
- `src/app/shared/utils/unit-conversion.ts`
- `src/app/features/entry/components/session-item/session-item.component.{ts,html,scss}`
- `src/app/features/entry/components/set-row/set-row.component.{ts,html,scss}`
- `src/app/features/entry/components/add-item-dialog/add-item-dialog.component.{ts,html,scss}`
- `src/app/features/entry/components/complete-session-dialog/complete-session-dialog.component.{ts,html,scss}`

### Modified files
- `src/app/core/services/data/entries.data.ts` — add `createEntry`, `startEntry`, `completeEntry`, `getLastCompletedEntry`
- `src/app/features/entry/entry.component.{ts,html,scss}`
- `src/app/features/entry/entry.facade.ts`
- `src/app/features/subject/subject.component.{ts,html}`
- `src/app/features/subject/subject.facade.ts`
- `src/assets/i18n/en.json`

---

## Key Decisions

1. **Auto-save sets** — Sets are upserted on blur of weight/reps inputs. Feedback is saved immediately on click. Notes are saved on blur. This prevents data loss if the session is interrupted.

2. **Timer** — Uses `setInterval` in an `effect()` in `EntryFacade`. The timer starts when `started_at` is first set. Elapsed time is always recalculated as `Date.now() - startedAt`, so it survives component re-renders.

3. **Session start** — `SubjectFacade.startWorkout()` calls `createEntry` + `startEntry` (two mutations) before navigation. Entry arrives at the component already started.

4. **Previous session lookup** — Two chained resources: first gets the last completed entry for the subject, second loads its `SessionItem[]`. This avoids a complex joined query.

5. **Read-only mode** — Completed entries viewed via the history list open the same `EntryComponent`, but with inputs/buttons hidden based on `isCompleted`. No separate route.

6. **Set count** — `SessionItemComponent` derives the displayed set count from `item().sets.length`. Adding a set calls `facade.saveSet(itemId, item.sets.length, null, null)` (creates an empty row). Removing calls `facade.deleteSet(itemId, setIndex)`.

7. **No `model()` on set inputs** — `SetRowComponent` owns local signals for all input fields, initialized via `linkedSignal()` from `set()`. Emits `changed` on blur only.

8. **Duration input (MM:SS)** — Timed exercises show two number fields (minutes + seconds). The entry-level stopwatch is a separate concern from per-set duration; they are independent.

9. **Distance units** — Four options: `meters`, `yards`, `km`, `miles`. Display unit driven by the user's `module_settings.workout.distance_unit`. Stored value is always meters. Conversion in `SetRowComponent` on init (meters → display) and on blur (display → meters). Default to `DistanceUnit.Km` if the setting is absent.

10. **`linkedSignal()` for set inputs** — Using `linkedSignal()` (not plain `signal()`) so that if the parent reloads the session data (e.g. after a `.reload()`), the display values reset to match the new DB state rather than sticking to stale local values.
