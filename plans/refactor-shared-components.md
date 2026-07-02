# Phase DR-2 — Shared Components

**Branch:** `refactor/shared-components`
**Target:** `development`

---

## Goal

Fix the shared UI layer's responsiveness and polish gaps identified in the Design Refresh audit: unresponsive dialog widths, cramped number inputs, an unpolished button loading state, an unsized icon component, and a template/SCSS class mismatch in the confirmation dialog. Builds on the tokens added in `refactor/design-tokens` (DR-1).

---

## Changes

| File | Change |
|------|--------|
| `shared/enums/button-size.enum.ts` | New — `ButtonSize.Sm` / `ButtonSize.Md` |
| `ui-button.component.ts/.html/.scss` | `size` input (default `Md`); `--sm` modifier; `touch-target` mixin on the default button; loading state now renders a CSS spinner (reusing the existing unused `spin` keyframe) instead of dimming via opacity |
| `ui-icon.component.ts` | `size` input (`number \| null`, default `null`) bound to host `[style.width.px]`/`[style.height.px]`; `:host` gets a default 24px so icons never rely on implicit SVG intrinsic sizing. Existing consumer CSS classes (e.g. `entry-card__complete-icon` at 20px) still win via normal specificity since no `[size]` is passed — no regression. |
| `ui-input.component.scss` | Number input width changed from hardcoded `64px`/`48px` (compact) to `clamp(48px, 15vw, 64px)` / `clamp(40px, 12vw, 48px)` |
| `ui-textarea.component.scss` | Font-size `0.875rem` → `1rem` to match `ui-input` |
| `shared/services/dialog.service.ts` | New `DEFAULT_DIALOG_CONFIG` (`panelClass: 'app-dialog-panel'`) merged into every `matDialog.open()` call, replacing the per-dialog `width` config |
| `styles/_dialog.scss` (new, global) | `.app-dialog-panel { width: calc(100vw - 48px); max-width: $dialog-max-width; }` — full-width-with-margin on narrow viewports, capped at 400px above ~448px |
| `confirmation-dialog.component.html` | Applies the `confirmation-dialog__title` / `__actions` BEM classes that the SCSS already defined but the template never used |
| All 5 `*-dialog.component.ts` | Removed the now-unused static `DIALOG_WIDTH` constant |

## Acceptance Criteria

- Dialogs never overflow horizontally down to 320px viewport width, and cap at 400px above that.
- `ui-button` default size meets the 44px touch-target minimum; `sm` size is intentionally more compact for dense UI.
- Loading buttons show a visible spinner instead of just dimming.
- Confirmation dialog's title/message/actions are all styled per their BEM classes.
- No existing icon usage changes visual size (only new `[size]`-passing consumers would opt in).

## Verification

1. `ng build` — succeeds.
2. `ng test --watch=false` — no new failures (pre-existing `app.spec.ts` "should render title" failure is unrelated boilerplate, confirmed present on `development` before this branch).
3. Manual: `ng serve`, open each of the 5 dialogs at 320px/375px/768px/1280px widths — no horizontal scroll, sensible cap on desktop.
