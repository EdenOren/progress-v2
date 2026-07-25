# Refactor — Modal Layout Fixes

**Branch:** `refactor/modal-layout-fixes`
**Target:** `development`

---

## Goal

Three layout defects, fixed once at the shared level so every modal inherits the fix (not per-dialog patches):

1. **Actions row** — Cancel/Save buttons must always sit in a single row, right-aligned (`flex-end`), with a gap between them. Currently this relies entirely on Angular Material's default `mat-dialog-actions[align="end"]` styling with no project override, no `nowrap`, and no explicit gap — nothing guarantees it holds at narrow dialog widths (`$dialog-max-width: 400px`, down to 320px viewports) or with longer translated labels.
2. **Input gap** — Stacked inputs inside a form need consistent vertical spacing. `create-subject-dialog` ("New Subject" modal) already has a `create-subject-dialog__content` SCSS block with `gap: $spacing-md`, but it's dead code — the class is never applied in the template, so the two inputs (`Name`, `Description`) currently have no gap between them at all.
3. **Error stability** — When a field's validation error appears, the `<span class="ui-input__error">` in `ui-input.component.html` is only rendered via `@if (touched() && error())`. Inserting/removing that element shifts every sibling below it (the next input, the actions row) since no space is reserved for it. This must be fixed once in the shared `ui-input` component, since it's used everywhere (all modals + auth screens), which satisfies "true everywhere" in one place.

## Root Cause Summary (from codebase read)

- All 5 dialogs (`create-subject`, `add-item`, `log-entry`, `confirmation`, `complete-session`) render through one shell, `UiModalComponent` (`ui-modal.component.html`), which has **no `.scss` file at all** — `mat-dialog-actions` gets zero project-level styling today.
- `create-subject-dialog.component.scss` defines `&__content { display:flex; flex-direction:column; gap:$spacing-md }` but `create-subject-dialog.component.html` never puts that class on the `<div slot="content">` — dead CSS.
- `ui-input.component.html`'s error `<span>` only exists in the DOM when `touched() && error()` is true; `ui-input.component.scss` gives it no reserved `min-height`.

## Changes

| File | Change |
|---|---|
| `ui-modal.component.ts` | Add `styleUrl: './ui-modal.component.scss'` (new file) |
| `ui-modal.component.scss` (new) | Style the shell's own `mat-dialog-actions` element directly (no `::ng-deep` needed — it's declared in this component's own template): `display: flex; flex-wrap: nowrap; justify-content: flex-end; align-items: center; gap: variables.$spacing-sm;`. Guarantees row + flex-end + gap for every modal's action buttons regardless of Material's defaults or label length. |
| `create-subject-dialog.component.html` | Add `class="create-subject-dialog__content"` to the `<div slot="content">` so the existing (currently dead) gap styling actually applies between the Name and Description inputs. Same treatment for `create-subject-dialog__title` on `<span slot="title">` and `create-subject-dialog__actions` on `<div slot="actions">` (wires up the rest of the already-written, currently-unused BEM block — same pattern already correctly done in `confirmation-dialog.component.html`) |
| `create-subject-dialog.component.scss` | No structural change; `__actions` block's `gap`/`padding-top` stay as a per-dialog override layered on top of the new shell default |
| `ui-input.component.html` | Always render `<span class="ui-input__error">`; move the `@if (touched() && error())` to guard only the text content inside the span, not the span's existence. `aria-describedby`/`aria-invalid` bindings on the `<input>` stay conditional as-is. |
| `ui-input.component.scss` | Give `.ui-input__error` `display: block; min-height: 1rem;` so the line reserves its height whether or not it currently holds error text — sibling inputs/buttons never shift. |

## Explicitly Out of Scope

- The numeric-input branch of `ui-input` (`isNumber()`) has no error/touched support at all today (used unvalidated in `log-entry-dialog`, `complete-session-dialog`) — adding validation there is a separate feature, not a layout fix.
- `add-item-dialog` only has one input, so the gap fix doesn't apply there; it inherits the actions-row fix automatically via the shared shell.
- `log-entry-dialog` / `complete-session-dialog` already have working input gaps (`$spacing-md`) — no change needed.
- Not touching `ui-button` — dialog buttons use `[variant]="buttonVariant.Ghost"` (a bare `mat-button`), which never had the `.ui-button { width: 100% }` rule applied, so button width isn't part of this bug.

## Acceptance Criteria

- In every modal (New Subject, Add Exercise, Log Entry, Confirmation, Complete Session), Cancel/Save (or Cancel/Confirm) sit on one row, right-aligned, with visible gap, at 320px, 375px, and desktop widths.
- New Subject modal: visible gap between the Name and Description inputs.
- Triggering a validation error (e.g. leave "Name" empty and blur/submit in New Subject or Add Exercise) does not move the input(s) below it or the actions row — the error text appears in a space that was already reserved.
- No visual regression to dialogs where inputs already had correct gaps (`log-entry`, `complete-session`) or where the actions block already worked (`confirmation`).

## Verification

1. `ng build` — succeeds.
2. `ng test --watch=false` — no new failures.
3. Manual via `ng serve`: open all 5 dialogs at 320px, 375px, and desktop width; confirm actions row and (where applicable) input gap; trigger a validation error and confirm no layout shift.
