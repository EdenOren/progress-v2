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

## Phase 6 — Daily Log (branch: feature/6-daily-log)

### Commit 1 — data layer
- [ ] daily-log.data.ts — getDailyLog, upsertDailyLog functions + Zod schemas
- [ ] en.json DAILY_LOG section (keys only, placeholder values)

### Commit 2 — route + shell
- [ ] DailyLogRoute enum in core/enums/
- [ ] DailyLogComponent stub (empty shell, no logic)
- [ ] DailyLogFacade stub (@Service autoProvided: false)
- [ ] Lazy route wired into app.routes.ts under shell children

### Commit 3 — 7-day list
- [ ] DailyLogFacade: weekResource (last 7 days), translation signal, computed day list
- [ ] DailyLogComponent: render 7-day list (date, sleep h, weight kg, water L, waist cm)
- [ ] Loading / empty / error states

### Commit 4 — log modal
- [ ] LogEntryDialogComponent: Signal Forms (sleep, weight, water, waist)
- [ ] DailyLogFacade: openLogDialog(), upsertLog() mutation, reload after save
- [ ] Trigger dialog from DailyLogComponent (FAB or "Log today" button)
- [ ] en.json LOG_ENTRY_DIALOG section

## Phase 7 — Profile (branch: feature/7-profile)

### Commit 1 — data layer
- [ ] profiles.data.ts — getProfile, updateProfile + Zod schema (display_name, date_of_birth, height_cm)
- [ ] en.json PROFILE section (keys only)

### Commit 2 — route + shell
- [ ] ProfileComponent stub + ProfileFacade stub
- [ ] Lazy route under shell children (menu tab area)

### Commit 3 — profile form
- [ ] ProfileFacade: profileResource, translation, updateProfile mutation
- [ ] ProfileComponent: Signal Form (display name, DOB date picker, height input)
- [ ] Save button with loading / success / error feedback

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
