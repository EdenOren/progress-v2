# Design Refresh — Iron & Chalk

**Type:** refactor / visual identity (no new routes, no new data)
**Target:** `development` (each phase below is its own branch + PR; see Rollout)
**Origin:** design pitch artifact — three directions explored (Iron & Chalk / The Logbook / Vitals), Iron & Chalk chosen, borrowing the Vitals tile grammar and the Logbook's highlighter PR marker.

---

## Scope

This plan reskins **every existing screen** onto one committed dark theme — chalk-white type on iron/gunmetal surfaces, with the app's `success | hard | fail` feedback enum driving a plate-color system (green/yellow/red). There is no light/dark toggle; Iron & Chalk becomes the only theme, the same way the current violet-on-white theme is the only theme today.

It does **not** touch data, routing, or facades. Every phase is CSS/template/token/shared-component work against screens that already exist.

### Out of scope (flagged, not planned here)

The desktop mockup shown alongside the pitch also illustrated a combined "Today" view (session + daily log side by side), a subject quick-switch tab strip, and a live KPI trend chart with real historical data. None of those exist in the app today:

- Today's IA is Progress list → Subject detail → Entry/session page, and Daily Log is a separate tab — there's no single "Today" screen to combine them into.
- A real trend chart needs a historical-values query and calculation utilities that don't exist yet — that work is already deferred in `tasks/backlog.md` as **Phase 9 — KPI Dashboard (on hold)**.
- Sparklines in this plan's Daily Log phase (IC-6) therefore ship as a static tile grammar (label + big value + status dot) **without** a wired trend line. Wiring real sparklines belongs with Phase 9, once `kpi.utils.ts`-style trend calculations exist.

Building the combined Today dashboard is a genuine new feature (new IA, new queries) and per `CLAUDE.md` needs its own plan and explicit go-ahead before work starts — it is **not** authorized by this document. Listed as IC-9 below for visibility only.

---

## Token mapping (IC-1)

Every screen already consumes `_colors.scss` custom properties, so most of the reskin is a token swap rather than a rewrite. Table of every existing token and its new value:

| Token | Current (violet/white) | New (Iron & Chalk) | Notes |
|---|---|---|---|
| `--color-primary` | `#7c3aed` | `#ECEBE3` (chalk) | Primary action fill — buttons render dark-on-chalk instead of white-on-violet |
| `--color-primary-light` | `#a78bfa` | `#F5F4EF` | Hover state |
| `--color-primary-dark` | `#5b21b6` | `#C7C5BB` | Pressed state |
| `--color-secondary` | `#2563eb` | `#7EA4D6` (plate blue) | "Next goal" text, links |
| `--color-secondary-light` | `#60a5fa` | `#A8C3E5` | |
| `--color-accent` | `#059669` | `#4E9E68` (plate green) | Already the `FeedbackRating.Success` color — hex swap only |
| `--color-accent-light` | `#34d399` | `#7FC397` | |
| `--color-warning` | `#d97706` | `#E3A93C` (plate yellow) | Already the `FeedbackRating.Hard` color — hex swap only |
| `--color-error` | `#dc2626` | `#D2504B` (plate red) | Already the `FeedbackRating.Fail` color — hex swap only |
| `--color-primary-focus-ring` | `rgb(124 58 237 / 15%)` | `rgb(236 235 227 / 25%)` | Chalk-based, needs to stay visible on a dark surface |
| `--color-surface` | `#ffffff` | `#1F2126` (gunmetal) | Card backgrounds |
| `--color-surface-alt` | `#f9fafb` | `#17181C` (iron) | Page background — **verify every current consumer before remapping** (see Risks) |
| `--color-border` | `#e5e7eb` | `#2C2E35` | |
| `--color-text-primary` | `#111827` | `#ECEBE3` (chalk) | |
| `--color-text-secondary` | `#6b7280` | `#96948B` | |
| `--color-text-muted` | `#9ca3af` | `#6C6A63` | |
| `--color-text-inverse` | `#ffffff` | `#17181C` (iron) | Text on chalk buttons |

New token, no prior equivalent:

| Token | Value | Purpose |
|---|---|---|
| `--color-highlight` | `#F5E08E` | The Logbook's highlighter-swipe, borrowed as the PR-badge background. Deliberately separate from `--color-warning` (`#E3A93C`) even though both are yellow-family — one is a status color (*hard*), the other is a celebration marker (*PR*), and reusing a status color for a second meaning is exactly what the palette shouldn't do. |

**Deviation from the mockup:** the artifact used `Bahnschrift` for display/data type because that's a Windows-only system font and happened to render in the preview environment. Shipping on a Windows-only font means non-Windows users silently fall back to a generic condensed font and never see the intended type personality. IC-1 instead loads **Barlow Semi Condensed** (weights 500/600/700) via Google Fonts as the actual display/data face, with `Bahnschrift` kept first in the stack purely as a zero-cost sharper render for Windows users who already have it installed:
```
--font-display: 'Bahnschrift', 'Barlow Semi Condensed', 'Arial Narrow', sans-serif;
```

---

## Phasing

Each phase is one branch off `development`, one PR, following the same pattern as the earlier DR-1…DR-10 responsive-refactor series. Branches are unnumbered per `docs/standards/git-and-planning.md` (`refactor/name`).

### IC-1 — Tokens & Type Foundation
**Branch:** `refactor/iron-chalk-tokens`

- `src/styles/abstract/_colors.scss` — replace all values per the mapping table above; add `--color-highlight`.
- `src/styles/base/_typography.scss` — add `--font-display` custom property.
- `src/styles/abstract/_mixins.scss` — add two mixins:
  - `tabular-nums` — `font-variant-numeric: tabular-nums;` (for every set/weight/rep number going forward).
  - `surface-card` — `background: var(--color-surface); border: 1px solid var(--color-border); border-radius: variables.$radius-md;`, centralizing the card treatment every later phase needs instead of repeating it per component.
- `src/index.html` — add Google Fonts `<link>` for Barlow Semi Condensed 500/600/700 (same low-friction pattern already used for the Material Icons font link).
- Convert the feedback-pill background tints in `session-item-feedback.component.scss` from hardcoded `rgb(5 150 105 / 10%)`-style literals tied to the *old* hex values to `color-mix(in srgb, var(--color-accent) 10%, transparent)` (and equivalent for warning/error), so they track the new palette automatically instead of silently going stale — a real bug the token swap would otherwise introduce.

**Risks to verify before merging:**
- Audit every current consumer of `--color-surface-alt` — it's remapped from a near-white secondary tint to the darkest background in the new system (iron), which only works if it's currently used as "the page background," not as a lighter zebra-stripe inside a white card.
- Elevation: `_elevation.scss`'s `$shadow-*` values are black-on-transparent — invisible against a near-black `--color-surface-alt`. Cards need `surface-card`'s 1px border for definition instead of relying on shadow; keep `$shadow-*` for the modal layer only (dialogs still sit on a lighter overlay).
- Spot-check contrast: chalk-on-iron and the two muted greys against both gunmetal and iron must clear WCAG AA (4.5:1 body text, 3:1 large text).

**Acceptance:** `ng build` succeeds; every screen visually shows the new palette (this phase alone will look "broken" in places — pills, borders, and elevation are patched in IC-2 — that's expected and should be called out in the PR description).

---

### IC-2 — Shared Components
**Branch:** `refactor/iron-chalk-components`

- `ui-button`, `ui-input`, `ui-textarea`, `ui-link` — verify each already resolves color purely from tokens (no hardcoded hex); patch any that don't. Primary button becomes chalk-fill / iron-text.
- `ui-icon` — confirm inlined SVGs use `stroke="currentColor"` / `fill="currentColor"` so nav and button icons inherit the surrounding text color rather than a baked-in hex.
- New shared component **`StatTileComponent`** (`shared/components/stat-tile/`) — dumb, `OnPush`, `@include mixins.surface-card`: label, big tabular-nums value + unit, and a status dot. `status: InputSignal<TileStatus>` using a new `shared/enums/tile-status.enum.ts` (`Good | Warn | Neutral`) — never a raw string comparison for the dot color. No sparkline input yet (see Scope note on IC-6/IC-9).
- New shared component **`PrBadgeComponent`** (`shared/components/pr-badge/`) — dumb: a single `label: InputSignal<string>` rendered on the `--color-highlight` background. Used first on the Entry/Session exercise header (IC-5); reusable later by IC-9's chart annotations if that work is ever approved.
- Dialogs (`confirmation-dialog`, `log-entry-dialog`, `create-subject-dialog`, `add-item-dialog`, `complete-session-dialog`) and `ui-modal` — retheme surface/border/text via the same tokens; these already inherit from `_dialog.scss`'s shared panel class, so most of this is token cascade plus a manual check for any hardcoded colors.

**Acceptance:** every shared component renders correctly in isolation (temporarily mount each on one existing screen during review); `StatTileComponent` and `PrBadgeComponent` have no consumers yet (used starting IC-5/IC-6) — same "additive, unused until next phase" pattern as the original DR-1 tokens phase.

---

### IC-3 — App Shell & Navigation
**Branch:** `refactor/iron-chalk-shell`

- `home.component.scss` — retheme both the bottom-tab nav and the ≥1024px sidebar rail (they already share one `tabs()` signal per `HomeFacade`, so this is styling only, no template change): active tab gets the sidebar mockup's chalk left-bar treatment (`box-shadow: inset 3px 0 0 var(--color-text-primary)`), inactive tabs use muted secondary text.
- Verify `AppIcon` SVGs (`Progress`, `DailyLog`, `Kpi`, `Menu`) inherit `currentColor` correctly against both the active and inactive nav-item states.
- New-device alert banner (rendered in `HomeComponent`) — retheme to the plate-yellow/warning token rather than its current hardcoded color, if any.

**Acceptance:** nav is legible and passes contrast in both the bottom-tab (mobile) and sidebar-rail (desktop ≥1024px) layouts; active/inactive states are distinguishable without relying on color alone (the inset bar is a shape cue, not just a color cue).

---

### IC-4 — Progress & Subject Screens
**Branch:** `refactor/iron-chalk-progress-subject`

- `progress.component.ts/html/scss` — retheme the card grid (already a grid per Phase DR-4, this is a token/surface-card pass, not a layout change).
- `subject-card.component` and `entry-card.component` — currently plain button rows with a chevron; apply `surface-card` for definition against the iron background and bump to the shared button/text tokens.
- **Opportunistic cleanup (same file, same PR):** `progress.component.ts` currently imports `MatIconModule` directly for one icon, inconsistent with the `ui-icon`/`AppIcon` pattern used everywhere else. Since this phase already touches the file, replace it with `ui-icon` + a new `AppIcon` entry rather than leaving a second icon system in place. (Flagged here rather than as a separate task — it's in the direct path of this phase's changes, not scope creep.)
- `kpi.component.html` has the same `MatIconModule` usage for its empty-state icon — same fix, bundled into this phase since it's a one-line-per-file change, not deferred to IC-9's eventual KPI rebuild.

**Acceptance:** subject list and subject-detail (entry list) read as cards, not list rows; no `MatIconModule` import remains outside genuinely Material-dependent code (dialogs, if any still need it).

---

### IC-5 — Entry / Session Screen
**Branch:** `refactor/iron-chalk-entry-session`

- `set-row.component` — apply `tabular-nums` to weight/rep/time values; restyle against gunmetal/iron per the mockup's scoreboard treatment.
- `session-item.component` — exercise name header restyled with `--font-display`; attach `PrBadgeComponent` next to the exercise name when the session facade already knows a set is a personal record (verify this exists as data today — if `EntryFacade` has no "is this a PR" signal yet, this bullet narrows to "wire the badge when a PR is already flagged" and does **not** add new PR-detection logic, which would be a data/facade change outside this plan's scope).
- `session-item-feedback.component` — no template/logic change; visually verify the `color-mix()`-based tints from IC-1 render correctly as plate-color pills.

**Acceptance:** logging a set is legible against the new dark surface; feedback pills read as green/yellow/red plate colors; no PR-detection logic was invented if it didn't already exist.

---

### IC-6 — Daily Log Screen
**Branch:** `refactor/iron-chalk-daily-log`

- `log-card.component` — replace the current plain `<span>` label/value rows with a `StatTileComponent` grid (Sleep / Water / Weight / Waist), each rendering that day's value with a `Neutral` status (no goal/target comparison exists yet — `HealthGoal` is Phase 8, on hold — so `Good`/`Warn` status can't be computed honestly; ship `Neutral` for all four until Phase 8 lands).
- `daily-log.component.html` — the `<ul class="daily-log__list">` structure stays; only the per-day card's internal layout changes to the tile grid.
- **No sparkline wiring** in this phase (see Scope) — `StatTileComponent`'s trend prop, if added in IC-2, stays unused here.

**Acceptance:** each day's log reads as four consistent tiles instead of inline text pairs; status dots are neutral/uniform (not fabricated).

---

### IC-7 — Menu, Profile, Settings
**Branch:** `refactor/iron-chalk-menu-profile-settings`

- `menu.component` — retheme list; add icons to Profile/Settings nav links using existing `AppIcon` pattern (no icons exist for these today — new SVGs under `src/assets/icons/` + two new `AppIcon` enum entries).
- `profile.component`, `settings.component` — retheme Signal Forms inputs (`ui-input`, date input, button-group pattern for weight/distance unit toggles) against dark surfaces; re-verify focus-ring visibility specifically here since forms are the densest interactive surface in the app.

**Acceptance:** forms are fully operable via keyboard with a visible focus state on every field; Menu list has icons consistent with the rest of the app's nav.

---

### IC-8 — Auth Screens
**Branch:** `refactor/iron-chalk-auth`

Login, Signup, Forgot Password, Reset Password, and Verify Device (OTP) screens are the only surfaces the mockup never touched, and the easiest to forget — shipping IC-1 through IC-7 without this phase would leave a jarring light-violet screen as literally the first thing every user sees.

- Retheme all five auth components against the same tokens; no layout or validation-logic changes.
- Double-check password/email input contrast and error-state (red) legibility against gunmetal — auth is the one place a user hits `FeedbackRating`-adjacent error styling (`ValidationKind`-driven field errors) before ever seeing the rest of the app.

**Acceptance:** auth flow is visually consistent with the rest of the app; no functional change.

---

## Sequencing rationale

Tokens and shared components first (everything downstream depends on them), then the shell (so navigating between screens during review already looks right), then screens in rough traffic order (Progress/Subject → Entry/Session → Daily Log → Menu family), with Auth last because it's the lowest-traffic surface for an already-authenticated developer doing the work, but explicitly not skipped.

## Rollout

Same pattern as the DR-1…DR-10 series: merge each phase to `development` independently, no feature flag. Unlike the DR series (which was additive/responsive and safe to ship incrementally), a partially-merged Iron & Chalk will look genuinely broken (some screens dark, some still violet-on-white) — merge phases to `development` freely for review, but **hold the `development` → `main` promotion until IC-1 through IC-8 are all merged**, so production users see one clean cutover rather than a half-reskinned app.

## Branch bookkeeping note

The repository's current branch is `feature/26-security-account-change-alerts`, mid-flight on an unrelated security feature. This plan is unrelated to that work — per "one PR per feature," IC-1 should start from a fresh branch off `development`, not stack on top of `feature/26`. This plan document itself has been written to the working tree only; nothing has been committed.

## Deferred — IC-9 (not authorized by this plan)

For visibility only, sketched so a future planning pass doesn't start from zero:
- A combined "Today" dashboard (session + daily log on one screen) — new IA, likely reshapes the Progress landing page or adds a new route.
- Subject quick-switch tab strip.
- A real KPI trend chart with historical data — needs the calculation utilities already sketched in `tasks/backlog.md`'s Phase 9 (`kpi.utils.ts`: `avgSleep`, `avgWeight`, `avgWater`, `avgWaist` vs. targets) plus a new chart-rendering shared component, following the dataviz conventions used when this direction was first pitched (single-hue line, gridlines, hover tooltip, screen-reader table fallback, `PrBadgeComponent` reused as the chart's PR annotation).
- Wiring `StatTileComponent`'s trend prop to real per-metric history once the above exists.

Any of this needs its own `plans/*.md` and explicit go-ahead before implementation, per `CLAUDE.md`.
