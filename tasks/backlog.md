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
- [ ] 012_expand_daily_log.sql — add water_intake_liters, waist_cm to daily_log_entries
- [ ] 013_expand_profiles.sql — add date_of_birth DATE to profiles
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

## Phase 2b — Auth Extensions
- [ ] Forgot password flow: ForgotPasswordComponent (/auth/forgot-password) — calls supabase.auth.resetPasswordForEmail()
- [ ] Reset password page: ResetPasswordComponent (/auth/reset-password) — receives token from email link, calls supabase.auth.updateUser({ password })
- [ ] AuthRoute enum entries: ForgotPassword, ResetPassword
- [ ] en.json AUTH.FORGOT_PASSWORD + AUTH.RESET_PASSWORD sections
- [ ] Wire lazy routes into auth.routes.ts

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
- [x] 013_expand_profiles.sql — ADD COLUMN date_of_birth DATE
- [x] core/services/data/profile/profile.service.ts + profile.model.ts (ProfileRaw, Profile, UpdateProfileInput, mapProfile)
- [x] en.json MENU + PROFILE sections
- [x] AppRoute.Profile, lazy route under shell children
- [x] MenuComponent — Profile navigation link
- [x] ProfileFacade — _profileResource, translation, saveProfile(), saveSuccess/saveError signals
- [x] ProfileComponent — Signal Form (displayName required, dateOfBirth), WritableSignal for heightCm, one-shot effect pre-fill, save feedback
- [x] InputType.Date added to shared enum

## Phase 8 — Goals (branch: feature/8-goals)

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

## Phase 9 — KPI Dashboard (branch: feature/9-kpi)

### Commit 1 — calculations utility
- [ ] kpi.utils.ts — pure functions: avgSleep, avgWeight, avgWater, avgWaist (last 7 days vs targets)
- [ ] Unit tests for each calculation function

### Commit 2 — data + facade
- [ ] KpiFacade: weekLogResource, healthGoalsResource, translation signal
- [ ] Computed KPI values (delta vs goal, trend direction)

### Commit 3 — KPI cards UI
- [ ] KpiCardComponent (dumb): inputs label, value, unit, delta, trend
- [ ] KpiComponent: 2×2 grid layout using KpiCardComponent
- [ ] en.json KPI section
- [ ] SCSS for card grid

## Phase 10 — Settings (branch: feature/10-settings)

### Commit 1 — data layer
- [ ] user-settings.data.ts: updateWorkoutSettings (weight_unit, distance_unit) — already partially exists; extend if needed
- [ ] SettingsRoute enum in core/enums/
- [ ] en.json SETTINGS section (keys only)

### Commit 2 — route + shell
- [ ] SettingsComponent stub + SettingsFacade stub
- [ ] Lazy route under shell children

### Commit 3 — settings form
- [ ] SettingsFacade: settingsResource, translation, saveSettings mutation
- [ ] SettingsComponent: weight unit selector (kg/lb), distance unit selector (km/mi), unit system (metric/imperial)
- [ ] Save on change (no submit button — auto-save pattern)

## Phase 11 — Security (future)
- [ ] New device detection: user_sessions table (device fingerprint, IP, user-agent, timestamp) + Supabase Edge Function on auth sign_in hook
- [ ] In-app + email alert when sign-in from unrecognised device
- [ ] Email notification on account changes (password reset, email change)
- [ ] Requires: Edge Function setup, email provider (Resend / SendGrid), 016_user_sessions.sql migration
