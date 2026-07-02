# Phase DR-6 — Entry/Session Redesign

**Branch:** `refactor/entry-session`
**Target:** `development`

---

## Goal

Fix the workout-session screen's overlap risk (absolutely-positioned header timer) and several sub-44px touch targets.

---

## Changes

| File | Change |
|------|--------|
| `entry.component.scss` | Header timer switched from `position: absolute; left: 50%; transform: translateX(-50%)` to `flex: 1; text-align: center` so it can no longer overlap the back/finish buttons; back button uses the `touch-target` mixin instead of a hardcoded 40px |
| `set-row.component.scss` | Row padding `$spacing-xs` → `$spacing-sm`; remove-set button uses the `touch-target` mixin instead of 32px |
| `session-item.component.scss` | Delete button uses the `touch-target` mixin instead of 32px |
| `session-item-feedback.component.scss` | Feedback buttons get `min-height: $touch-target-min` |

Number-input widths in `set-row` already inherit the responsive `clamp()` fix from `ui-input` (DR-2) — no separate change needed here.

## Acceptance Criteria

- Header timer never visually overlaps the back or finish button, down to 320px width.
- Delete/remove buttons and feedback buttons all meet the 44px touch-target minimum.

## Verification

1. `ng build` — succeeds.
2. Manual: `ng serve`, open an active session at 320-375px width — timer stays centered in the available space without overlapping either header button; tap targets measured ≥44×44px via devtools box model.
