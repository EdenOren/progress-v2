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

## Phase 6 — Daily Log
- [ ] 7-day log entries list
- [ ] Log modal (Signal Forms)

## Phase 7 — Profile
- [ ] Editable form (display name, DOB, height)

## Phase 8 — Goals
- [ ] Health goals form (sleep, water, weight, waist targets)

## Phase 9 — KPI Dashboard
- [ ] 2x2 grid of KPI cards
- [ ] KPI calculations utility

## Phase 10 — Settings
- [ ] Single flat page (weight unit, distance unit, unit system)

## Phase 11 — Security (future)
- [ ] New device detection: user_sessions table (device fingerprint, IP, user-agent, timestamp) + Supabase Edge Function on auth sign_in hook
- [ ] In-app + email alert when sign-in from unrecognised device
- [ ] Email notification on account changes (password reset, email change)
- [ ] Requires: Edge Function setup, email provider (Resend / SendGrid), 016_user_sessions.sql migration
