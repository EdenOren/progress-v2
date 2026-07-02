# Phase DR-7 — Subject Redesign

**Branch:** `refactor/subject`
**Target:** `development`

---

## Goal

Fix low-contrast, sub-44px header buttons and a title that has no responsive fallback before its ellipsis kicks in; give the entry list rows a real hover state.

---

## Changes

| File | Change |
|------|--------|
| `subject.component.scss` | Header back/start/delete buttons use the `touch-target` mixin instead of 40px, plus a visible `:hover` surface (previously transparent-until-active, low contrast); title font-size steps from 16px (mobile) to 18px at `respond-to(sm)` |
| `entry-card.component.scss` | Row gets `min-height: $touch-target-min` and a `:hover` background, matching the existing `:active` state |

## Acceptance Criteria

- Header buttons meet the 44px touch-target minimum and show a visible hover surface.
- Long subject names truncate more gracefully at narrow widths (smaller base font before ellipsis).
- Entry rows show hover feedback, not just on press.

## Verification

1. `ng build` — succeeds.
2. Manual: `ng serve`, Subject detail screen at 320-375px and 768px+ — header buttons visibly respond to hover, title font-size difference visible, entry rows highlight on hover.
