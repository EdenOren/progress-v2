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

## Phase 2 — Auth feature (branch: feature/2-auth)
- [ ] LoginComponent + LoginFacade
- [ ] SignupComponent + SignupFacade
- [ ] AuthCallbackComponent (/auth/callback)
- [ ] Wire app.routes.ts with lazy-loaded auth routes

## Phase 3 — Navigation Shell
- [ ] 3-tab shell (Progress | KPI | Menu)
- [ ] Lazy-loaded tab routes

## Phase 4 — Progress Tab (workout)
- [ ] Subject list
- [ ] Create subject modal
- [ ] Subject detail page
- [ ] Entry detail page

## Phase 5 — Active Workout Session
- [ ] Live session: timer, exercise list, set inputs, feedback
- [ ] Completion summary screen

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
