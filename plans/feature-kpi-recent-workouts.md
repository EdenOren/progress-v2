# Feature — KPI Tab: Recent Workouts

**Branch:** `feature/kpi-recent-workouts`
**Target:** `development`

---

## Goal

There is currently no "recent workouts" view anywhere in the app. The KPI tab (the natural home for it) is a hardcoded "coming soon" placeholder (`kpi.component.html`) with zero data wiring — no facade, no service injection beyond `TranslateService`. Home and Progress don't surface recent activity either. The closest existing thing is the entries list inside a Subject's own detail page (`SubjectFacade` → `EntriesService.getEntries(userId, subjectId)`), which is scoped to one subject and buried two taps deep (Progress → tap a subject).

Build the KPI tab into an actual "recent workouts" list: completed training sessions across **all** subjects, most-recent-first, each showing which subject it was and tappable through to that entry's detail page. This mirrors how `DailyLogFacade`/`DailyLogsService.getRecentDailyLogs` already does "recent N across the account" for daily logs — same shape, applied to `entries`.

## Scope decision

**Completed entries only** (`is_completed = true`). An entry that was started but never finished isn't a "workout" yet — showing it in a recent-activity list would be misleading (no duration, possibly abandoned). This matches how `EntriesService.getLastCompletedEntry` already treats "completed" as the meaningful state elsewhere in the app. If you'd rather include in-progress entries, flag it before I build — that's a one-line filter change (`getEntries`'s own pattern has no such filter, so precedent exists both ways).

## Changes

| File | Change |
|---|---|
| `entries.service.ts` | New `getRecentEntries(userId: string, limit: number): Promise<Result<RecentEntry[]>>` — queries `entries` with an embedded `subjects(name)` select (Supabase foreign-table select, same FK Subject already uses), `.eq('user_id', userId)`, `.eq('is_completed', true)`, `.order('performed_at', { ascending: false })`, `.limit(limit)`. New `RecentEntry extends Entry { subjectName: string }`, new `recentEntrySchema`/`recentEntryArraySchema` (zod), `mapRecentEntry`. Same shape/pattern as `getEntries`/`mapEntry` already in this file. |
| `features/kpi/kpi.facade.ts` (new) | Mirrors `DailyLogFacade`: injects `AuthService`, `EntriesService`, `TranslateService`; `RECENT_ENTRIES_LIMIT` static (10, matching `DailyLogFacade.RECENT_ENTRIES_LIMIT`'s 7 — picking 10 since this list is the tab's whole purpose rather than a widget); a `resource()` calling `getRecentEntries`; exposes `entries: Signal<RecentEntry[]>`, `isLoading`, `hasError`, `isEmpty`, `translation` (scoped to `'KPI'`). |
| `kpi.component.ts` | Add `providers: [KpiFacade]`, inject the facade instead of `TranslateService` directly, drop the now-redundant local `translation` signal (delegate to `facade.translation()`, matching `DailyLogComponent`'s pattern exactly). |
| `kpi.component.html` | Replace the unconditional empty state with loading/error/empty/list branches (same `@if/@else if/@else` structure as `daily-log.component.html`). Empty state keeps the existing `COMING_SOON` copy/icon — it's still correct copy for "no completed workouts yet," just now reachable only when the query genuinely returns zero rows instead of always. List renders `<app-recent-workout-card>` per entry inside a `<ul>` (same list/list-item BEM shape as `daily-log.component.html`). |
| `features/kpi/components/recent-workout-card/` (new component) | Shows subject name (bold), formatted date (`DatePipe`, same `'EEE, MMM d'` format as `log-card`), and duration converted from `durationSeconds` to whole minutes (`Math.round(durationSeconds / 60)` + a `MINUTES_UNIT`/`min` suffix — mirrors how `complete-session-dialog` already works in minutes over the stored `duration_seconds`). Whole row is a `(click)` target (`role="button"`, keyboard-activatable) that calls a `workoutClicked` output with the entry; `KpiComponent` handles it via `Router.navigate` to `progress/subject/:subjectId/entry/:entryId` (exact path built from `AppRoute.Progress`/`ProgressRoute.Subject`/`ProgressRoute.Entry`, same segments `app.routes.ts` already defines). |
| `assets/i18n/en.json` | Add to the `KPI` block: `LOADING`, `ERROR`, `MINUTES_UNIT` (`"min"`). Keep `TITLE`/`COMING_SOON` as-is. |

## Explicitly Out of Scope

- No charts/streaks/aggregate stats — just the recent-activity list itself. "KPI" as a bigger dashboard concept is a separate, larger conversation.
- No pagination/"load more" — fixed limit of 10, same as Daily Log's recent list.
- Not touching Home or Progress — the list lives only on the KPI tab per the existing route structure.

## Acceptance Criteria

- KPI tab shows the 10 most recent **completed** entries across all subjects, newest first, each labeled with its subject name.
- Tapping a card navigates to that entry's detail page.
- Zero completed entries → the existing "coming soon" empty state (unchanged copy).
- Loading/error states match the Daily Log tab's visual pattern (consistency across the two list-based tabs).

## Verification

1. `ng build` — succeeds.
2. `ng test --watch=false` — no new failures.
3. Manual (deferred to you per this session's earlier note on the authenticated backend): KPI tab shows real recent completed workouts; tapping one lands on the right entry.
