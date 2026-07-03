# Phase DR-4 — Progress Dashboard

**Branch:** `refactor/progress-dashboard`
**Target:** `development`

---

## Goal

The Progress tab is the de facto dashboard/landing screen but renders as a plain bordered `<ul>` list with no responsive behavior, no elevation, and no visual hierarchy. Convert it to a responsive card grid using the elevation tokens from DR-1.

---

## Changes

| File | Change |
|------|--------|
| `progress.component.scss` | `.progress__list` becomes a CSS grid — 1 column base, `repeat(auto-fill, minmax($card-grid-min, 1fr))` from `respond-to(md)`; empty-state icon scales up (48px → 64px) at `md+`; add-subject button uses the `touch-target` mixin instead of a hardcoded 40px |
| `subject-card.component.scss` | Drops the flat `border-bottom` list style for `border-radius: $radius-lg` + `box-shadow: $elevation-card` (hover → `$elevation-card-hover`) |

## Acceptance Criteria

- Single column at 375px, multi-column grid at 768px+.
- Subject cards have visible elevation instead of flat list borders.
- Add-subject button meets the 44px touch-target minimum.

## Verification

1. `ng build` — succeeds.
2. Manual: `ng serve`, view Progress tab at 375px/768px/1280px — grid column count changes, cards show shadow/hover elevation, no horizontal scroll.
