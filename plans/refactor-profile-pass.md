# Phase DR-9 — Profile Pass

**Branch:** `refactor/profile-pass`
**Target:** `development`

---

## Goal

Verify/align the Profile form with the rest of the Design Refresh — it was the one screen with raw pixel magic numbers instead of design tokens.

---

## Changes

| File | Change |
|------|--------|
| `profile.component.scss` | `gap`/`padding` (16px) → `$spacing-md`; feedback text `font-size: 14px` → `var(--text-sm)` |

**Save button:** already uses `ButtonVariant.Primary`, which renders through `ui-button`'s default template branch and already inherits the DR-2 touch-target minimum and default `ButtonSize.Md`. No template change needed — explicitly binding `[size]="buttonSize.Md"` would just restate the default with no effect.

Number/text inputs already inherit the responsive width fix from `ui-input` (DR-2) automatically — no separate change needed.

## Acceptance Criteria

- Profile form spacing uses design tokens, not raw pixel values.
- No visual regression — Signal Forms validation/behavior untouched.

## Verification

1. `ng build` — succeeds.
2. Manual: `ng serve`, Profile screen renders identically to before aside from the (invisible at these exact values) token swap; save flow still works.

---

This is the last branch of the Design Refresh (DR-1 through DR-9). All 9 PRs are stacked on `development` and can now be reviewed/merged in order.
