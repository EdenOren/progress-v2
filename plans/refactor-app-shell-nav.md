# Phase DR-3 — App Shell Nav

**Branch:** `refactor/app-shell-nav`
**Target:** `development`

---

## Goal

Desktop currently reuses the mobile bottom tab bar verbatim, wasting horizontal space. Add a left sidebar rail at `≥1024px` ($breakpoint-lg) that replaces the bottom bar, driven by the same `HomeFacade.tabs()` signal already used by the mobile nav — no facade changes needed.

---

## Changes

| File | Change |
|------|--------|
| `home.component.html` | Renders a second `<nav class="home__sidebar">` alongside the existing bottom `<nav class="home__nav">`, both from `facade.tabs()` |
| `home.component.scss` | `.home` becomes `flex-direction: row` at `lg`; `.home__sidebar` is `display: none` by default, `240px` flex column at `lg`; `.home__nav` hidden at `lg` via `respond-to`; `.home__content` gets `max-width: $container-max-width; margin-inline: auto;` at `lg` |

`home.facade.ts` — unchanged; both nav renderings consume the same `tabs()` signal.

## Acceptance Criteria

- At ≥1024px: bottom tab bar is hidden, left sidebar visible with the same 4 tabs (icon + label, vertical), active state styled consistently with the bottom nav's active state.
- Below 1024px: unchanged from current behavior.
- Keyboard focus / `aria-current` preserved in both renderings.

## Verification

1. `ng build` — succeeds.
2. Manual: `ng serve`, resize devtools viewport across 1024px — bottom nav and sidebar should swap at exactly that breakpoint, content column stays centered/capped at ≥1024px.
