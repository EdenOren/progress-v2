# Profile Screen — Rebuild

**Type:** feature (screen rebuild) + a ui-kit release it depends on
**Target:** `development`
**Branches:** `feat/number-form-field` (ui-kit repo) → ui-kit 0.4.0, then `feature/48-profile-screen` (this repo)
**Status:** Parts A–D built 2026-08-12, nothing committed in this repo. Part A is verified in a browser but **still unpublished**, so `package.json` points at `file:../ui-kit/dist/ui-kit` and cannot be committed that way. Scope approved 2026-08-10. See "Where this stands" at the foot for what is left.

---

## Why

Profile shipped in Phase 7 as three fields and a Save button, and hasn't been revisited except for spacing passes (DR-9, RX-7). Four concrete problems:

**1. The Height field is a different control from the other two.**
Not an app bug — `UiInputComponent` renders two unrelated things depending on `type`:

| | `InputType.Text` / `.Date` | `InputType.Number` |
|---|---|---|
| markup | `.ui-input__wrapper > .ui-input__control` | bare `.ui-input__number` |
| host display | `flex` column, full width | `inline-block`, `width: clamp(48px, 15vw, 64px)` |
| value binding | `[formField]="field()"` | `[value]` + `(valueChange)` on blur |
| error region | `.ui-input__error` with `aria-describedby` | none |

The number branch was built for set-row cells in the workout log. Profile is the only screen using it as a *form field*, so Height renders as a ~56px box beside two full-width inputs, lives in its own `_heightCm` signal outside `profileForm`, has no validation surface, and doesn't participate in dirty tracking. `complete-session-dialog`'s Duration field has the identical problem (tracked as a follow-up, not batched here).

**2. `displayName` is written but never read.** Signup captures it (`signup.component.ts:136`), the DB stores it, Profile edits it — and nothing in the app renders it. The desktop rail shows `userEmail()` and derives the avatar letter from the email (`home.facade.ts:61-66`).

**3. The screen has no identity context.** No indication of which account you're editing, when you joined, how you sign in, or how to change your password.

**4. Save feedback never clears.** `ProfileFacade` sets `_saveSuccess` and leaves it set until the next save. Settings already solved this (`SettingsFacade.SAVE_SUCCESS_DURATION_MS`, 2000 ms).

Plus one latent bug found while reading: `_profileResource` params are `{ userId: this.authService.userId() }`, and `userId()` returns `''` until the session resolves. The first load fires `getProfile('')` against Supabase and can flash the error state before the real load.

---

## Decisions taken

| Question | Decision |
|---|---|
| How to fix the Height input | Fix it properly in ui-kit 0.4.0 — number inputs accept a signal-forms field and gain a full-width form layout |
| Screen scope | Identity header + "About you" (editable) + "Account" (read-only + change password) |
| Sidebar chip | **Display name only, with its first letter as the avatar. No email in the rail.** |

### Out of scope (flagged, not planned here)

- **Avatar upload.** `profiles.avatar_url` exists and ui-kit ships `UiFileUploadComponent`, but there is no Supabase storage bucket or RLS policy for it. Needs its own plan.
- **Delete account.** Needs a service-role Edge Function plus a cascade decision across subjects/entries/logs. Own plan.
- **Email change.** No such flow exists anywhere in the app — Phase 11b narrowed its own scope for exactly this reason. Email stays read-only.
- **Body weight on Profile.** `profiles.weight_kg` exists but is dead: weight is a Daily Log metric (`daily_log_entries.weight_kg`) and belongs on that timeline, not on a static profile. Do not add a weight input. Dropping the column is a separate migration.
- **Height unit switching.** Settings has weight (kg/lb) and distance (km/mi) units but no length unit, and cm is unambiguous. Stays cm.

---

## Part A — ui-kit 0.4.0 (repo: `../ui-kit`) — ✓ built, ✓ proven in a browser, ✗ not published

Branch `feat/number-form-field` (ui-kit uses `feat/` + conventional commits, not this repo's numbered `feature/N-` convention). Commits `6fdf079` (feature) and `8b10b00` (release bump).

### A1 — `UiInputComponent` accepts a numeric field ✓

```ts
readonly field: InputSignal<Field<string> | Field<number | null> | null> =
  input<Field<string> | Field<number | null> | null>(null);

/** Full-width form field instead of a set-row cell. Implied by `field`. */
readonly block: InputSignal<boolean> = input<boolean>(false);
```

No value-accessor work was needed: Angular signal forms already bind `<input type="number">` to a `number | null` model — `signals.mjs` reads `element.value === '' ? null : element.valueAsNumber` and writes back through `element.valueAsNumber`. The library only hands the element to `[formField]`.

**Built differently from the sketch above:** `field` presence *implies* the block layout — `isNumberField = isNumber() && (block() || field() !== null)` — because a bound form field is never a set-row cell. `block` remains for the value-driven case, which is exactly what the `complete-session-dialog` follow-up needs without rewriting that dialog onto signal forms.

### A2 — Template: two elements, not one ✓

The field-bound input **deliberately omits `[min]`, `[max]` and `[disabled]`**. `FormField.elementAcceptsNativeProperty` syncs those onto the element from the field's own validators, so a template binding is a second writer fighting it — and `min` defaults to `0`, which would silently override a `min(path.heightCm, 50)` schema rule. Hence two sibling elements inside the shared wrapper (field-bound and value-bound) rather than one with conditional bindings.

`type="number"` is a **static attribute** on both, so the element already reads as a number control when `FormField` inspects it during construction, instead of depending on when a `[type]` property binding lands.

One compile-time wrinkle: `[formField]` resolves its generic from the expression handed to it, so passing the union collapsed to `Field<string | null, string | number>`, which neither branch satisfies. Each branch binds through its own narrowed computed (`textField()` / `numberField()`).

### A3 — Backwards compatibility ✓

`block` defaults to `false` and no existing number consumer passes a `field`, so all ten are untouched: `set-row` (×5), `log-entry-dialog` (×4, `tile`), `complete-session-dialog` (×1). The host's `ui-input--number` class (`display: inline-block`) now keys off `isNumberCell()` so the block layout keeps the default flex column. Recipebox consumes ui-kit too — the change is additive, but build it before releasing.

### A4 — `ValidationKind` gains five members ✓

Not in the original scope, but Parts B–D can't compare against range errors without them and `CLAUDE.md` bans string literals in comparisons: `Min`, `Max`, `MaxLength`, `Pattern`, and `Parse`.

`Parse` is new surface area to design for — text the browser can't parse as a number now raises a `parse` error on the field instead of silently becoming `null`. Better than the old `NaN → null`, but **the Profile screen needs a message for it** (see the i18n list).

### A5 — Release — deferred on purpose

Version is bumped to 0.4.0 and `pnpm build` is clean, but **nothing is published yet**. The change is verified statically only: Angular's read *and* write paths both key on `element.type === 'number'`, and the compiled template emits all four arms with the static attribute. It has not run in a browser.

Three things blocked a runtime test at Part A time: `node_modules/@edenoren/ui-kit` in this repo is a pnpm store symlink (writing into it corrupts the shared content-addressable store), this repo was mid-work on another feature branch (lockfile churn), and ui-kit has no DOM test environment (node-only vitest, no jsdom).

**So the sequencing changes:** publish *after* the first working Profile build, not before it.

1. On `feature/48-profile-screen`, install the local build: `pnpm add file:../ui-kit/dist/ui-kit`
2. Wire the height field and confirm in a browser — value round-trips as a number, empty is `null`, `min`/`max` come from the validators, `dirty`/`touched` behave, and a `parse` error surfaces a readable message
3. Only then `pnpm release` from ui-kit and swap the file dependency for `^0.4.0`

If step 2 turns up a problem, it is a fix on `feat/number-form-field` — cheaper than yanking a published version that recipebox may already have taken.

### A6 — Step 2 result: it works ✓

Verified against the running app on 2026-08-12. The height field renders as:

```html
<input type="number" class="ui-input__control" id="height"
       min="50" max="300" name="ng.form0.heightCm">
```

`ui-input__control` is the same class the text inputs use, so it took the block branch, not the set-row cell; the host measures **672px, identical to the display-name input**. `min`/`max` arrived from the schema validators through `FormField.elementAcceptsNativeProperty` — and the old hardcoded `min="0"` is gone, which is the collision A2 predicted. `name` confirms the `[formField]` binding. Values read back as numbers (`valueAsNumber` 180, not `"180"`), empty stays empty, and below-50 / above-300 both raise the range message.

One caveat worth knowing before publishing: the first attempt showed the **0.3.0** markup because the dev server had been running since before `pnpm add file:…` and Vite was serving its cached copy of the package. Restart the dev server after swapping the dependency, or the change looks broken when it is not.

`ValidationKind.Parse` could not be triggered: Chrome blanks unparseable text in a number input rather than exposing it. The message is wired and stays defensive.

---

## Part B — Shared profile state

The sidebar and the Profile screen both need the profile, and a Profile save must move the sidebar immediately. Two independent resources would double-fetch and drift, so the resource moves out of the feature facade.

**New:** `src/app/core/services/data/profile/current-profile.service.ts`, `@Service()` (app-level singleton, like `ProfileService` and `AuthService`).

Surface:

```ts
readonly profile: Signal<Profile | null>
readonly isLoading: Signal<boolean>
readonly hasError: Signal<boolean>
readonly displayName: Signal<string>
readonly initial: Signal<string>        // first char of displayName, uppercased
reload(): void
save(input: UpdateProfileInput): Promise<Result<void>>   // reloads on success
```

Two things it fixes on the way:

- **Idle until authenticated.** `params: () => { const userId = this.authService.userId(); return userId ? { userId } : undefined; }` — returning `undefined` keeps the resource idle instead of firing `getProfile('')`.
- **One fetch, one truth.** `ProfileFacade` keeps its translation signals, save-state signals and `isReady`, but delegates all data access here. `HomeFacade` injects it for the rail.

Not doing: mirroring the display name back into `auth.users.user_metadata`. Nothing reads that metadata after signup, and writing it would mean two sources of truth for the same string.

---

## Part C — The Profile screen

Stays inside `app-ui-page [narrow]` with Save in the `slot="primary"` thumb bar (RX-7 already put it there).

```
┌─────────────────────────────┐
│ Profile              [Save] │
├─────────────────────────────┤
│  ╭──╮                       │
│  │E │  Eden Oren            │
│  ╰──╯  edenoren@gmail.com   │
│        Member since Jun 2026│
│                             │
│  ABOUT YOU                  │
│  Display name               │
│  [ Eden Oren             ]  │
│  Date of birth      (age 29)│
│  [ 1996-04-12            ]  │
│  Height (cm)                │
│  [ 178                   ]  │
│                             │
│  ACCOUNT                    │
│  Email    edenoren@gmail.com│
│  Sign-in  Password          │
│  Change password         ›  │
└─────────────────────────────┘
```

### C1 — Identity header (read-only)

Avatar circle with the display-name initial, display name as the heading, email beneath it, then "Member since {{ createdAt | date }}". This is the one place the email *should* be prominent, since the rail no longer carries it.

The avatar circle exists today as `.home__sidebar-user-avatar`. Extract it rather than copy it: **new** `src/app/shared/components/user-avatar/` — a dumb component taking `initial: InputSignal<string>` and `size: InputSignal<UserAvatarSize>`, with `UserAvatarSize { Sm = 'sm', Lg = 'lg' }` (32 px rail / 64 px header) in `src/app/shared/enums/user-avatar-size.enum.ts`. The rail migrates onto it in Part D.

Skeleton (`SkeletonVariant.Row`) covers the header while loading, matching the existing pattern.

### C2 — "About you" — all three fields in one form

```ts
interface ProfileFormModel {
  displayName: string;
  dateOfBirth: string;
  heightCm: number | null;
}

readonly profileForm: FieldTree<ProfileFormModel> = form(this._model, (path) => {
  required(path.displayName);
  minLength(path.displayName, ProfileComponent.DISPLAY_NAME_MIN_LENGTH);
  maxLength(path.displayName, ProfileComponent.DISPLAY_NAME_MAX_LENGTH);
  min(path.heightCm, ProfileComponent.HEIGHT_MIN_CM);
  max(path.heightCm, ProfileComponent.HEIGHT_MAX_CM);
  validate(path.dateOfBirth, notInFuture);
});
```

- `DISPLAY_NAME_MIN_LENGTH = 2` to match `SignupComponent`; consider hoisting the constant so the two screens can't drift.
- Height renders `[type]="inputType.Number" [block]="true" [field]="profileForm.heightCm"`. **`_heightCm`, `heightCm()` and `onHeightChange()` are deleted** — the imperative side-channel disappears entirely.
- Date of birth gets a `notInFuture` validator (and a sane 1900 floor), plus a derived age shown as helper text next to the label.
- **Save is disabled unless `profileForm().dirty()`** and re-enabled after a successful save resets the baseline.
- Error strings come from the existing `displayNameError()` pattern, extended per field via `ValidationKind`.

**Date handling — read this before writing the age helper.** `dateOfBirth` is a plain `YYYY-MM-DD` string and Phase DR-10 already fixed a UTC-vs-local bug in this codebase. New `src/app/shared/utils/date.ts` with `calculateAge(dateOfBirth: string, today: Date): number | null` that splits the string on `-` rather than passing it to `new Date()` (which parses date-only strings as UTC and shifts the day for anyone west of Greenwich), plus `date.spec.ts` alongside it — matching `duration.ts` / `duration.spec.ts`.

### C3 — "Account"

Rendered as 56 px destination rows, the same grammar RX-7 gave the Menu, so account rows look the same wherever they appear.

| Row | Behaviour |
|---|---|
| Email | Value only, no action. There is no email-change flow. |
| Sign-in method | `AuthProvider.Password` or `AuthProvider.Google`, read from `session.user.app_metadata.provider`. **New** `src/app/core/enums/auth-provider.enum.ts` (`Password = 'email'`, `Google = 'google'`) — no string literals in the comparison. |
| Change password | Only rendered for `AuthProvider.Password`. Calls `authService.resetPasswordForEmail(email)` in place and swaps to a "check your inbox" confirmation. |

**Why not link to `/auth/forgot-password`:** that route carries `guestGuard` (`auth.routes.ts`), so a signed-in user is bounced straight back. `/auth/reset-password` deliberately has no guard, so the emailed link still lands correctly, and completing it fires the Phase 11b password-changed alert for free.

### C4 — Save feedback

Lift Settings' pattern: `SAVE_SUCCESS_DURATION_MS = 2000`, success message auto-clears, `isSaving` keeps the button disabled. Profile keeps an explicit Save button (unlike Settings' auto-save — per-keystroke writes make no sense for free text). Consider hoisting the constant somewhere shared so both facades read one value.

---

## Part D — Sidebar and Menu identity

### D1 — Desktop rail

`home.facade.ts`: `userInitial` derives from `currentProfileService.displayName()`, falling back to the email's first character while the profile is still loading; add `userName: Signal<string>`.

`home.component.html`: the chip label becomes the display name. **No email line** — per the decision above. The chip's `[attr.aria-label]` currently reads the email; it becomes the display name plus an "account menu" affordance so screen-reader users get the same thing sighted users do.

```
╭──╮  Eden Oren            ⌄
│E │
╰──╯
```

Migrate the chip's avatar span onto `UserAvatarComponent` (`UserAvatarSize.Sm`) and delete the duplicated `.home__sidebar-user-avatar` rules.

### D2 — Menu page (phone equivalent) — ✓ built, not cut

The Menu screen is the phone's version of the rail and opened straight into three unlabelled rows. It now carries the same avatar and display name above them.

Name only, matching the rail — the email stays exclusive to Profile's identity header, per the decision above. `userName` falls back to the email until the profile resolves, so the header is never blank.

---

## i18n

All under `PROFILE` in `src/assets/i18n/en.json`, `UPPER_SNAKE_CASE`:

`SECTION_ABOUT`, `SECTION_ACCOUNT`, `MEMBER_SINCE`, `AGE`, `EMAIL`, `SIGN_IN_METHOD`, `SIGN_IN_METHOD_PASSWORD`, `SIGN_IN_METHOD_GOOGLE`, `CHANGE_PASSWORD`, `CHANGE_PASSWORD_SENT`, `CHANGE_PASSWORD_ERROR`, `DISPLAY_NAME_TOO_SHORT`, `DISPLAY_NAME_TOO_LONG`, `HEIGHT_RANGE_ERROR`, `HEIGHT_INVALID_ERROR` (`ValidationKind.Parse`), `DATE_OF_BIRTH_FUTURE_ERROR`.

Cleanup: `PROFILE.LOADING` (and `SETTINGS.LOADING`) went dead in RX-8 when skeletons replaced the loading paragraphs — delete them.

---

## New files

```
../ui-kit/  (0.4.0)
  src/lib/components/ui-input/ui-input.component.{ts,html,scss}   modified

src/app/core/enums/auth-provider.enum.ts                          new
src/app/core/services/data/profile/current-profile.service.ts     new
src/app/shared/enums/user-avatar-size.enum.ts                     new
src/app/shared/components/user-avatar/                            new
src/app/shared/utils/date.ts + date.spec.ts                       new
src/app/features/profile/profile.component.{ts,html,scss}         rewritten
src/app/features/profile/profile.facade.ts                        delegates to CurrentProfileService
src/app/features/home/home.{facade.ts,component.html,component.scss}  rail identity
src/app/features/menu/menu.component.{html,scss}                  optional header
src/assets/i18n/en.json                                           PROFILE keys
```

---

## Rollout

**PR 1 — ui-kit** `feat/number-form-field` → 0.4.0. Built and committed; **publish only after PR 2's step 1 proves it in a browser** (see A5).

**PR 2 — this repo** `feature/48-profile-screen` → `development`, in reviewable commits:

1. `chore: bump ui-kit to 0.4.0` — via `file:../ui-kit/dist/ui-kit` while verifying, swapped to `^0.4.0` once published
2. `refactor: move profile state into CurrentProfileService` (Part B, including the idle-until-authenticated fix)
3. `feat: shared user avatar component` (Part C1 extraction + rail migration)
4. `feat: rebuild the profile screen` (Parts C2–C4 + i18n)
5. `feat: show the display name in the sidebar` (Part D)

## Follow-ups (separate branches, not batched here)

- `bugfix/NN-muted-text-contrast` — **`--color-text-muted` (#6c6a63) fails WCAG AA app-wide**, found during this screen's pass and too wide to fix here. Measured on the live app: `ui-stat-tile__label` **2.98:1** (every KPI and Daily Log tile label), the KPI volume-chart axis **3.28:1**, `recent-workout-card__duration` **2.98:1**, `home__tab-label` in the desktop rail **2.98:1**. All need 4.5:1. `--color-text-secondary` clears it at 5.3–5.8:1, so the fix is either retiring the muted token for body text or darkening the surfaces it sits on — a ui-kit decision, since `ui-stat-tile` is a library component. Separately, `menu__row--destructive` sits at **3.83:1** in `--color-error`.
- `bugfix/NN-session-duration-input` — `complete-session-dialog` adopts `[block]="true"` for Duration, same visual bug, different screen.
- Avatar upload (needs a storage bucket + policies).
- Delete account (needs a service-role Edge Function).
- Migration to drop the unused `profiles.weight_kg`.

---

## Risks

| Risk | Mitigation |
|---|---|
| ui-kit's number branch is shared with set-row and the log-entry tiles | `block` defaults to `false` and none of the ten pass a `field`, so none change branch; still verify them visually, and build recipebox before releasing |
| `[formField]` on `type="number"` has not run in a browser | Verified statically only (framework source, both directions; compiled template). Publishing is gated on proving it in the app first — see A5 |
| A `parse` error can now appear where the old code silently produced `null` | `ValidationKind.Parse` exists and the Profile screen ships a message for it |
| Date-only strings shift a day across timezones | `calculateAge` parses by splitting the string, never `new Date(string)`; covered by `date.spec.ts` |
| Two screens now render an avatar | One shared component from the start, not a copied span |
| PR 2 grows large | Part D2 (Menu header) is the designated cut |

## Verification

- [x] All three "About you" inputs are visually identical and full-width — measured 672px each on desktop, and **337.8×48px each at a 387px viewport**, sharing identical left/right edges. Height keeps the `ui-input__control` block class at phone width and still carries `min="50" max="300"` from the validators. `scrollWidth === clientWidth`, so nothing overflows horizontally. Measured in a same-origin 390px iframe: Chrome refuses to resize a maximized window, and an iframe evaluates media queries against its own viewport
- [x] Height validates in-form (below 50 and above 300 both show the range error; empty clears without error)
- [x] Save is disabled until something changes — disabled on load, enabled after a valid edit. Note it stays enabled while the form is *invalid*; `onSave` guards on `valid()` and marks fields touched, which is what the previous screen did
- [x] The success message clears itself — shown after the save, gone 2.2s later
- [x] Editing the display name updates the sidebar without a reload — saved "Wolverine": header, header avatar, rail label and rail avatar all followed in the same tick, Save fell back to disabled on the fresh baseline. Restored to "Eden" and confirmed after a reload
- [ ] Signing in shows no error flash before the profile loads — the idle-until-authenticated fix is covered by `current-profile.service.spec.ts`, but no cold sign-in was watched
- [~] Change password sends the email; the row is hidden for Google accounts — **the send was not exercised**: it emails the real account, so it needs an explicit go-ahead. The gating is verified as far as it can be without a Google account: `isPasswordAccount`/`isGoogleAccount` both compare `session.user.app_metadata.provider` against `AuthProvider`, and the whole block sits behind `@if (facade.isPasswordAccount())`. On the live password session the row renders and Sign-in reads "Password", so the false branch is the only untested half
- [x] Age is correct for a birthday today, and in a negative-UTC-offset timezone — `date.spec.ts`, including the 29 February case
- [x] Keyboard navigation reaches every row; contrast AA; names on every control — audited in-page (contrast ratios computed from live styles, not axe: the project has no axe-core, so this is a hand-rolled pass covering contrast, accessible names, tab order, hit area, heading order and focusable-inside-`aria-hidden`)
  - Profile: 17 text elements, **0 failures** after fixing two of mine — `.profile__identity-since` and `.profile__field-hint` used `--color-text-muted` at **3.28:1** against a 4.5:1 floor; both now `--color-text-secondary` (5.3:1). The email the plan worried about was never the problem: it passes at 5.83:1.
  - Every control carries a name (`Save`, the three field labels, `Change password`), sits at 48–56px, and is reachable at `tabIndex 0`. Heading order runs h1 Profile → h2 name → h3 About you → h3 Account. Nothing focusable hides inside the `aria-hidden` avatar.
  - Menu: identity header correct, avatar `aria-hidden`, three 56px named rows. One **pre-existing** failure — `Log out` in `--color-error` at 3.83:1.
- [x] `pnpm build` under the 640 kB budget set in RX-8 — 616.11 kB
- [x] `pnpm test` — 92 across 8 files

## Where this stands

Built: Parts A–D, including D2. Nothing is committed in this repo.

Blocking the first commit: `package.json` reads `"@edenoren/ui-kit": "file:..\\ui-kit\\dist\\ui-kit"` — a Windows-separator local path that would break CI and every other checkout. It is swapped for `^0.4.0` once 0.4.0 is published from `../ui-kit` (build recipebox against it first, per the risk table).

Left after that: the five unchecked verification items above, then the commit sequence and PR.
