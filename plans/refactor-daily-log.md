# Phase DR-5 — Daily Log Redesign

**Branch:** `refactor/daily-log`
**Target:** `development`

---

## Goal

Fix cramped, non-touch-friendly log rows and a FAB that can overlap content near the safe-area on notched devices.

---

## Changes

| File | Change |
|------|--------|
| `daily-log.component.scss` | List rows get `min-height: $touch-target-min`; FAB now uses `bottom: max($spacing-lg, env(safe-area-inset-bottom) + $spacing-sm)` instead of a fixed offset |
| `log-card.component.scss` | Row `min-height: $touch-target-min`; metric label/value text sizes bump (11px→12px, 13px→14px) at `respond-to(md)` |

## Acceptance Criteria

- Log rows measure ≥44px tall.
- FAB never sits flush against a device's home-indicator safe area.
- Metric text is slightly larger on tablet/desktop widths.

## Verification

1. `ng build` — succeeds.
2. Manual: `ng serve`, Daily Log tab at 375px and 1024px — row height/text size differences visible, FAB clears the bottom edge.
