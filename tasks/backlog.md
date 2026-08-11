# Backlog

## Phase 0 — Scaffold ✓ (complete)
- [x] Angular 22 scaffold + pnpm
- [x] Dependencies installed
- [x] tsconfig strict mode
- [x] angular.json SCSS paths + environment replacements
- [x] CLAUDE.md written
- [x] app.config.ts, app.routes.ts, app.ts
- [x] Core layer (Result, AppError, error-mapper, SupabaseService, AuthService, authGuard)
- [x] Style partials (colors, variables, mixins, reset, typography)
- [x] i18n en.json

## Phase 1 — DB Migrations (user runs these on Supabase)
- [x] 012_expand_daily_log.sql — water_intake_liters, waist_cm confirmed present on daily_log_entries
- [x] 013_expand_profiles.sql — date_of_birth confirmed present on profiles
- [ ] 014_health_goals.sql — create health_goals table + RLS
- [ ] 015_simplify_settings.sql — drop active_module constraint

## Phase 2 — Auth feature ✓ (complete — branch: feature/2-auth)
- [x] LoginComponent + LoginFacade
- [x] SignupComponent + SignupFacade
- [x] AuthCallbackComponent (/auth/callback)
- [x] Wire app.routes.ts with lazy-loaded auth routes
- [x] AppRoute + AuthRoute enums
- [x] en.json AUTH section (login, signup, callback, validation, error)
- [x] Auth refactor: AuthRoute → core/enums, form in component, shared UI components (UiInput, UiButton, UiLink), stream-based i18n

## Phase 2b — Auth Extensions ✓ (complete — branch: feature/23-auth-password-reset)
- [x] Forgot password flow: ForgotPasswordComponent (/auth/forgot-password) — calls supabase.auth.resetPasswordForEmail()
- [x] Reset password page: ResetPasswordComponent (/auth/reset-password) — receives token from email link, calls supabase.auth.updateUser({ password })
- [x] AuthRoute enum entries: ForgotPassword, ResetPassword
- [x] en.json AUTH.FORGOT_PASSWORD + AUTH.RESET_PASSWORD sections
- [x] Wire lazy routes into auth.routes.ts (ResetPassword intentionally has no guestGuard — see plan)

## Phase 3 — Navigation Shell ✓ (complete — branch: feature/3-nav-shell)
- [x] ShellComponent with bottom 3-tab nav (Progress | KPI | Menu)
- [x] ShellFacade — activeRoute signal, tabs computed, navigateTo()
- [x] Lazy-loaded routes for progress, kpi, menu as children of shell
- [x] AppRoute enum — Kpi, Menu added
- [x] Stub KpiComponent, MenuComponent
- [x] en.json NAV section

## Phase 4 — Progress Tab (workout) ✓ (complete — branch: feature/4-progress)
- [x] Subject list (resource(), empty/loading/error states, mat-icon)
- [x] Create subject modal (MatDialog + Signal Forms)
- [x] Subject detail page (entry list, delete with confirmation)
- [x] Entry detail page (stub — full session tracking is Phase 5)
- [x] Data layer: domains.data.ts, subjects.data.ts, entries.data.ts
- [x] Shared: ConfirmationDialogComponent
- [x] Routing: progress/subject/:subjectId, progress/subject/:subjectId/entry/:entryId
- [x] withComponentInputBinding() added to router

## Phase 5 — Active Workout Session ✓ (complete — branch: feature/5-session)
- [x] Data layer: items.data.ts, item-sets.data.ts, item-feedback.data.ts, user-settings.data.ts
- [x] entries.data.ts mutations: getEntry, createEntry, startEntry, completeEntry, getLastCompletedEntry
- [x] Enums: FeedbackRating, TrackingType, DistanceUnit
- [x] Unit conversion utility (meters ↔ km/miles/yards)
- [x] SetRowComponent — 3 tracking type variants (weight×reps, MM:SS timer, distance with unit)
- [x] SessionItemComponent — sets, previous session, feedback buttons, note input
- [x] AddItemDialogComponent — Signal Forms dialog
- [x] CompleteSessionDialogComponent — stats, editable duration, optional notes
- [x] EntryFacade — full: timer, resources, all mutation methods
- [x] EntryComponent — full template replacing stub
- [x] SubjectFacade.startWorkout() — creates entry, navigates
- [x] SubjectComponent — Start Workout button (play icon in header)
- [x] en.json ENTRY section fully expanded

## Phase 6 — Daily Log ✓ (complete — branch: feature/6-daily-log)
- [x] daily-log/daily-log.service.ts + daily-log/daily-log.model.ts — getDailyLogsForRange, upsertDailyLog, Zod ZodType<T> annotations
- [x] en.json DAILY_LOG section + NAV.DAILY_LOG
- [x] AppRoute.DailyLog, AppIcon.DailyLog, daily-log.svg icon
- [x] 4th nav tab (Progress | Daily Log | KPI | Menu) in HomeFacade
- [x] DailyLogComponent + DailyLogFacade (weekResource, computed signals)
- [x] LogCardComponent (dumb: date + per-metric display, UiButton edit action)
- [x] Lazy route under home shell children
- [x] LogEntryDialogComponent (4 number inputs, pre-fills from existingEntry, create/edit title)
- [x] DialogType.LogEntry + DialogService overload
- [x] DailyLogFacade.openLogDialog() + upsertLog() + reload()

## Phase 7 — Profile ✓ (complete — branch: feature/7-profile)
- [x] date_of_birth DATE column — already exists in DB, no migration needed
- [x] core/services/data/profile/profile.service.ts + profile.model.ts (ProfileRaw, Profile, UpdateProfileInput, mapProfile)
- [x] en.json MENU + PROFILE sections
- [x] AppRoute.Profile, lazy route under shell children
- [x] MenuComponent — Profile navigation link
- [x] ProfileFacade — _profileResource, translation, saveProfile(), saveSuccess/saveError signals
- [x] ProfileComponent — Signal Form (displayName required, dateOfBirth), WritableSignal for heightCm, one-shot effect pre-fill, save feedback
- [x] InputType.Date added to shared enum

## Phase DR-1 — Design Tokens ✓ (complete — branch: refactor/design-tokens, merged PR #12)
- [x] _typography.scss — leading-tight/leading-snug tokens, h1-h4 element rules
- [x] _variables.scss — $touch-target-min, $dialog-max-width, $container-max-width, $card-grid-min
- [x] New _elevation.scss — $elevation-card/-card-hover/-modal wrapping existing $shadow-*
- [x] _mixins.scss — touch-target mixin

## Phase DR-2 — Shared Components ✓ (complete — branch: refactor/shared-components, merged PR #13)
- [x] ui-button — ButtonSize enum (Sm/Md), touch-target mixin on icon-only/ghost, CSS spinner loading state
- [x] ui-icon — size InputSignal (default 24)
- [x] ui-input / ui-textarea — responsive number-input width, textarea font-size fix
- [x] dialog.service.ts — shared DEFAULT_DIALOG_CONFIG (shared panelClass)
- [x] New global _dialog.scss — responsive dialog width via panelClass, capped at $dialog-max-width
- [x] confirmation-dialog — fix template/SCSS BEM class mismatch
- [x] Remove per-dialog DIALOG_WIDTH constants (all 5 dialogs)

## Phase DR-3 — App Shell Nav ✓ (complete — branch: refactor/app-shell-nav, merged PR #14)
- [x] home.component — desktop sidebar rail (≥1024px) alongside existing bottom nav
- [x] Bottom nav hidden at lg via respond-to mixin; content max-width container at lg

## Phase DR-4 — Progress Dashboard ✓ (complete — branch: refactor/progress-dashboard, merged PR #15)
- [x] progress.component — responsive card grid (1 col mobile, auto-fill md+), elevation tokens
- [x] Empty-state icon scales up at md+

## Phase DR-5 — Daily Log Redesign ✓ (complete — branch: refactor/daily-log, merged PR #16)
- [x] Row min-height to $touch-target-min, text size bump at md+
- [x] FAB repositioned using env(safe-area-inset-bottom)

## Phase DR-6 — Entry/Session Redesign ✓ (complete — branch: refactor/entry-session, merged PR #17)
- [x] Header timer un-absolutely-positioned (flex space-between)
- [x] Set-row responsive input width, touch-target mixin on delete/remove buttons
- [x] Row padding bump, feedback buttons min-height

## Phase DR-7 — Subject Redesign ✓ (complete — branch: refactor/subject, merged PR #18)
- [x] Header buttons touch-target mixin + contrast fix
- [x] Responsive title font-size step-down, entry-card min-height + hover feedback

## Phase DR-8 — Menu/KPI Shell Restyle ✓ (complete — branch: refactor/menu-kpi-shell, merged PR #19)
- [x] Menu — tokenized spacing, new ButtonSize on Profile button
- [x] KPI — replace `<p>KPI</p>` stub with proper empty-state (icon + KPI.COMING_SOON), matching Progress empty-state pattern

## Phase DR-9 — Profile Pass ✓ (complete — branch: refactor/profile-pass, merged PR #20)
- [x] Verify/adjust spacing to tokens, save button adopts new ButtonSize

## Phase DR-10 — Daily Log Bug Fixes (branch: bugfix/21-daily-log-fixes, PR #21 open)
- [x] Fixed last-7-calendar-days query → last-7-entries query (entries with gaps were hidden)
- [x] Fixed UTC-vs-local-date bug in "today" calculation (daily-log + subject.facade startWorkout)
- [x] Daily log save failures now surface a visible error instead of failing silently
- [x] Subject cards render uniform size regardless of description length

## Phase 8 — Goals — ON HOLD (branch: feature/8-goals)

### Commit 1 — data layer
- [ ] health-goals.data.ts — getHealthGoals, upsertHealthGoals + Zod schema
- [ ] en.json GOALS section (keys only)

### Commit 2 — route + shell
- [ ] GoalsComponent stub + GoalsFacade stub
- [ ] Lazy route under shell children

### Commit 3 — goals form
- [ ] GoalsFacade: goalsResource, translation, upsertGoals mutation
- [ ] GoalsComponent: Signal Form (sleep target h, water target L, weight target kg, waist target cm)
- [ ] Save with loading / success / error feedback

## Phase 9 — KPI Dashboard ✓ (complete without goals — branch: feature/27-kpi-dashboard)
- [x] entries.service.getEntriesSince (embedded items/item_sets folded into setCount + volumeKg) + daily-log.service.getDailyLogsSince — no migrations
- [x] shared/utils/date.ts — local-calendar helpers, retires the hand-rolled formatting in daily-log.component + subject.facade
- [x] features/kpi/utils/kpi-metrics.util.ts + spec — workout totals, days since last, subject frequency, volume buckets, daily-log averages and deltas
- [x] KpiRange / KpiTileKey enums; one 90-day fetch narrowed client-side by a 7/30/90 segmented control
- [x] KpiFacade rewritten: training / volume / health tiles, volume buckets, per-routine breakdown, weight-unit aware
- [x] VolumeChartComponent (CSS bars + visually-hidden table) and SubjectFrequencyListComponent
- [x] Recent-workouts list moved off the tab to Progress; RecentWorkoutCardComponent relocated with it
- [x] _segmented-control.scss extracted and shared with Settings
- [ ] Goals-vs-target tiles still deferred — needs Phase 8 + 014_health_goals.sql. Every tile is Neutral today except "Since last"; nothing claims progress against a target that does not exist.
- See PR #44

## Phase 10 — Settings ✓ (complete — branch: feature/10-settings)

### Commit 1 — data layer
- [x] user-settings.service.ts: updateWorkoutSettings (weight_unit, distance_unit), new WeightUnit enum
- [x] en.json SETTINGS section + MENU.SETTINGS
- [x] No SettingsRoute enum needed — Settings is a flat page like Profile, no sub-routes

### Commit 2 — route + shell
- [x] AppRoute.Settings, lazy route under shell children
- [x] SettingsComponent + SettingsFacade
- [x] Menu — Settings navigation link

### Commit 3 — settings form
- [x] SettingsFacade: settingsResource, translation, setWeightUnit()/setDistanceUnit() with optimistic update + rollback on failure
- [x] SettingsComponent: weight unit toggle (kg/lb), distance unit toggle (km/mi) — button-group pattern, no unit_system field (no DB column for it)
- [x] Save on click (no submit button — auto-save pattern), saving/saveSuccess/saveError feedback

## Phase 11a — Security: New Device Detection ✓ (complete — merged via PR #25)
- [x] 016_user_sessions.sql — user_sessions table (fingerprint hash, user-agent, last IP, timestamps) + RLS
- [x] record-device-session Edge Function — fingerprints on user_id + user-agent, upserts session, sends Brevo email on new device (switched from Resend — no owned domain to verify)
- [x] DeviceSessionService + AuthService wiring — invoke on SIGNED_IN event only
- [x] In-app dismissible banner in HomeComponent (via HomeFacade) on new-device detection
- [x] Deployed and manually + server-side tested live
- See `plans/phase-11-security-device-detection.md`

## Phase 11b — Security: Account-Change Email Notifications — code complete, pending manual deploy (branch: feature/26-security-account-change-alerts)
- [x] Scope narrowed to password-changed alert only — app has no email-change feature to hook
- [x] supabase/functions/_shared/email-templates.ts — buildSecurityAlertEmailHtml(), record-device-session refactored to use it
- [x] notify-password-changed Edge Function — stateless, verifies caller via Authorization header, sends Brevo alert
- [x] AccountNotificationsService + AuthService.updateUserPassword() wiring — fire-and-forget, never blocks the password-change flow
- [x] Review fixes: sendBrevoEmail returns success flag (notify-password-changed 502s on send failure, record-device-session reports alertEmailSent), HTML-escaping of userAgent/ipAddress in email templates, shared _shared/auth.ts authenticateRequest + _shared/http.ts HttpMethod/JSON_HEADERS, otp.ts consolidated onto buildEmailLayout, shared resolveEdgeFunctionErrorMessage util, Zod validation in AccountNotificationsService
- [ ] Requires (manual, outside repo): deploy notify-password-changed + redeploy ALL four existing functions (record-device-session, login-with-device-check, verify-device-otp, resend-device-otp — all import refactored _shared/ modules), no new secrets
- See `plans/phase-11b-security-account-change-alerts.md`

## Phase RX — Responsive & Comfort Overhaul (approved 2026-08-08, shipped 2026-08-10 — plan pruned; see PRs #32–#42)
- [x] RX-0 — Viewport & shell correctness (branch: refactor/rx-0-viewport-shell) — viewport meta, document scroll, sticky nav, safe areas, reduced motion, hover guards
- [x] RX-1 — ui-kit v0.2.0 responsive foundation (ui-kit repo) — fluid type, touch tokens, mixins, bottom-sheet dialog, UiPage/UiSkeleton/UiStatTile; recipebox checked but non-blocking
- [x] RX-2 — Adopt `<ui-page>` across all 8 screens (branch: refactor/rx-2-page-primitives)
- [x] RX-3 — Entry/session: same-row set inputs kept, exercise accordion (active sticky top, others collapsed, rated sink to bottom), rating-colored border kept collapsed + expanded with the rating button visibly pressed, active-exercise state persisted to localStorage via new SessionUiStateService, Finish thumb bar on phone / header flex-end on web (branch: refactor/rx-3-entry-session)
- [x] RX-4 — Progress & Subject: subject card container queries, session list becomes a card grid at md+, Start workout to the thumb bar with delete moved into an overflow menu, shared EmptyStateComponent adopted across Progress/Subject/Entry/Daily Log/KPI (branch: refactor/rx-4-progress-subject)
- [x] RX-5 — Daily Log stat tiles (2-up phone / 4-across md+, unlogged metrics keep their column) + Log today moved to the thumb bar; KPI tab built out as a recent-completed-workouts list; shared page-primary-action mixin retires three copies of the thumb-bar button (branch: refactor/rx-5-daily-log-kpi)
- [x] RX-6 — Dialogs → bottom sheets below sm: verified the ui-kit sheet rules against the real compiled stylesheet (bottom anchoring beats CDK's inline align-items, 85dvh cap tracks the shrinking viewport), Log Entry tiles single-column under xs, removed the 280px floor that fought the full-width sheet, tokenized dialog type (branch: refactor/rx-6-dialogs)
- [x] RX-7 — Auth, Menu, Profile, Settings: shared auth-page mixin across all 5 signed-out screens (svh, collapsing padding on short viewports, 420px card, fluid padding), Menu becomes 56px destination rows with chevrons, Settings unit pickers become a real segmented control with aria-pressed, Profile Save moves to the thumb bar and gains a real isSaving signal (branch: refactor/rx-7-auth-account)
- [x] RX-8 — Polish & performance: skeletons replace all 7 loading paragraphs; initial bundle 873 kB -> 616 kB by narrowing the zod barrel import (its entry point re-exported 53 locale files, 195 kB, that the app never shows), budget re-set to 640 kB deliberately; focus-visible audit clean. (branch: refactor/rx-8-polish)
- [x] RX-9 — Icon consolidation (A14): ui-kit 0.3.0 adds iconSrc to UiButton/UiInput, 13 hand-authored SVGs join the existing set, all 14 mat-icon usages and 5 ligature bindings migrated to app-ui-icon, MatIconModule gone from the app, Material Icons webfont link dropped from index.html (branch: refactor/rx-9-icon-consolidation)

## Phase 12 — Profile Screen Rebuild (planned 2026-08-10 — see `plans/feature-profile-screen.md`)

### ui-kit 0.4.0 (repo: ../ui-kit, branch feature/number-form-field) — do first
- [ ] `UiInputComponent.field` widened to `Field<string> | Field<number | null> | null`
- [ ] New `block` input — number inputs render as full-width form fields (label + error region + `[formField]`) instead of set-row cells
- [ ] Verify all 10 existing number usages unchanged (set-row ×5, log-entry-dialog ×4 tile, complete-session-dialog ×1) + recipebox builds
- [ ] Release 0.4.0 + CHANGELOG + README input table

### progress (branch: feature/43-profile-screen — renumber to the real PR)
- [ ] Bump @edenoren/ui-kit to 0.4.0
- [ ] CurrentProfileService — app-level profile resource shared by Profile + sidebar; resource stays idle until `userId()` is non-empty (fixes the `getProfile('')` error flash on load)
- [ ] Shared UserAvatarComponent + UserAvatarSize enum; rail migrates onto it
- [ ] Profile: identity header (avatar, display name, email, member since)
- [ ] Profile: "About you" — displayName/dateOfBirth/heightCm all inside `profileForm`, `_heightCm` side-channel deleted, min/max/length validators, Save gated on `dirty()`, success auto-clears after 2s
- [ ] Profile: "Account" — email (read-only), sign-in method via new AuthProvider enum, change-password row calling `resetPasswordForEmail()` (can't link to /auth/forgot-password — guestGuard)
- [ ] shared/utils/date.ts `calculateAge()` + spec — splits the YYYY-MM-DD string, never `new Date(string)` (DR-10 timezone bug)
- [ ] Sidebar chip shows the display name only (no email) with its first letter as the avatar
- [ ] en.json PROFILE keys; delete dead PROFILE.LOADING / SETTINGS.LOADING (RX-8 replaced them with skeletons)
- [ ] Optional (first to cut): same identity header on the Menu page

### Follow-ups (separate branches)
- [ ] complete-session-dialog Duration adopts `[block]="true"` — same input bug, different screen
- [ ] Avatar upload — needs a Supabase storage bucket + RLS policies (own plan)
- [ ] Delete account — needs a service-role Edge Function (own plan)
- [ ] Migration to drop unused `profiles.weight_kg` (weight lives in daily_log_entries)

## Phase 11c — Security: Block New-Device Login Behind Email OTP ✓ (complete — merged via PR #25)
- [x] 017_login_otp_challenges.sql — short-lived OTP challenge table, zero RLS policies (service-role only)
- [x] supabase/functions/_shared/{crypto,device,brevo,otp}.ts — shared fingerprint/hash/email helpers, record-device-session refactored to use them
- [x] login-with-device-check / verify-device-otp / resend-device-otp Edge Functions — withhold session tokens from an unrecognised device until OTP passes
- [x] LoginChallengeService + AuthService rework — signInWithEmail() now returns LoginStatus.Success | OtpRequired, added verifyDeviceOtp()/resendDeviceOtp()
- [x] VerifyDeviceComponent + facade + deviceVerificationPendingGuard — new /auth/verify-device screen, LoginFacade branches on LoginStatus
- [x] UiButtonComponent — added disabled InputSignal (needed for resend-cooldown button)
- [x] Scope: password sign-in only — Google OAuth, signup, and password-reset session establishment stay on the Phase 11a passive alert-only path (see plan for why)
- [x] Deployed and server-side tested live
- See `plans/phase-11c-security-new-device-otp.md`

## Phase 12 — Daily Log Column Visibility (planned — branch: feature/27-daily-log-hidden-columns)
- [ ] Move `LogMetricKey` to `shared/enums/` (now cross-feature)
- [ ] `UserSettingsService`: `daily_log.hidden_metrics` schema, `getModuleSettings()`, `updateDailyLogSettings()` — no migration, existing JSONB column
- [ ] Settings screen: chip row toggling the four Daily Log columns, last visible one locked on
- [ ] Daily Log: `hiddenMetrics` through the facade into `log-card`, grid column count bound as a CSS custom property
- [ ] en.json `SETTINGS` column strings
- [ ] Log Entry dialog deliberately unchanged — hiding is display-only, logged values are kept
- See `plans/feature-daily-log-hidden-columns.md`
