# Phase 6 — Daily Log

**Branch:** `feature/6-daily-log`  
**Target:** `development`  
**Prerequisite:** Migrations 012 (`water_intake_liters`, `waist_cm`) and 015 (drop `active_module` constraint) run on Supabase before testing.

---

## DB columns used (post-migration-012)

Table: `daily_log_entries`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `user_id` | UUID FK | |
| `logged_date` | DATE | Unique per user |
| `sleep_hours` | NUMERIC(4,2) | nullable |
| `weight_kg` | NUMERIC(5,2) | nullable |
| `water_intake_liters` | NUMERIC(4,2) | nullable — added by 012 |
| `waist_cm` | NUMERIC(4,1) | nullable — added by 012 |
| `notes` | TEXT | nullable — not tracked in Phase 6 UI |

`body_fat_percent` exists in DB but is not part of the Phase 6 domain definition — excluded from the interface and service.

Upsert conflict target: `(user_id, logged_date)` — one entry per day per user.

---

## Nav change

Insert Daily Log as the 2nd tab:

**Progress | Daily Log | KPI | Menu**

Rationale: data entry (Daily Log) precedes analytics (KPI) in the user's mental model.

---

## Commit 1 — Data layer

### `src/app/core/services/data/daily-log.service.ts` (new)

**Zod schemas:**
```typescript
const dailyLogSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  logged_date: z.string(),
  sleep_hours: z.number().nullable(),
  weight_kg: z.number().nullable(),
  water_intake_liters: z.number().nullable(),
  waist_cm: z.number().nullable(),
});
type DailyLogRaw = z.infer<typeof dailyLogSchema>;
const dailyLogArraySchema = z.array(dailyLogSchema);
```

**Domain interface:**
```typescript
export interface DailyLog {
  id: string;
  userId: string;
  loggedDate: string;       // 'YYYY-MM-DD'
  sleepHours: number | null;
  weightKg: number | null;
  waterLiters: number | null;
  waistCm: number | null;
}
```

**Mutation input:**
```typescript
export interface UpsertDailyLogInput {
  userId: string;
  loggedDate: string;
  sleepHours: number | null;
  weightKg: number | null;
  waterLiters: number | null;
  waistCm: number | null;
}
```

**`@Service()` class `DailyLogsService`:**

`getDailyLogsForRange(userId: string, from: string, to: string): Promise<Result<DailyLog[]>>`
```
.from('daily_log_entries')
.select('*')
.eq('user_id', userId)
.gte('logged_date', from)
.lte('logged_date', to)
.order('logged_date', { ascending: false })
```

`upsertDailyLog(input: UpsertDailyLogInput): Promise<Result<DailyLog>>`
```
.from('daily_log_entries')
.upsert({
  user_id: input.userId,
  logged_date: input.loggedDate,
  sleep_hours: input.sleepHours,
  weight_kg: input.weightKg,
  water_intake_liters: input.waterLiters,
  waist_cm: input.waistCm,
}, { onConflict: 'user_id,logged_date' })
.select()
.single()
```

### `src/assets/i18n/en.json`

Add top-level `DAILY_LOG` section:
```json
"DAILY_LOG": {
  "TITLE": "Daily Log",
  "LOADING": "Loading...",
  "EMPTY": "No entries yet. Start by logging today.",
  "ERROR": "Failed to load daily log.",
  "LOG_TODAY": "Log today",
  "SLEEP": "Sleep",
  "WEIGHT": "Weight",
  "WATER": "Water",
  "WAIST": "Waist",
  "SLEEP_UNIT": "h",
  "WEIGHT_UNIT": "kg",
  "WATER_UNIT": "L",
  "WAIST_UNIT": "cm",
  "DIALOG": {
    "TITLE_CREATE": "Log Entry",
    "TITLE_EDIT": "Edit Entry",
    "SLEEP_LABEL": "Sleep (hours)",
    "WEIGHT_LABEL": "Weight (kg)",
    "WATER_LABEL": "Water (L)",
    "WAIST_LABEL": "Waist (cm)",
    "SAVE": "Save",
    "CANCEL": "Cancel"
  }
}
```

Add `NAV.DAILY_LOG = "Daily Log"` to the existing `NAV` section.

---

## Commit 2 — Route + nav + stubs

### `src/app/core/enums/app-route.enum.ts`
Add: `DailyLog = 'daily-log'`

### `src/app/shared/enums/app-icon.enum.ts`
Add: `DailyLog = '/assets/icons/daily-log.svg'`

### `src/assets/icons/daily-log.svg` (new)
24×24 SVG icon for the nav tab (calendar or notebook motif, stroke-based to match the existing icon style).

### `src/app/features/home/home.facade.ts`
Add to `TABS` at index 1 (between Progress and KPI):
```typescript
{ route: AppRoute.DailyLog, labelKey: 'DAILY_LOG', icon: AppIcon.DailyLog },
```
No template change needed — the home component renders tabs dynamically from `facade.tabs()`.

### `src/app/features/daily-log/daily-log.component.ts` (stub)
```typescript
@Component({
  selector: 'app-daily-log',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DailyLogFacade],
})
export class DailyLogComponent {}
```

### `src/app/features/daily-log/daily-log.facade.ts` (stub)
```typescript
@Service({ autoProvided: false })
export class DailyLogFacade {}
```

### `src/app/app.routes.ts`
Add under shell children (after Progress routes, before KPI):
```typescript
{
  path: AppRoute.DailyLog,
  loadComponent: () =>
    import('./features/daily-log/daily-log.component').then((m) => m.DailyLogComponent),
},
```

---

## Commit 3 — 7-day list

### `src/app/features/daily-log/daily-log.facade.ts` (full)

```typescript
@Service({ autoProvided: false })
export class DailyLogFacade {
  private readonly authService: AuthService = inject(AuthService);
  private readonly dailyLogsService: DailyLogsService = inject(DailyLogsService);
  private readonly translateService: TranslateService = inject(TranslateService);

  readonly translation: Signal<Record<string, string>> = toSignal(
    this.translateService.stream('DAILY_LOG'),
    { initialValue: {} as Record<string, string> },
  );

  private readonly _weekResource: ResourceRef<Result<DailyLog[]> | undefined> = resource({
    params: () => ({ userId: this.authService.userId() }),
    loader: ({ params }) => {
      const to = new Date();
      const from = new Date();
      from.setDate(from.getDate() - 6);
      return this.dailyLogsService.getDailyLogsForRange(
        params.userId,
        this.formatDate(from),
        this.formatDate(to),
      );
    },
  });

  readonly isLoading: Signal<boolean> = computed(() => this._weekResource.isLoading());

  readonly hasError: Signal<boolean> = computed(() => {
    const result = this._weekResource.value();
    return !!result && !result.success;
  });

  readonly entries: Signal<DailyLog[]> = computed(() => {
    const result = this._weekResource.value();
    if (!result?.success) {
      return [];
    }
    return result.data;
  });

  readonly isEmpty: Signal<boolean> = computed(
    () => !this.isLoading() && !this.hasError() && !this.entries().length,
  );

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
```

### `src/app/features/daily-log/components/log-card/log-card.component.ts` (new — dumb)

Inputs:
- `readonly entry: InputSignal<DailyLog> = input.required<DailyLog>()`
- `readonly translation: InputSignal<Record<string, string>> = input.required<Record<string, string>>()`

Output:
- `readonly editClicked: OutputEmitterRef<DailyLog> = output<DailyLog>()`

Template shows: date (formatted), and each of sleep / weight / water / waist if non-null. Tapping the card emits `editClicked`.

### `src/app/features/daily-log/daily-log.component.ts` (full)

Imports: `DailyLogFacade`, `LogCardComponent`, `MatButtonModule`, `MatIconModule`, `DatePipe`

Template structure:
```html
@if (facade.isLoading()) {
  <!-- loading state -->
} @else if (facade.hasError()) {
  <!-- error state -->
} @else if (facade.isEmpty()) {
  <!-- empty state -->
} @else {
  @for (entry of facade.entries(); track entry.id) {
    <app-log-card [entry]="entry" [translation]="facade.translation()" (editClicked)="onEditEntry($event)" />
  }
}

<!-- FAB: Log today -->
<button mat-fab (click)="onLogToday()">
  <mat-icon>add</mat-icon>
</button>
```

Component methods:
- `protected onLogToday(): void` — calls `void this.facade.openLogDialog(this.today)`
- `protected onEditEntry(entry: DailyLog): void` — calls `void this.facade.openLogDialog(entry.loggedDate, entry)`
- `protected readonly today: string` — computed once in field init: `new Date().toISOString().split('T')[0]`

---

## Commit 4 — Log entry dialog

### `src/app/shared/enums/dialog-type.enum.ts`
Add: `LogEntry = 'LOG_ENTRY'`

### `src/app/shared/components/log-entry-dialog/log-entry-dialog.component.ts` (new)

**Exported types:**
```typescript
export interface LogEntryDialogData {
  date: string;
  existingEntry?: DailyLog;
}

export interface LogEntryFormData {
  loggedDate: string;
  sleepHours: number | null;
  weightKg: number | null;
  waterLiters: number | null;
  waistCm: number | null;
}
```

**Form model** (strings — Signal Forms works with string fields; parse to numbers on submit):
```typescript
interface LogEntryModel {
  sleepHours: string;
  weightKg: string;
  waterLiters: string;
  waistCm: string;
}
```

**Implementation notes:**
- Static `DIALOG_WIDTH = '360px'`
- Inject `MAT_DIALOG_DATA` typed as `LogEntryDialogData`
- Pre-fill form model from `existingEntry` if provided (convert numbers to strings)
- All fields optional — no validators required
- `submitted: OutputEmitterRef<LogEntryFormData> = output<LogEntryFormData>()`
- `closed: OutputEmitterRef<void> = output<void>()`
- Dialog title: `existingEntry ? translation['DIALOG.TITLE_EDIT'] : translation['DIALOG.TITLE_CREATE']`
- On submit: parse each field — `parseFloat(val)` where non-empty, else `null`
- Use `UiInputComponent` with `InputType.Number` for each field (available after refactor branch merges)

### `src/app/shared/services/dialog.service.ts`

Add import for `LogEntryDialogComponent`, `LogEntryDialogData`, `LogEntryFormData`.

Add overload:
```typescript
open(type: DialogType.LogEntry, data: LogEntryDialogData): Promise<LogEntryFormData | undefined>;
```

Add case:
```typescript
case DialogType.LogEntry:
  return this.openDialog<LogEntryFormData>(
    LogEntryDialogComponent,
    { width: LogEntryDialogComponent.DIALOG_WIDTH, data },
  );
```

### `src/app/features/daily-log/daily-log.facade.ts` — additions

Inject: `DialogService`, `Router`

```typescript
async openLogDialog(loggedDate: string, existingEntry?: DailyLog): Promise<void> {
  const formData: LogEntryFormData | undefined = await this.dialogService.open(
    DialogType.LogEntry,
    { date: loggedDate, existingEntry },
  );
  if (!formData) {
    return;
  }
  await this.upsertLog(formData);
}

private async upsertLog(formData: LogEntryFormData): Promise<void> {
  const result: Result<DailyLog> = await this.dailyLogsService.upsertDailyLog({
    userId: this.authService.userId(),
    loggedDate: formData.loggedDate,
    sleepHours: formData.sleepHours,
    weightKg: formData.weightKg,
    waterLiters: formData.waterLiters,
    waistCm: formData.waistCm,
  });
  if (!result.success) {
    return;
  }
  this._weekResource.reload();
}
```

---

## Files changed summary

| File | Status |
|------|--------|
| `src/app/core/services/data/daily-log.service.ts` | New |
| `src/app/core/enums/app-route.enum.ts` | Modified |
| `src/app/shared/enums/app-icon.enum.ts` | Modified |
| `src/app/shared/enums/dialog-type.enum.ts` | Modified |
| `src/app/shared/services/dialog.service.ts` | Modified |
| `src/app/shared/components/log-entry-dialog/` (3 files) | New |
| `src/app/features/home/home.facade.ts` | Modified |
| `src/app/features/daily-log/daily-log.facade.ts` | New |
| `src/app/features/daily-log/daily-log.component.ts` | New |
| `src/app/features/daily-log/daily-log.component.html` | New |
| `src/app/features/daily-log/daily-log.component.scss` | New |
| `src/app/features/daily-log/components/log-card/` (3 files) | New |
| `src/app/app.routes.ts` | Modified |
| `src/assets/i18n/en.json` | Modified |
| `src/assets/icons/daily-log.svg` | New |
