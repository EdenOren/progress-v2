# Refactor — Responsive & Comfort Overhaul

**Type:** refactor / UX + responsive layout (no new routes, no new data)
**Target:** `development` (each phase below is its own branch + PR — see Rollout)
**Spans two repos:** `progress` (this one) and `ui-kit` (`@edenoren/ui-kit`, consumed as a published package)

---

## Goal

Every screen currently renders as a phone layout that gets wider. This plan makes the app genuinely comfortable at three sizes — one-handed phone (360–430px), tablet/small laptop (768–1023px), and desktop (1024px+) — with mobile **web** as a first-class target, not an app shell approximation.

"Comfortable" is defined concretely for this app: a user is standing at a rack, sweaty, one-handed, with the phone's URL bar eating vertical space and the keyboard covering the bottom half of the screen while they type a weight. Every rule below is derived from that scenario, then extended upward to desktop.

No data, routing, or facade changes — with one flagged exception (RX-3's accordion needs a piece of pure UI state in `EntryFacade`). This is viewport, layout, token, and shared-component work against screens that already exist.

---

## Decisions (2026-08-08)

Reviewed and decided by Eden against the audit artifact + device lab:

1. **Set row stays one line.** Today's layout — label, inputs, remove button in the same row — is liked and kept. The proposed two-line wrap under 380px is **dropped**; comfort comes from input width floors and 48px heights instead.
2. **Finish thumb bar approved** for phone. On desktop, Finish stays at the header's flex-end **exactly as today** — do not change.
3. **New: exercise accordion on the session screen** (mobile and web). The exercise being worked is expanded and sticky to the top of the list; all others are collapsed; finished exercises sink to the bottom of the list (in the list, reached by scroll — not pinned like the Finish button). On web the active exercise is large and fills most of the screen, the rest collapsed.
4. **Progress page (web + mobile): approved as planned.**
5. **Daily Log (web + mobile): approved as planned.**
6. **Dialogs (bottom sheet on phone): approved as planned.**
7. **Recipebox does not gate this plan.** The ui-kit changes ship regardless; recipebox is verified and fixed forward, but it cannot block.
8. **"Finished" = a feedback rating exists.** Confirmed — no schema change, no new "done" action. Additionally, the rating must stay *visible* after the fact: a rated exercise carries a **border colored by its rating** (`Success` green / `Hard` amber / `Fail` red) both while collapsed **and** while expanded, and the rating button stays in a clearly pressed state when the card is reopened. You must never have to guess whether an exercise is done.
9. **Session UI state survives a browser close.** Reopening the app returns you to the exercise you had open. Set values, feedback, notes and the timer already persist server-side; the accordion's active-exercise choice is the piece that doesn't, and it now gets persisted locally.

---

## Audit — what's wrong today

Findings are ordered by how much they hurt. Each is grounded in a specific file.

### Structural

**A1 — Two competing header idioms, zero reuse.**
`progress.component.scss`, `daily-log.component.scss` and `settings.component.scss` each contain a byte-identical `&__header` + `&__title` block (padding `md md sm`, bottom border, `respond-to(lg)` bump to `lg lg md`, title `22px` → `--text-3xl`). `subject.component.scss` and `entry.component.scss` use a *different* idiom (`min-height: 56px`, padding `sm md`, title `16px`/`18px`). Nothing is shared, so every future screen picks one at random.

**A2 — The core screen has no responsive rules at all.**
18 stylesheets contain zero `respond-to` calls, including the entire session flow — `entry.component.scss`, `set-row`, `session-item`, `session-item-feedback`, `session-item-note` — plus all 5 auth screens, all 4 dialogs, and both card components. The Entry screen is where users spend their whole workout, and on a 1440px monitor it renders one column of 40px-labelled set rows stretched across 1200px.

**A3 — Nothing happens between 768px and 1023px.**
`home__content` gets its `max-width` and the sidebar appears only at `lg`. Only `progress.component.scss` has an `md` rule (the card grid). Tablet portrait and landscape phones get the full-bleed phone layout.

**A4 — Nested scroll containers.**
`home__content` is `overflow-y: auto`, and every screen inside it is `height: 100%` + its own `overflow-y: auto` list. Two nested scrollers cause scroll chaining on iOS, break scroll restoration on back-navigation, and make `position: sticky` unusable inside screens.

### Mobile-web specific

**A5 — `100dvh` shell defeats mobile browser chrome.**
`.home { height: 100dvh }` with inner scrollers means the document body never scrolls, so **the URL bar never collapses** — the app permanently forfeits ~60–100px of an already short viewport. This is the single biggest "feels cramped on mobile web" cause.

**A6 — Safe-area padding is dead code.**
`home__nav` sets `padding-bottom: env(safe-area-inset-bottom, 0)`, but `index.html`'s viewport meta has no `viewport-fit=cover`, so the `env()` value resolves to `0` on every device. On a notched iPhone the bottom tab bar sits under the home indicator.

**A7 — No keyboard/viewport handling.**
No `interactive-widget=resizes-content` in the viewport meta, no `scroll-margin` on inputs, no `visualViewport` awareness. Focusing a set input or a dialog field on a small phone can leave the field under the keyboard with no way to scroll to it — the dialog's own actions row is the worst case, since `.app-dialog-panel` has no `max-height`.

**A8 — Dialogs are desktop modals shown on phones.**
`_dialog.scss` gives every dialog `width: calc(100vw - 48px); max-width: 400px`, centered. The Log Entry, Add Exercise and Complete Session dialogs are multi-field forms — on a phone those want to be bottom sheets reachable by thumb. Also uses `100vw` rather than `100dvw` (horizontal overflow when a desktop scrollbar is present), and no dialog SCSS file has a single media query.

**A9 — Sticky hover states on touch.**
No `@media (hover: hover)` guard exists anywhere in the app, and two components go further by sharing one rule between `:hover` and their selected modifier — `settings__btn` (kg/lb, km/mi) and `session-item-feedback__btn` (Success/Hard/Fail). On a touch device the hover style persists after the tap, so a unit toggle or a set's feedback rating can *look* chosen when it isn't — including after an optimistic update rolls back.

### Ergonomics

**A10 — Primary actions below the touch floor.**
The `touch-target` mixin (44px) is applied to icon buttons, but not to the buttons that matter most: `entry__finish-btn` (padding `xs md`, no min-height), `entry__add-btn` (padding `sm md`), and `session-item__add-set-btn` (padding `xs sm`, 13px type — roughly 30px tall). 44px is also only the Apple floor; Material says 48, and a gym context with wet hands wants 48–56 for destructive and primary actions.

**A11 — Set row packs six elements into 320px.**
`set-row` is a flex row of: label (40px) + input + `×` + input + unit + 44px remove button. The `app-ui-input` children have no `min-width` floor, so on a 320–360px phone the number fields compress toward unusable while the fixed elements hold their width.

**A12 — Nothing is reachable-first.**
Primary actions sit in top headers (`Finish`, `Start workout`, `+`), which is the hardest zone to reach one-handed on a modern tall phone. The Daily Log FAB is the only bottom-anchored action.

### Craft

**A13 — Typography isn't tokenized.** 85 hardcoded `font-size` declarations across feature SCSS (`22px`, `18px`, `16px`, `15px`, `14px`, `13px`, `12px`, `11px`). The `--text-*` scale ships in ui-kit and is used almost only inside `respond-to(lg)` overrides. No fluid type anywhere.

**A14 — Two icon systems.** `<mat-icon>` (Material Icons *webfont*, pulled from a render-blocking Google Fonts `<link>` in `index.html`) in 10 templates, versus ui-kit's SVG `app-ui-icon` in 4. The webfont path costs a blocking request and shows ligature text before it loads on slow mobile connections.

**A15 — No skeletons, so every load shifts layout.** Loading is a centered `<p>` in progress, daily-log, subject, entry and settings; content then replaces it at a different height.

**A16 — Inconsistent empty states.** Progress/Daily Log/KPI use icon + text; Entry and Subject use a bare `<p>`.

**A17 — No `prefers-reduced-motion` guard** anywhere in app or ui-kit, despite transitions on nearly every interactive element.

**A18 — Bundle is 330 kB over budget** (880 kB initial vs. the 550 kB budget). On mobile data this is felt before any of the above matters.

---

## The system

### Breakpoints

Keep ui-kit's existing four (`sm 640 / md 768 / lg 1024 / xl 1280`) as *page-level* breakpoints. Add **container queries** for components, so a card behaves the same whether it's in a one-column phone list or a three-column desktop grid.

| Range | Name | Layout |
|---|---|---|
| < 640px | phone | single column, bottom nav, bottom-sheet dialogs, thumb-zone actions |
| 640–1023px | tablet | two-column content where it earns it, bottom nav retained, centered dialogs |
| ≥ 1024px | desktop | sidebar rail, content max-width, multi-column, hover affordances on |
| ≥ 1280px | wide | wider gutters; the active exercise card fills the column, collapsed rows stay compact |

### Fluid type scale (replaces A13)

Move the `--text-*` tokens to `clamp()` so type scales continuously instead of stepping at `lg`:

```scss
--text-xs:   clamp(0.75rem, 0.72rem + 0.15vw, 0.8125rem);
--text-sm:   clamp(0.875rem, 0.85rem + 0.15vw, 0.9375rem);
--text-base: clamp(1rem, 0.97rem + 0.2vw, 1.0625rem);
--text-lg:   clamp(1.125rem, 1.08rem + 0.25vw, 1.25rem);
--text-xl:   clamp(1.25rem, 1.18rem + 0.4vw, 1.5rem);
--text-2xl:  clamp(1.5rem, 1.38rem + 0.6vw, 1.875rem);
--text-3xl:  clamp(1.875rem, 1.7rem + 0.9vw, 2.5rem);
```

Then delete the 85 hardcoded sizes and the now-redundant `respond-to(lg)` font-size overrides. Inputs stay at `1rem` minimum — already true in ui-kit (`ui-input__control` is `1rem`), and must stay that way: anything under 16px triggers iOS Safari's focus zoom.

### Touch targets

| Token | Value | Applies to |
|---|---|---|
| `$touch-target-min` | 44px | secondary icon buttons (existing) |
| `$touch-target-comfortable` | 48px | **new** — all list rows, form controls, nav tabs |
| `$touch-target-primary` | 56px | **new** — Finish, Start workout, Save, FAB, destructive confirms |

### Layout primitives (kills A1)

New ui-kit component `UiPageComponent` — owns the page's scroll container, its sticky header slot, safe-area insets, and the content max-width. Every screen becomes:

```html
<ui-page [title]="facade.title()">
  <div slot="actions">…</div>
  …content…
</ui-page>
```

Paired mixins in ui-kit styles: `page-gutters`, `content-column`, `sticky-header`, `thumb-bar`, `safe-area-bottom`, `hoverable` (the `@media (hover: hover)` wrapper), `skeleton`.

### Reachability

On phones, the primary destructive/committing action of a screen moves to a bottom **action bar** pinned above the nav with `env(safe-area-inset-bottom)` — Entry's `Finish`, Subject's `Start workout`, Profile's `Save`. At `lg`+ that same action returns to the header, where a mouse is already. One template, two placements, driven by CSS `order` and a media query — no duplicated markup.

---

## Phases

Each is one branch and one PR to `development`. RX-1 must ship (publish + version bump) before RX-2 onward.

### RX-0 — Viewport & shell correctness
**Branch:** `refactor/rx-0-viewport-shell` · **Repo:** progress · **Depends on:** nothing

Fixes A4, A5, A6, A7, A9, A17 — the highest value-per-line work in the plan, and it unblocks nothing else, so it ships first.

| File | Change |
|---|---|
| `src/index.html` | Viewport meta → `width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content`. Drops the Material Icons `<link>` once A14 lands in RX-8; keep for now. |
| `home.component.scss` | `height: 100dvh` → `min-height: 100dvh` and hand scrolling to the document: `home__content` loses `overflow-y: auto`; screens lose `height: 100%` + inner scroll in RX-2. Bottom nav becomes `position: sticky; bottom: 0` so it stays put while the URL bar collapses. Add `overscroll-behavior-y: contain`. |
| `home.component.scss` | Sidebar becomes `position: sticky; top: 0; height: 100dvh` at `lg` — it's the only element that should be viewport-locked. |
| ui-kit `_reset.scss` *(or app-level override until RX-1)* | `@media (prefers-reduced-motion: reduce)` global transition/animation kill switch; `-webkit-tap-highlight-color: transparent` on interactive elements paired with a real `:active` state; `scroll-margin-block: 96px` on `input, textarea, select`. |
| `settings.component.scss` | Split `:hover` from `--active`; wrap hover in `@media (hover: hover)`. |

**Acceptance:** on a real phone browser the URL bar collapses on scroll; the bottom nav clears the home indicator; focusing a Profile field scrolls it above the keyboard; reduced-motion users see no transitions; tapping a unit toggle doesn't leave it looking selected.

### RX-1 — ui-kit v0.2.0 responsive foundation
**Branch:** `refactor/rx-1-responsive-foundation` · **Repo:** ui-kit · **Depends on:** RX-0 (only for sequencing)

| Area | Change |
|---|---|
| `_typography.scss` | Fluid `clamp()` scale above; add `--leading-relaxed: 1.6`; `text-wrap: balance` on h1–h4, `text-wrap: pretty` on `p`. |
| `_variables.scss` | Add `$touch-target-comfortable: 48px`, `$touch-target-primary: 56px`, `$content-max-width: 720px` (reading column, distinct from the existing 1200px `$container-max-width`), `$breakpoint-xs: 380px`. |
| `_mixins.scss` | New: `hoverable`, `page-gutters`, `content-column`, `sticky-header`, `thumb-bar`, `safe-area-bottom`, `safe-area-top`, `skeleton`, `touch-target-comfortable`, `touch-target-primary`, `container(name)`. Existing `respond-to` gains `xs`. |
| `_dialog.scss` | Responsive panel: below `sm`, bottom sheet — full width, `border-radius` top corners only, `max-height: 85dvh`, internal scroll, actions row pinned with `safe-area-bottom`, slide-up entry honoring reduced motion. At `sm`+, the current centered modal. `100vw` → `100dvw`. |
| New `UiPageComponent` | Scroll-owning page shell: sticky header (title + `actions` slot + optional `leading` back button), gutters, content column, thumb-bar slot. `OnPush`, signal inputs, no string literals. |
| New `UiSkeletonComponent` | `variant: SkeletonVariant` enum (`Text \| Card \| Row \| Tile`), `count: InputSignal<number>`; shimmer disabled under reduced motion. |
| New `UiStatTileComponent` | The tile spec IC-2 of the Iron & Chalk plan defined but never shipped: label, tabular-nums value + unit, status dot driven by a `TileStatus` enum. Daily Log and KPI both need it. |
| `UiButtonComponent` | `ButtonSize.Lg` (56px) for primary/thumb-bar use; `fullWidth: InputSignal<boolean>`. |

Publish `0.2.0` to the GitHub registry, then bump `progress`'s dependency. **Recipebox also consumes this package — build and check it as part of RX-1, but per Decision 7 it does not gate the publish: any fallout is fixed forward in recipebox.**

### RX-2 — Adopt page primitives across all screens
**Branch:** `refactor/rx-2-page-primitives` · **Repo:** progress · **Depends on:** RX-1

Convert Progress, Subject, Entry, Daily Log, KPI, Menu, Profile, Settings to `<ui-page>`. Deletes both duplicated header idioms (A1), removes every screen's `height: 100%` + `overflow-y: auto` (completing A4), and applies the fluid scale by deleting hardcoded sizes (A13). Largest diff in the plan, near-zero logic change.

**Acceptance:** no feature SCSS contains a `&__header`/`&__title` block or a hardcoded `font-size`; one scroll container in the DOM; every screen's header sticks on scroll.

### RX-3 — Entry / session screen
**Branch:** `refactor/rx-3-entry-session` · **Repo:** progress · **Depends on:** RX-2

The screen users spend a whole workout on, and today the least responsive (A2, A10, A11, A12). Shaped by Decisions 1–3.

- **Set row stays one line** (Decision 1): label + inputs + unit + remove in the same row, as today. Comfort comes from a `min-width` floor on the number inputs (they currently compress first), 48px control heights, tightened gaps, and remove button to `$touch-target-comfortable` — never from wrapping.
- **Exercise accordion** (Decision 3) — one *active* exercise at a time:
  - The active card is expanded and first in the list; its name row is `position: sticky` under the page header so you always know what you're doing while scrolling its sets.
  - Every other unfinished exercise renders as a collapsed 56px row — name + set-count summary — and expands on tap, collapsing the previous active card.
  - **Finished exercises sort to the bottom of the list**, collapsed. They live in the list (reached by scrolling), not pinned to the viewport.
  - **Definition of finished:** the item has a feedback rating set (Decision 8) — the only completion signal in the data model, so no schema change.
  - **Default active** on load: the persisted choice if there is one (Decision 9), else the first exercise without feedback; when all are rated, the last item. Completed (read-only) sessions render everything expanded as today.
  - **Desktop (`lg`+):** same model — the active card grows to fill most of the content column; collapsed rows stay compact around it. This **replaces** the earlier two-pane idea.
  - Needs one piece of UI state in `EntryFacade`: `_activeItemId: WritableSignal<string | null>` + a computed ordered list (active → unrated → rated). Pure view state, no data-layer changes — the plan's single facade exception.
- **Rating stays visible after it's given** (Decision 8). Today `session-item-feedback` already binds an `--active` modifier, but its style is identical to `:hover`, so a given rating doesn't read as chosen. Fixed in three parts:
  - Split `:hover` from `--active` and wrap hover in `@media (hover: hover)` — this is A9's fix, applied here.
  - The pressed rating button gains a filled treatment (rating color as background, inverse text) rather than the current tinted outline, so it survives a glance.
  - `SessionItemComponent` gains a **rating-colored border** on the card itself — `--color-accent` for `Success`, `--color-warning` for `Hard`, `--color-error` for `Fail` — shown **both collapsed and expanded**. Driven by boolean `Signal<boolean>` computeds (`isSuccessFeedback` etc. already exist in the feedback child and move up), never a string comparison in the template, per `typescript-and-style.md`.
  - Color is not the only channel: the collapsed row also carries a check icon, so the state survives a color-vision deficiency and passes the AXE/AA bar in the acceptance criteria.

**Session UI state persistence (Decision 9).** New `SessionUiStateService` in `core/services/platform/`:

| Concern | Decision |
|---|---|
| What persists | Only `activeItemId`, per entry. Sets, feedback, notes and `started_at` already round-trip through Supabase, so a reopen restores them today — the open-exercise choice is the sole gap. |
| Where | `localStorage`. It survives a browser/tab close (unlike `sessionStorage`) and this is per-device view state, not account data — a DB column would sync it across devices, which is not wanted and would cost a migration. |
| Key | `progress.session.active-item.<entryId>`, built from a `StorageKey` enum prefix — no inline string literals. |
| Reading | Validated with Zod at the boundary and treated as untrusted (`typescript-and-style.md` § Security). A stored id that is no longer in the session — the exercise was deleted on another device — falls back to the default active item instead of showing an empty card. |
| Writing | On every active-exercise change, from the facade. Wrapped so a `QuotaExceededError` or a privacy-mode `localStorage` throw degrades to in-memory state rather than breaking the session. |
| Clearing | On session completion, and on entry deletion, so keys don't accumulate. |
- **Finish** (Decision 2): phone/tablet — sticky 56px thumb bar above the nav. Desktop — stays at the header's flex-end exactly as today; the timer stays the header's centered `tabular-nums` element at `--text-xl`.
- **Add exercise / add set:** raised to comfortable targets; add-set becomes a full-width row inside the card rather than a 30px dashed strip.
- **Feedback controls:** buttons to 48px, spaced to prevent mis-taps between `Success`/`Hard`/`Fail`; selected state split from hover per A9.

### RX-4 — Progress & Subject
**Branch:** `refactor/rx-4-progress-subject` · **Repo:** progress · **Depends on:** RX-2

- Subject card → container queries; consistent min-height regardless of description length (already fixed in DR-10 — re-verify under the new grid).
- Subject entry list: from full-bleed rows to a card grid at `md`+, matching Progress.
- `Start workout` → phone thumb-bar, header at `lg`; delete stays in an overflow menu, never adjacent to the primary action.
- Empty states unified on the icon + text pattern (A16).

### RX-5 — Daily Log & KPI
**Branch:** `refactor/rx-5-daily-log-kpi` · **Repo:** progress · **Depends on:** RX-2, RX-1's `UiStatTileComponent`

- Log rows adopt stat tiles: 2×2 grid on phone, 4-across at `md`+, `tabular-nums` throughout so weight/waist columns align.
- FAB → thumb-bar `Log today` button on phone; header button at `lg`.
- KPI tab: implement `plans/feature-kpi-recent-workouts.md` on top of the new primitives rather than restyling the placeholder twice. **This is the one phase that adds a feature; if you'd rather keep this plan pure refactor, ship the KPI feature first and let RX-5 restyle it.**

### RX-6 — Dialogs
**Branch:** `refactor/rx-6-dialogs` · **Repo:** progress · **Depends on:** RX-1

Add Exercise, Create Subject, Log Entry, Complete Session, Confirmation adopt the bottom-sheet-below-`sm` behavior. Log Entry's 2×2 stat grid gets a single-column fallback under `xs`. Verify with the keyboard open on a 360×640 device that the actions row stays reachable (A7, A8).

### RX-7 — Auth, Menu, Profile, Settings
**Branch:** `refactor/rx-7-auth-account` · **Repo:** progress · **Depends on:** RX-2

- Auth cards: `min-height: 100dvh` → `min-height: 100svh` with `padding-block` that collapses on short viewports, fixing the landscape-phone overflow (A16 in the audit list).
- Card `max-width` 400px → 420px with fluid padding (`$spacing-lg` phone → `$spacing-2xl` desktop) so the 48px form controls aren't cramped.
- Profile/Settings: form controls to `$touch-target-comfortable`; `Save` to the thumb-bar on phone; settings toggle group to a proper segmented control with clear selected state independent of hover.
- Menu: rows to 56px with chevrons; at `lg` the tab is largely redundant with the sidebar user menu — link them to the same actions.

### RX-8 — Polish & performance
**Branch:** `refactor/rx-8-polish` · **Repo:** progress · **Depends on:** RX-2…RX-7

- **Skeletons** replace all `<p>LOADING</p>` states (A15).
- **Icon consolidation** (A14): migrate the 10 remaining `mat-icon` templates to SVG `app-ui-icon`, extend `AppIcon`, drop the Material Icons `<link>` from `index.html`. Note `mat-menu`/`mat-dialog` stay — this is about *icon* delivery only.
- **Bundle** (A18): the Material Icons removal plus route-level audit of the 232 kB shared chunk; raise or meet the 550 kB budget deliberately rather than leaving a permanent warning.
- Focus-visible audit across every new interactive element; AXE pass on all screens at 360px and 1440px.

---

## Testing matrix

Every phase is checked at these widths before its PR:

| Width | Height | Represents | Must be true |
|---|---|---|---|
| 320 | 568 | iPhone SE / smallest supported | no horizontal scroll, no clipped controls |
| 360 | 640 | common budget Android | set row usable with keyboard open |
| 390 | 844 | iPhone 15 | thumb-bar clears home indicator; URL bar collapses |
| 430 | 932 | iPhone Pro Max | content doesn't look stranded |
| 768 | 1024 | iPad portrait | two-column where earned, bottom nav still correct |
| 1024 | 768 | small laptop / iPad landscape | sidebar appears, no layout jump |
| 1440 | 900 | desktop | content column capped, no full-bleed rows |

Plus: iOS Safari with the keyboard open on Entry and on every dialog; Chrome Android with URL-bar collapse; landscape phone on auth screens; `prefers-reduced-motion: reduce`; keyboard-only navigation on every screen; AXE clean.

---

## Acceptance criteria

1. No horizontal scrolling at any width from 320px to 2560px, on any screen, in any state.
2. One scroll container per page; the mobile URL bar collapses on scroll.
3. Every interactive element meets 44px minimum; every primary and destructive action meets 48px.
4. Focused inputs are never obscured by the on-screen keyboard, dialogs included.
5. Zero hardcoded `font-size` values in feature SCSS; zero duplicated page-header blocks.
6. Safe-area insets respected on notched devices, top and bottom.
7. Hover styling never persists after a touch.
8. Loading states hold their final layout (no cumulative layout shift on data arrival).
9. `prefers-reduced-motion` honored globally.
10. AXE clean and WCAG AA on all screens at 360px and 1440px.
11. A rated exercise is unmistakably finished — rating-colored border plus check while collapsed, border retained and the rating button clearly pressed when expanded, and never signalled by color alone.
12. Closing the browser mid-session and reopening returns you to the same open exercise, with sets, feedback, notes and elapsed time intact.

---

## Out of scope

- **No new IA.** No combined "Today" dashboard, no subject quick-switch strip — those remain deferred as IC-9 in `plans/design-refresh-iron-chalk.md` and need their own plan.
- **No palette change.** Iron & Chalk stays exactly as shipped; this is layout, spacing, sizing and ergonomics only.
- **No data, query, or route changes.** Two flagged exceptions: RX-5's KPI tab (feature), and RX-3's accordion view state — `_activeItemId` in `EntryFacade` plus the `SessionUiStateService` that persists it. Both are UI state; no schema, query or route is touched.
- **No light theme.** The app is deliberately single-theme; unchanged here.
- **No PWA/offline work.** Mobile *web* is the target; installability is a separate conversation.

---

## Rollout

RX-0 → RX-1 (publish ui-kit `0.2.0`, verify recipebox) → RX-2 → RX-3…RX-7 in any order → RX-8 last. One PR each, titled to match its branch, targeting `development`. RX-2 is the largest diff and should be reviewed on its own.

## Risk

RX-1 changes `@edenoren/ui-kit`, which **recipebox** also consumes — the fluid type scale, the dialog bottom-sheet behavior and `UiPageComponent` change that app's rendering too. Per Decision 7 this **does not block**: build and visually check recipebox during RX-1, but ship `0.2.0` regardless and fix any recipebox fallout forward in that repo.
