# Feature — Daily Log Unit Conversion & Entry Dialog Redesign

**Branch:** `refactor/daily-log-unit-conversion`
**Target:** `development`

---

## Goal

Two problems reported after testing the modal-layout fixes:

1. **Bug** — Settings' Weight Unit toggle (kg/lb) is completely disconnected from Daily Log. `DailyLogFacade` and `LogEntryDialogComponent` never read the preference; weight/waist labels and stored values are hardcoded to kg/cm regardless of what's set. (Root-caused earlier: `daily-log.facade.ts`, `log-entry-dialog.component.ts`, `log-card.component.html` never import `UserSettingsService`/`WeightUnit` at all — unlike the `entry`/`set-row` feature, which already does this correctly for `DistanceUnit`.)
2. **Design** — The Log Entry modal (Sleep/Weight/Water/Waist) looks bad: four generic stacked `ui-input` numeric fields, each a tiny 48–64px centered box under a plain label, no icon, no unit shown until you read the label text.

Agreed direction (artifact reviewed and approved, see conversation): rebuild the four fields as a 2×2 grid of icon-led "stat tiles" (icon + label header, large tabular-nums value, unit shown as a live adornment next to the value). Weight and Waist convert live off the Settings weight-unit preference — **no separate switch inside the modal**; it silently reflects whichever unit is set on the Settings screen. Waist follows the same kg/lb choice as weight (cm when Kg, in when Lb), since no separate length-unit setting exists. Storage stays in kg/cm — conversion is display/input-only, mirroring how `set-row.component.ts` already handles `DistanceUnit` for workout distance.

**Explicit overflow constraint:** the tile grid must fit inside the existing `$dialog-max-width: 400px` panel without horizontal overflow, down to a 320px viewport (panel width becomes `calc(100vw - 48px)` = 272px per `_dialog.scss`, minus Material's default dialog-content padding — usable width ≈ 224px, ≈108px per tile). Grid columns use `minmax(0, 1fr)` and tiles/inputs get `min-width: 0` so content shrinks instead of overflowing.

## Changes

| File | Change |
|---|---|
| `shared/utils/unit-conversion.ts` | Add `kgToLb`/`lbToKg`, `cmToIn`/`inToCm`, `roundToOneDecimal` (pure functions, same style as the existing meters/km/miles/yards set). Add exported `WEIGHT_UNIT_LABELS: Record<WeightUnit, string>` (`{ kg: 'kg', lb: 'lb' }`) and `WAIST_UNIT_LABELS: Record<WeightUnit, string>` (`{ kg: 'cm', lb: 'in' }`) — single source of truth shared by `log-card` and `log-entry-dialog`, same idea as `SetRowComponent.DISTANCE_UNIT_LABELS` but shared since two components need it here. |
| `daily-log.facade.ts` | Inject `UserSettingsService`; add a `resource` fetching `getWorkoutSettings` (same pattern as `entry.facade.ts:118-126`); expose `weightUnit: Signal<WeightUnit>` (defaults to `WeightUnit.Kg` on no/failed result, matching `entry.facade.ts:162-165`). Pass `weightUnit: this.weightUnit()` into the `LogEntryDialogData` when calling `dialogService.open(DialogType.LogEntry, ...)`. |
| `log-card.component.ts` | Add `weightUnit: InputSignal<WeightUnit>` (default `WeightUnit.Kg`). Add computed `displayWeight`/`displayWaist`/`weightLabel`/`waistLabel` using the new conversion utils/label maps. |
| `log-card.component.html` | Use `displayWeight()`/`weightLabel()` and `displayWaist()`/`waistLabel()` in place of the raw `entry().weightKg`/`translation()['WEIGHT_UNIT']` (and same for waist). Sleep/Water unchanged (no unit toggle). |
| `daily-log.component.html` | Pass `[weightUnit]="facade.weightUnit()"` to `<app-log-card>`. |
| `ui-input.component.ts` | **Extend, don't bypass** (corrected from the original version of this plan, which wrongly hand-rolled markup in the dialog instead of reusing the shared component). Add three new numeric-only inputs, all additive/opt-in so every existing consumer (`set-row`, `complete-session-dialog`) renders exactly as before when unset: `icon: InputSignal<string>` (default `''`, Material icon ligature), `unit: InputSignal<string>` (default `''`, adornment text), `tile: InputSignal<boolean>` (default `false`, switches the numeric variant from today's compact centered box to the icon-header/big-value/unit-chip layout). Import `MatIconModule`. Host gets `[class.ui-input--tile]="tile()"`. |
| `ui-input.component.html` | Numeric branch (`isNumber()`) splits on `tile()`: `true` renders the icon+label header row, then the value+unit row (this is what moves the label out of the existing top-of-template `@if (label())` block — suppress that block when `isNumber() && tile()` so the label isn't rendered twice); `false` renders the existing compact markup unchanged. |
| `ui-input.component.scss` | New `__tile`, `__tile-head`, `__tile-icon`, `__tile-label`, `__tile-row`, `__tile-input`, `__tile-unit` BEM blocks (the stat-tile look from the approved mockup) plus `:host.ui-input--tile { display: block; width: 100%; }` (overriding the numeric host's default `inline-block`, since a tile needs to fill its grid cell). |
| `log-entry-dialog.component.ts` | `LogEntryDialogData` gains `weightUnit: WeightUnit`. Keep using `app-ui-input` (revert the bypass) with `(valueChange)` handlers as before. Add `weightUnitLabel`/`waistUnitLabel` (static per dialog-open, from the label maps). Add `weightDisplay`/`waistDisplay` computed signals (convert stored kg/cm → display unit, rounded to 1 decimal when converted). `onWeightKgChange`/`onWaistCmChange` convert the already-parsed/clamped display-unit value `ui-input` emits back to kg/cm before writing to the canonical `_weightKg`/`_waistCm` signals that `onSubmit` emits — storage/API contract (`LogEntryFormData`) is unchanged. |
| `log-entry-dialog.component.html` | 4 `app-ui-input` fields (`[type]="inputType.Number"`) inside a `.log-entry-dialog__tiles` 2-column CSS grid, each with `[tile]="true"`, `[icon]="'bedtime'"`/`'monitor_weight'`/`'water_drop'`/`'straighten'`, and `[unit]="…"` (fixed `SLEEP_UNIT`/`WATER_UNIT` for Sleep/Water, live `weightUnitLabel`/`waistUnitLabel` for Weight/Waist). |
| `log-entry-dialog.component.scss` | Just the `__tiles` grid container (`minmax(0, 1fr)` columns, `$spacing-sm` gap) — the tile's own visuals now live in `ui-input.component.scss`. |
| `assets/i18n/en.json` | `DAILY_LOG.DIALOG.*_LABEL` strings drop their hardcoded unit suffix (`"Weight (kg)"` → `"Weight"`, etc. — unit is now a live adornment, not label text). Add `DIALOG.SLEEP_UNIT`/`DIALOG.WATER_UNIT` (duplicated from the existing top-level `DAILY_LOG.SLEEP_UNIT`/`WATER_UNIT` so the dialog's single `'DAILY_LOG.DIALOG'`-scoped translation stream can reach them without restructuring it). |

## Explicitly Out of Scope

- No new Settings toggle for waist/length unit — it rides on the existing weight-unit preference per the agreed decision.
- Not changing `set-row` or `complete-session-dialog`'s visuals — they don't pass `tile`/`icon`/`unit`, so `ui-input`'s new inputs default off and those consumers render identically to today. Adopting the tile look elsewhere is a future call, not made here.
- No validation/required-field logic added — none exists on these fields today (all nullable), and none was requested.
- Sleep/Water stay fixed-unit (`h`/`L`) — no imperial equivalent in scope.

## Acceptance Criteria

- Changing Settings → Weight Unit and reopening Daily Log (list and the Log Entry/Edit modal) shows converted values with the correct unit — no app reload required beyond normal navigation.
- Log Entry modal renders as a 2×2 icon-led tile grid; no horizontal overflow or clipped text at 320px, 375px, and desktop widths.
- Editing a value in Lb/In and saving persists the correct kg/cm back to Supabase (round-trip: kg → lb (display) → edited lb → kg (stored) stays numerically sane, not compounding rounding error across edits since storage is only ever written from a fresh conversion of the current display value, never re-derived from a previously-rounded one).
- No in-modal unit switch — the dialog is read-only with respect to unit selection; it only reflects Settings.

## Verification

1. `ng build` — succeeds.
2. `ng test --watch=false` — no new failures.
3. Manual: self-check tile layout for overflow via a static rendering at 320/400px (dev-server verification of the live Supabase-backed flow deferred to the user, per this session's earlier decision, since reaching Daily Log requires an authenticated session against the real backend).
