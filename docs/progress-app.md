# Progress App — Project-Specific Rules

> Read when working on Progress-app feature logic. See `docs/standards/supabase.md` when working on data services or migrations.

## Domain Naming
| Term | Definition |
|------|------------|
| Subject | Workout routine ("Monday Practice", "Leg Day") |
| Entry | A performed session on a date |
| Item | Exercise within an entry ("Deadlift") |
| Set | Weight/reps record per item |
| Feedback | Rating per item: `success`, `hard`, `fail` |
| Goal | Target for next session per item |
| Template | Preconfigured exercises for a subject |
| DailyLog | Daily health metrics (sleep, weight, water, waist) |
| HealthGoal | Target health metrics (sleep target, water target, etc.) |

## i18n — ngx-translate v18
- Providers: `provideTranslateService({ defaultLanguage: 'en' })` + spread `...provideTranslateHttpLoader()`.
- No `TranslateModule`.
- In facades: `inject(TranslateService)` + `toSignal(translateService.stream('SECTION'))`.

## Delete (Subjects)
Hard delete via `supabase.from('subjects').delete()`. DB `ON DELETE CASCADE` removes all entries → items → item_sets → item_feedback. UI confirms with affected data count.

## Google OAuth
`supabase.auth.signInWithOAuth({ provider: 'google' })`, callback at `/auth/callback`.
Callback component exchanges the code for a session and redirects to `/progress`.
