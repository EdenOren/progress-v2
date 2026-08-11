# Feature — Daily Log Hidden Columns

**Branch:** `feature/27-daily-log-hidden-columns`
**Target:** `development`

---

## Goal

Let a user stop showing metrics they don't track. The Daily Log list renders four
metric tiles per card — Sleep, Weight, Water, Waist — and every one renders on every
day whether or not it was logged, so the same metric lands in the same position on
every row and a week of weights reads as a column. Someone who never logs waist
measurements pays for four dead columns forever.

A user can switch any of the four columns off. The preference is per-user, stored in
Supabase, and applies to the Daily Log list.

Decisions taken up front (asked and confirmed before planning):

1. **The control lives on the Settings screen**, as a third group under Weight unit
   and Distance unit — not on the Daily Log header. All preferences stay in one place.
2. **Display only.** Hiding a column removes it from the Daily Log cards; the Log
   Entry dialog keeps all four fields, so a hidden metric is still loggable. This is a
   viewing preference, not a "stop tracking this" switch.
3. **Stored in the existing `user_settings.module_settings` JSONB**, under a new
   `daily_log` key alongside the existing `workout` block. **No migration** — the
   column is already JSONB with RLS in place.

```jsonc
// user_settings.module_settings
{
  "workout":   { "weight_unit": "kg", "distance_unit": "km" },
  "daily_log": { "hidden_metrics": ["water"] }
}
```

Stored values are never deleted. Hiding Water hides the tile; the `water_intake_liters`
figures stay in `daily_log_entries` and reappear the moment the column is switched back on.

## Design Notes

**Hidden metrics, not visible metrics.** The array lists what is *off*. A row written
before this feature has no `daily_log` key at all, so it decodes to "nothing hidden" —
every existing user keeps all four columns with no backfill. A metric added later also
defaults to visible.

**Unknown keys must not break the parse.** `hidden_metrics` is validated as
`z.array(z.string())`, not `z.array(z.nativeEnum(LogMetricKey))`, and the mapper filters
down to the enum members it recognises. A stale or hand-edited key in that array would
otherwise fail `safeParse` on the whole `user_settings` row and take out **both** the
Settings screen and the Daily Log weight-unit conversion for that user.

**At least one column stays visible.** Turning off the last remaining column is blocked
in the facade — its toggle renders disabled — rather than allowing an empty card that
looks like a rendering bug.

**The alignment invariant survives.** `log-card.component.ts:76-78` documents why an
unlogged metric renders a dash instead of dropping its tile: dropping it would shift its
neighbours left and destroy the column. Hiding is uniform across every row, so columns
still line up; per-day gaps still render a dash. That comment gets amended, not deleted.

**Column count reaches SCSS as a custom property.** `grid-template-columns` is currently
a hardcoded `repeat(2, …)` / `repeat(4, …)`; with three tiles at `md` the fourth cell would
sit empty. The count is bound as a CSS custom property so the visible tiles spread evenly.
Two properties are needed, both computed in TypeScript — CSS `repeat()` takes a literal
`<integer>` and rejects `calc()`/`min()`, so the phone cap of two columns can't be
expressed as `repeat(min(2, var(--count)), …)`.

**Concurrent-write caveat (pre-existing, not worsened).** `updateWorkoutSettings` already
does a read-modify-write of the whole JSONB blob; the new daily-log writer does the same
and preserves the `workout` key. Two overlapping saves could clobber each other. Every
toggle in Settings is disabled while `saving()` is true, which serialises clicks on the
one screen that writes this row.

## Changes

| File | Change |
|---|---|
| `shared/enums/log-metric-key.enum.ts` | **Moved** from `features/daily-log/enums/log-metric-key.enum.ts`. Now cross-feature (core service + settings + daily-log), so per the enum rule it belongs in `shared/enums/`. Contents unchanged. Only importer today is `log-card.component.ts`. Declaration order (Sleep, Weight, Water, Waist) becomes load-bearing — Settings derives its toggle row from `Object.values(LogMetricKey)` and it must read in the same order as the card tiles; a comment on the enum records that. |
| `core/services/data/user-settings.service.ts` | Add `dailyLogSettingsSchema` (`hidden_metrics: z.array(z.string()).optional()`) and a `daily_log` key on `userSettingsSchema.module_settings`. Add `DailyLogSettings { hiddenMetrics: LogMetricKey[] }`, `ModuleSettings { workout: WorkoutSettings; dailyLog: DailyLogSettings }`, `UpdateDailyLogSettingsInput { hiddenMetrics: LogMetricKey[] }`. Extract the shared select+validate into a private `fetchUserSettings(userId): Promise<Result<UserSettingsRaw>>`. Add `getModuleSettings(userId): Promise<Result<ModuleSettings>>` (both blocks in one round trip) and `updateDailyLogSettings(userId, input): Promise<Result<ModuleSettings>>` (read-modify-write preserving `workout`, same merge shape as `updateWorkoutSettings`). `mapDailyLogSettings` filters raw strings through the `LogMetricKey` members. **`getWorkoutSettings` keeps its exact signature** — `entry.facade.ts` only needs the distance unit and is not touched. |
| `features/settings/settings.facade.ts` | Loader switches to `getModuleSettings`; the existing hydration `effect` also seeds a new `_hiddenMetrics: WritableSignal<readonly LogMetricKey[]>`. Expose `metricToggles: Signal<MetricToggle[]>` — `{ key, label, isVisible, isLastVisible }` — built from `Object.values(LogMetricKey)`, the `SETTINGS` translation stream, and the hidden set, so the template never compares a string or reads a raw key. Add `toggleMetric(key: LogMetricKey): void` (optimistic write + rollback, no-op when it would hide the last visible column). Generalise the private `save(input, rollback)` to `save(operation: () => Promise<Result<unknown>>, rollback: () => void)` so both unit setters and the new toggle share the saving/success/error/rollback path unchanged. Add `private static readonly METRIC_LABEL_KEYS: Record<LogMetricKey, string>` mapping each key to its i18n key. |
| `features/settings/settings.component.html` | New `settings__group` after Distance unit: a label, a hint line, and a `role="group" aria-labelledby` row of `@for`-rendered chip buttons — `[class.settings__chip--active]="toggle.isVisible"`, `[attr.aria-pressed]="toggle.isVisible"`, `[disabled]="facade.saving() || toggle.isLastVisible"`, `[type]="buttonType.Button"`, `(click)="onMetricToggled(toggle.key)"`. |
| `features/settings/settings.component.ts` | Add `protected onMetricToggled(key: LogMetricKey): void` delegating to the facade. |
| `features/settings/settings.component.scss` | New `__chips` / `__chip` / `__chip--active` block. Deliberately **not** reusing `__buttons`/`__btn`: that block is a segmented control whose recessed track says "these are alternatives", which is the wrong message for four independent on/off switches. Chips are separate pills sharing the existing active/hover/focus-visible/disabled treatments. Add `__hint` (small, secondary text). |
| `features/daily-log/daily-log.facade.ts` | `_userSettingsResource` loader switches to `getModuleSettings`; `weightUnit` reads `result.data.workout.weightUnit`. Add `hiddenMetrics: Signal<readonly LogMetricKey[]>`, defaulting to `[]` on loading/error so a settings failure shows all four columns rather than none. |
| `features/daily-log/daily-log.component.html` | Pass `[hiddenMetrics]="facade.hiddenMetrics()"` to `<app-log-card>`. |
| `features/daily-log/components/log-card/log-card.component.ts` | Import path for `LogMetricKey` updates to `shared/enums`. Add `hiddenMetrics: InputSignal<readonly LogMetricKey[]>` (default `[]`). `metrics` computed filters the candidate list by it. Add `metricColumns: Signal<number>` (= visible count) and `compactMetricColumns: Signal<number>` (= `Math.min(2, count)`). Amend the existing alignment comment to cover uniform hiding. |
| `features/daily-log/components/log-card/log-card.component.html` | Bind both counts on `.log-card__metrics` via `[style.--log-card-metric-columns]` / `[style.--log-card-metric-columns-compact]`. |
| `features/daily-log/components/log-card/log-card.component.scss` | `__metrics` gains fallback declarations (`4` / `2`) and swaps its fixed `repeat()` counts for `repeat(var(--log-card-metric-columns-compact), minmax(0, 1fr))`, and `repeat(var(--log-card-metric-columns), minmax(0, 1fr))` at `md`. |
| `assets/i18n/en.json` | Under `SETTINGS`: `DAILY_LOG_COLUMNS_LABEL` ("Daily log columns"), `DAILY_LOG_COLUMNS_HINT` ("Hidden columns only disappear from the list — logged values are kept, and you can still log them."), `COLUMN_SLEEP` / `COLUMN_WEIGHT` / `COLUMN_WATER` / `COLUMN_WAIST`. The four labels duplicate the `DAILY_LOG.*` strings so the Settings screen keeps its single `'SETTINGS'` translation stream (same trade-off already taken for `DAILY_LOG.DIALOG.SLEEP_UNIT`). |
| `tasks/backlog.md` | New `## Phase 12 — Daily Log Column Visibility` section tracking this work. |

## Explicitly Out of Scope

- **No migration.** `module_settings` is already JSONB with RLS; a typed column was
  considered and rejected as unnecessary churn for a four-element preference.
- **Log Entry dialog untouched** — all four fields always render, per the decision above.
- **No column reordering** and no per-column width/format options.
- **No effect on KPI, Progress, or any export** — Daily Log cards only.
- **No cross-screen live sync.** Settings and Daily Log are separate lazy routes with
  their own facades and `resource()`s, so Daily Log picks up the change when it is next
  navigated to. Identical to how the weight-unit preference already behaves.
- **`getWorkoutSettings` and `entry.facade.ts` unchanged** — no incidental refactor of
  consumers that don't need the daily-log block.

## Acceptance Criteria

- Switching a column off in Settings and navigating to Daily Log removes that tile from
  every card; the remaining tiles spread evenly with no empty grid cell at `md`+ and no
  overflow at 320px.
- The preference survives a full reload and a different device/session for the same user.
- Switching the column back on restores the tile **with its previously logged values** —
  nothing was destroyed.
- The Log Entry dialog still shows and saves all four metrics regardless of what is hidden.
- The last visible column's toggle is disabled; a card can never render zero tiles.
- A failed save rolls the toggle back and shows the existing `SAVE_ERROR` line; a
  successful one shows `SAVE_SUCCESS`, matching the unit toggles.
- A user with no `daily_log` key in `module_settings` (i.e. everyone today) sees all four
  columns, unchanged from current behaviour.
- Keyboard: every chip is reachable and toggles on Enter/Space, `aria-pressed` reflects
  state, the group is labelled, and focus-visible rings match the existing controls.

## Verification

1. `ng build` — succeeds within the 640 kB budget.
2. `ng test --watch=false` — no new failures.
3. Manual, against the real Supabase session (as with the unit-conversion work, live
   verification of the authenticated flow is the user's step): toggle each column off and
   on, reload, confirm the JSONB shape in the Supabase row, confirm logged values return.
