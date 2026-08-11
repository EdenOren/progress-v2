# Feature — KPI Tab: Real Dashboard

**Branch:** `feature/27-kpi-dashboard`
**Target:** `development`

---

## Goal

The KPI tab was a top-level nav destination named "KPI" containing no KPIs: a flat list of the 10 most recent completed entries, built in RX-5 with charts and aggregates explicitly deferred. Two problems followed.

1. **No metrics.** Nothing aggregated anything — no time framing, no trends, no comparison. Phase 9 (KPI Dashboard) had been ON HOLD behind Phase 8 Goals and `014_health_goals.sql`, which was never applied.
2. **Duplication.** A cross-subject session list is session history, which Progress → Subject already covers.

KPI becomes a real dashboard — training, volume, health trends over a selectable window — and the recent-workouts list moves to Progress. **No DB migrations:** everything is derived from `entries`, `items`/`item_sets`, and `daily_log_entries` as they exist today. With no `health_goals` table, tiles report trends and direction rather than progress against a target.

## Design

One page load fetches a **90-day window once**; the 7d/30d/90d selector narrows it in `computed()`. Changing range costs no network request and cannot flicker a loading state.

```
<app-ui-page title="KPI">
  7d | 30d | 90d   segmented control
  TRAINING     Workouts · Total time · Avg session · Since last
  VOLUME       Total volume · Sets  + weekly bar chart
  HEALTH       Avg sleep · Avg water · Weight change · Waist change
  BY ROUTINE   one bar per subject, session count
```

## Changes

### Data layer (no migrations)

| File | Change |
|---|---|
| `core/services/data/entries.service.ts` | `getEntriesSince(userId, sinceIsoDate)` — selects `id, performed_at, duration_seconds, subject_id, subjects(name), items(item_sets(weight_kg, reps))` for completed entries. New `RangeEntry` with `setCount`/`volumeKg` folded in `mapRangeEntry`, so no nested join shape escapes the service. Sets without weight *and* reps (timer/distance tracking) count toward `setCount` but add no volume. |
| `core/services/data/daily-log/daily-log.service.ts` | `getDailyLogsSince(userId, sinceDate)` — range variant of `getRecentDailyLogs`, ordered oldest-first so trend readers need no re-sort. |

### Calculation layer

- `shared/utils/date.ts` (new) — `toLocalDateString`, `toLocalDateStringDaysAgo`, `parseLocalDate`, `differenceInDays`. Local calendar dates throughout: `toISOString()` would report yesterday for anyone west of Greenwich after local midnight, the DR-10 bug. Retires the hand-rolled date formatting duplicated in `daily-log.component.ts` and `subject.facade.ts`.
- `features/kpi/utils/kpi-metrics.util.ts` (new) — pure, DI-free: `filterEntriesWithinDays`, `filterLogsWithinDays`, `countWorkouts`, `totalDurationSeconds`, `averageDurationSeconds`, `totalVolumeKg`, `totalSets`, `daysSinceLastWorkout`, `subjectFrequency`, `volumeSeries`, `averageMetric`, `metricDelta`. Covered by `kpi-metrics.util.spec.ts` (30 cases: empty ranges, all-null metrics, single readings, timezone-bearing timestamps, future-dated sessions).

**"Days since last" over a streak.** At three or four sessions a week a day-streak reads 1 permanently and says nothing. The gap since the last session is the number that changes.

### Feature layer

- `features/kpi/enums/kpi-range.enum.ts` — `KpiRange` + `KPI_RANGE_DAYS` + `KPI_RANGE_BUCKET_DAYS` (a week draws daily bars, a month and a quarter draw weekly bars) + `WIDEST_KPI_RANGE`, which sizes the single fetch.
- `features/kpi/enums/kpi-tile-key.enum.ts` — tile identity for `track` and label lookup, the role `LogMetricKey` plays on Daily Log.
- `kpi.facade.ts` — three resources (entries, daily logs, workout settings), range signal with `isRangeWeek/Month/Quarter` booleans so no template compares strings, and `trainingTiles`/`volumeTiles`/`healthTiles`/`volumeBuckets`/`subjectBreakdown`. Weight-derived values convert through `kgToLb`/`cmToIn` exactly as `log-card.component.ts` does.
- `components/volume-chart/` (new) — CSS bars scaled to the tallest bar in view, `aria-hidden`, with a visually-hidden table as the accessible representation and a two-anchor date axis (thirteen weekly ticks would collide).
- `components/subject-frequency-list/` (new) — proportional bar per routine.

**Emptiness is judged over the whole fetched window**, not the selected range: a quiet week shows zeroes beside a working range picker instead of swallowing the page in an empty state.

**The opening range follows the data.** A fixed 7-day default opened on a wall of zeroes for a real account whose last session was 56 days back — the exact impression this work set out to remove. `_selectedRange` is a `linkedSignal` over the loaded entries that picks the narrowest range holding a session, so it re-defaults only when the data changes, never under the user mid-visit.

**Status colour is only claimed where the app can justify it.** Without goals there is no target to beat, so every tile is `TileStatus.Neutral` except "Since last", which turns Good at a day or less and Warn at four or more. Weight and waist changes render a signed number with no colour judgment — the app does not know which direction the user wants.

### Recent workouts → Progress

`RecentWorkoutCardComponent` moves to `features/progress/components/`. `ProgressFacade` gains a 5-entry `getRecentEntries` resource and the `navigateToEntry` lifted from `KpiFacade`; `progress.component.html` renders a "Recent workouts" section below the subject grid.

### Shared styling

`src/styles/abstract/_segmented-control.scss` (new) — the segmented-control rules Settings had grown are now a mixin used by both Settings and the KPI range picker, following the `_page-primary.scss` / `_auth-card.scss` precedent. Settings renders identically.

## Out of Scope

- `health_goals` / progress-vs-target tiles — needs Phase 8 and migration `014_health_goals.sql`.
- Per-exercise PRs and 1RM estimates — a separate feature over `item_sets`.
- Any change to the four-tab nav structure.

## Acceptance Criteria

- KPI shows training, volume, health, and per-routine metrics over 7/30/90 days.
- Switching range recomputes every number with no network request.
- A range with no training shows zeroes, not an empty state; an account with no data at all shows the empty state.
- Recent workouts are reachable from Progress and still deep-link to the right entry.

## Verification

1. `pnpm build` — succeeds, initial bundle unchanged at 616 kB (budget 640 kB).
2. `pnpm test` — 55 tests across 5 files pass, including the 30 new util cases.
3. Manual against the live account (desktop, dev server): 13 workouts / 16h 6m / 1h 14m avg / 56d since last, 100,535 kg over 384 sets, weekly bars with a May 12 → Aug 4 axis, avg sleep 6.9 h, weight −2 kg, Leg Day 7 vs Upper Body day 6. Range switching redraws with no request; no console errors. Progress shows the five recent workouts under a rule.
4. Outstanding: phone-width layout was not verified in a real viewport — the window-resize emulation did not take effect. The SCSS follows the Daily Log tile pattern, but check it on a phone before merge.
