# Phase 10 — Settings

**Branch:** `feature/10-settings`
**Target:** `development`

---

## Context

User priorities shifted: Goals (Phase 8) and KPI Dashboard (Phase 9) are on hold; Settings (Phase 10), Auth Extensions (Phase 2b), and Security (Phase 11) are now priority, starting with Settings. This gives users control over their preferred weight/distance units, which the Entry/workout-session feature already partially reads (`entry.facade.ts` injects `UserSettingsService.getWorkoutSettings()` for distance-unit display) but users currently have no UI to change.

No DB migration is required — settings persist into the existing `user_settings.module_settings.workout` JSONB column, which already has a read path (`getWorkoutSettings`) from Phase 5. This phase adds the write path and the UI.

---

## Design decisions

- **No separate "unit system" field.** The backlog phrase "unit system (metric/imperial)" isn't a real DB column or a third control — it's just describing the combined effect of the two toggles below. Adding a persisted third field would need a migration outside scope. A user picking Lb+Miles has effectively chosen Imperial; no extra state needed.
- **No `SettingsRoute` enum.** Settings is a single flat page under the shell, same as Profile — no sub-routes exist, unlike Progress's `ProgressRoute`.
- **Toggle groups, not `<select>` or Signal Forms.** Weight unit (kg/lb) and distance unit (km/mi) are binary/small-set toggles with no validation, not free-text/date fields. Following the exact precedent already in the codebase: `SessionItemFeedbackComponent` (`src/app/features/entry/components/session-item-feedback/`) renders one `<button>` per enum value with a `[class.x--active]` BEM modifier driven by a `computed()` signal — no native select, no Signal Forms field. Confirmed via direct read of `session-item-feedback.component.html`.
- **Auto-save, no submit button** (per backlog spec). Each button click:
  1. Optimistically sets the local signal immediately (instant active-state feedback).
  2. Sets a `saving` signal that disables both toggle groups for the request's duration — this makes a double-click race structurally impossible without needing a request-token guard.
  3. On success: transient "Saved" message, auto-clears after 2s.
  4. On failure: rolls back the just-changed field to its prior value, shows a persistent "Failed to save" message.
- **Fetch-then-merge for the write**, not a Postgres JSONB merge operator (no RPC precedent exists anywhere in this codebase). `updateWorkoutSettings()` fetches current `module_settings`, spread-merges only the `workout` key on top (preserving any other future module keys), then does a plain `.update()` — no upsert, since `getWorkoutSettings` already assumes a `user_settings` row exists per user (consistent with how every other data service in this repo works).
- **`weightUnit` type change is safe.** Confirmed via grep: `weightUnit` is only referenced inside `user-settings.service.ts` itself — nothing else in `src/` reads it, so changing its type from `string` to a new `WeightUnit` enum breaks nothing.
- **Distance unit selector only exposes 2 of the existing 4 `DistanceUnit` values** (Km/Miles) — Meters/Yards remain per-exercise-set units for the Entry feature (e.g. swimming), not a system-wide preference.

---

## Files to Create / Modify

### Commit 1 — Data layer

| File | Action |
|------|--------|
| `src/app/shared/enums/weight-unit.enum.ts` | Create |
| `src/app/core/services/data/user-settings.service.ts` | Extend |
| `src/assets/i18n/en.json` | Add `MENU.SETTINGS` + `SETTINGS` section |

**`weight-unit.enum.ts`**
```ts
export enum WeightUnit {
  Kg = 'kg',
  Lb = 'lb',
}
```

**`user-settings.service.ts` changes:**
- `workoutSettingsSchema.weight_unit`: `z.string().optional()` → `z.nativeEnum(WeightUnit).optional()`
- `WorkoutSettings.weightUnit`: `string` → `WeightUnit`
- `mapWorkoutSettings` default: `'kg'` → `WeightUnit.Kg`
- Add `UpdateWorkoutSettingsInput { distanceUnit?: DistanceUnit; weightUnit?: WeightUnit }` and `updateWorkoutSettings(userId, input): Promise<Result<WorkoutSettings>>` — fetch current `module_settings`, merge only the `workout` key, `.update()`, re-validate with the existing `userSettingsSchema`, return via `mapWorkoutSettings`.

**`en.json` additions:**
```json
"MENU": { "PROFILE": "Profile", "SETTINGS": "Settings" },
"SETTINGS": {
  "LOADING": "Loading settings…",
  "LOAD_ERROR": "Failed to load settings",
  "WEIGHT_UNIT_LABEL": "Weight unit",
  "WEIGHT_UNIT_KG": "kg",
  "WEIGHT_UNIT_LB": "lb",
  "DISTANCE_UNIT_LABEL": "Distance unit",
  "DISTANCE_UNIT_KM": "km",
  "DISTANCE_UNIT_MILES": "mi",
  "SAVE_SUCCESS": "Settings saved",
  "SAVE_ERROR": "Failed to save settings"
}
```

---

### Commit 2 — Route + shell wiring

| File | Action |
|------|--------|
| `src/app/core/enums/app-route.enum.ts` | Add `Settings = 'settings'` |
| `src/app/app.routes.ts` | Add lazy route under shell children (copy Profile's route entry shape) |
| `src/app/features/settings/settings.component.ts` | Create stub |
| `src/app/features/settings/settings.facade.ts` | Create stub |
| `src/app/features/menu/menu.component.ts` | Add `settingsLabel` computed + `onNavigateToSettings()` |
| `src/app/features/menu/menu.component.html` | Add second `<app-ui-button>` for Settings, right after Profile's |

---

### Commit 3 — Settings form

| File | Action |
|------|--------|
| `src/app/features/settings/settings.facade.ts` | Full implementation |
| `src/app/features/settings/settings.component.ts` | Full implementation |
| `src/app/features/settings/settings.component.html` | Full implementation |
| `src/app/features/settings/settings.component.scss` | Full implementation |

**`SettingsFacade`** (`@Service({ autoProvided: false })`) — `resource()`-backed load mirroring `ProfileFacade`'s shape, plus:
- `_weightUnit`/`_distanceUnit` `WritableSignal`s, pre-filled via a one-shot `effect()` guarded by a `loaded` boolean (same pattern as `ProfileComponent`'s `_heightCm` pre-fill).
- `_saving`/`_saveSuccess`/`_saveError` signals.
- `setWeightUnit(unit)`/`setDistanceUnit(unit)` — optimistic set, call a shared private `save()` that disables during the request and rolls back on failure (see Save behavior above).

**`SettingsComponent`** — two toggle groups (weight: kg/lb; distance: km/mi), templated exactly like `SessionItemFeedbackComponent`: raw `<button [type]="ButtonType.Button">` elements with `[class.settings__btn--active]` computed from the facade's `weightUnit()`/`distanceUnit()` signals, `[disabled]="facade.saving()"`. No `<h1>`/`<header>` (matches Profile's flat-content convention). Loading/error states mirror Profile's `@if (facade.isLoading())` / `@else if (facade.hasError())` chain.

---

## Toggle field summary

| Field | Control | Values |
|-------|---------|--------|
| weight_unit | 2-button toggle group | kg / lb |
| distance_unit | 2-button toggle group | km / mi |

---

## Routing note

Settings is a peer of Progress / DailyLog / KPI / Menu / Profile under the shell — not nested inside any tab. Bottom nav (and the new desktop sidebar from the Design Refresh) stays visible.

---

## Out of scope

- A third persisted "unit system" field or quick-toggle convenience control — no DB column exists for it; could be added later as a pure UI shortcut with no schema change.
- Retrofitting Profile/Daily Log/Entry displays to actually respect the saved `weightUnit` (e.g. converting displayed kg values to lb) — only `distanceUnit` is currently consumed anywhere (`entry.facade.ts`), and wiring broader unit-aware display is separate follow-up work.
- `015_simplify_settings.sql` (drop `active_module` constraint) — pending migration unrelated to this phase; doesn't affect the `module_settings` JSONB path used here.
- Phase 2b (Auth Extensions) and Phase 11 (Security) — separate priority phases, not started in this plan.

---

## Verification

1. `ng build` passes after each commit.
2. Manual: navigate Menu → Settings, confirm current values load correctly (from a fresh row, defaults to kg/km).
3. Click each toggle button — confirm optimistic UI update, brief "Saved" message, and that a page reload shows the persisted choice.
4. Simulate a save failure (e.g. temporarily break the network) — confirm the toggle rolls back to its prior state and the error message appears.
5. Confirm `entry.facade.ts` still compiles and behaves correctly with `WorkoutSettings.weightUnit` now typed as `WeightUnit` instead of `string` (no consumer reads this field elsewhere, confirmed via grep).
