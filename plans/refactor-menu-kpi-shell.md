# Phase DR-8 — Menu/KPI Shell Restyle

**Branch:** `refactor/menu-kpi-shell`
**Target:** `development`

---

## Goal

Menu and KPI are both stubs with real feature work planned later (future menu items, Phase 9 KPI Dashboard). Restyle their shell/empty-state only, per decision — no real content built here.

---

## Changes

| File | Change |
|------|--------|
| `menu.component.scss` | `padding: 16px` → `padding: $spacing-md` (tokenized) |
| `kpi.component.ts/.html/.scss` (new files, replacing inline `template: '<p>KPI</p>'`) | Proper empty-state matching Progress's pattern: icon + i18n text, scales up at `md+` |
| `assets/i18n/en.json` | New `KPI.COMING_SOON` key |

**Deviation from the original plan note:** the Profile button in `menu.component.html` uses `ButtonVariant.Ghost`, which renders via Angular Material's `mat-button` and never reads `ui-button`'s new `size()` input (that binding only affects the default/non-Ghost template branch — see DR-2). Binding `[size]` there would be a no-op, so it's left out rather than adding dead markup.

## Acceptance Criteria

- Menu spacing uses design tokens, not a raw pixel value.
- KPI screen shows a proper empty-state (icon + translated text) instead of a literal `<p>KPI</p>`, matching Progress's empty-state visual language.
- No real KPI cards or menu items added — that stays in Phase 9 / future backlog.

## Verification

1. `ng build` — succeeds.
2. Manual: `ng serve`, KPI tab shows the new empty-state at 375px and 1024px (icon scales up); Menu tab shows the Profile link with tokenized spacing.
