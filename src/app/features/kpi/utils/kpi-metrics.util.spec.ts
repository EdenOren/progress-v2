import {
  averageDurationSeconds,
  averageMetric,
  countWorkouts,
  daysSinceLastWorkout,
  filterEntriesWithinDays,
  filterLogsWithinDays,
  metricDelta,
  subjectFrequency,
  totalDurationSeconds,
  totalSets,
  totalVolumeKg,
  volumeSeries,
} from './kpi-metrics.util';
import type { DailyLog } from '../../../core/services/data/daily-log/daily-log.model';
import type { RangeEntry } from '../../../core/services/data/entries.service';

const TODAY: string = '2026-08-10';

function makeEntry(overrides: Partial<RangeEntry>): RangeEntry {
  return {
    id: 'entry-id',
    performedAt: TODAY,
    durationSeconds: 3600,
    subjectId: 'subject-id',
    subjectName: 'Leg Day',
    setCount: 4,
    volumeKg: 1000,
    ...overrides,
  };
}

function makeLog(overrides: Partial<DailyLog>): DailyLog {
  return {
    id: 'log-id',
    userId: 'user-id',
    loggedDate: TODAY,
    sleepHours: null,
    weightKg: null,
    waterLiters: null,
    waistCm: null,
    ...overrides,
  };
}

describe('filterEntriesWithinDays', () => {
  it('keeps today and drops the day that falls outside the window', () => {
    const entries: RangeEntry[] = [
      makeEntry({ id: 'today', performedAt: '2026-08-10' }),
      makeEntry({ id: 'sixth-day', performedAt: '2026-08-04' }),
      makeEntry({ id: 'seventh-day', performedAt: '2026-08-03' }),
    ];
    const kept: string[] = filterEntriesWithinDays(entries, 7, TODAY).map((entry) => entry.id);
    expect(kept).toEqual(['today', 'sixth-day']);
  });

  it('reads only the calendar day of a full timestamp', () => {
    const entries: RangeEntry[] = [makeEntry({ performedAt: '2026-08-04T23:30:00.000Z' })];
    expect(filterEntriesWithinDays(entries, 7, TODAY)).toHaveLength(1);
  });

  it('keeps a future-dated session rather than hiding it', () => {
    const entries: RangeEntry[] = [makeEntry({ performedAt: '2026-08-11' })];
    expect(filterEntriesWithinDays(entries, 7, TODAY)).toHaveLength(1);
  });

  it('returns nothing for no entries', () => {
    expect(filterEntriesWithinDays([], 7, TODAY)).toEqual([]);
  });
});

describe('filterLogsWithinDays', () => {
  it('windows daily logs on the same inclusive boundary', () => {
    const logs: DailyLog[] = [
      makeLog({ id: 'inside', loggedDate: '2026-08-04' }),
      makeLog({ id: 'outside', loggedDate: '2026-08-03' }),
    ];
    const kept: string[] = filterLogsWithinDays(logs, 7, TODAY).map((log) => log.id);
    expect(kept).toEqual(['inside']);
  });
});

describe('workout totals', () => {
  it('counts sessions', () => {
    expect(countWorkouts([makeEntry({}), makeEntry({})])).toBe(2);
  });

  it('sums duration, treating an untimed session as zero', () => {
    const entries: RangeEntry[] = [
      makeEntry({ durationSeconds: 1800 }),
      makeEntry({ durationSeconds: null }),
    ];
    expect(totalDurationSeconds(entries)).toBe(1800);
  });

  it('averages only the sessions that recorded a duration', () => {
    const entries: RangeEntry[] = [
      makeEntry({ durationSeconds: 1800 }),
      makeEntry({ durationSeconds: 3600 }),
      makeEntry({ durationSeconds: null }),
    ];
    expect(averageDurationSeconds(entries)).toBe(2700);
  });

  it('averages to zero when nothing was timed', () => {
    expect(averageDurationSeconds([makeEntry({ durationSeconds: null })])).toBe(0);
  });

  it('averages to zero for no sessions at all', () => {
    expect(averageDurationSeconds([])).toBe(0);
  });

  it('sums volume and sets', () => {
    const entries: RangeEntry[] = [
      makeEntry({ volumeKg: 1200, setCount: 5 }),
      makeEntry({ volumeKg: 800, setCount: 3 }),
    ];
    expect(totalVolumeKg(entries)).toBe(2000);
    expect(totalSets(entries)).toBe(8);
  });

  it('sums an empty range to zero', () => {
    expect(totalVolumeKg([])).toBe(0);
    expect(totalDurationSeconds([])).toBe(0);
  });
});

describe('daysSinceLastWorkout', () => {
  it('returns nothing when nothing was trained', () => {
    expect(daysSinceLastWorkout([], TODAY)).toBeNull();
  });

  it('returns zero when trained today', () => {
    expect(daysSinceLastWorkout([makeEntry({ performedAt: TODAY })], TODAY)).toBe(0);
  });

  it('measures from the most recent session, whatever the array order', () => {
    const entries: RangeEntry[] = [
      makeEntry({ performedAt: '2026-08-01' }),
      makeEntry({ performedAt: '2026-08-07' }),
      makeEntry({ performedAt: '2026-08-04' }),
    ];
    expect(daysSinceLastWorkout(entries, TODAY)).toBe(3);
  });

  it('never reports a negative gap for a future-dated session', () => {
    expect(daysSinceLastWorkout([makeEntry({ performedAt: '2026-08-12' })], TODAY)).toBe(0);
  });
});

describe('subjectFrequency', () => {
  it('groups sessions per routine, most trained first', () => {
    const entries: RangeEntry[] = [
      makeEntry({ subjectId: 'legs', subjectName: 'Leg Day' }),
      makeEntry({ subjectId: 'push', subjectName: 'Push' }),
      makeEntry({ subjectId: 'legs', subjectName: 'Leg Day' }),
    ];
    expect(subjectFrequency(entries)).toEqual([
      { subjectId: 'legs', subjectName: 'Leg Day', sessionCount: 2 },
      { subjectId: 'push', subjectName: 'Push', sessionCount: 1 },
    ]);
  });

  it('breaks a tie by name so the order stays stable between loads', () => {
    const entries: RangeEntry[] = [
      makeEntry({ subjectId: 'pull', subjectName: 'Pull' }),
      makeEntry({ subjectId: 'arms', subjectName: 'Arms' }),
    ];
    const names: string[] = subjectFrequency(entries).map((subject) => subject.subjectName);
    expect(names).toEqual(['Arms', 'Pull']);
  });

  it('returns nothing for no entries', () => {
    expect(subjectFrequency([])).toEqual([]);
  });
});

describe('volumeSeries', () => {
  it('buckets a week into one bar per day, oldest first', () => {
    const entries: RangeEntry[] = [
      makeEntry({ performedAt: '2026-08-10', volumeKg: 500 }),
      makeEntry({ performedAt: '2026-08-08', volumeKg: 300 }),
    ];
    expect(volumeSeries(entries, 7, 1, TODAY)).toEqual([
      { startIsoDate: '2026-08-04', volumeKg: 0 },
      { startIsoDate: '2026-08-05', volumeKg: 0 },
      { startIsoDate: '2026-08-06', volumeKg: 0 },
      { startIsoDate: '2026-08-07', volumeKg: 0 },
      { startIsoDate: '2026-08-08', volumeKg: 300 },
      { startIsoDate: '2026-08-09', volumeKg: 0 },
      { startIsoDate: '2026-08-10', volumeKg: 500 },
    ]);
  });

  it('adds sessions sharing a bucket together', () => {
    const entries: RangeEntry[] = [
      makeEntry({ performedAt: '2026-08-10', volumeKg: 500 }),
      makeEntry({ performedAt: '2026-08-06', volumeKg: 250 }),
    ];
    const [, latest] = volumeSeries(entries, 14, 7, TODAY);
    expect(latest).toEqual({ startIsoDate: '2026-08-04', volumeKg: 750 });
  });

  it('zero-fills a range with no training at all', () => {
    const buckets = volumeSeries([], 30, 7, TODAY);
    expect(buckets).toHaveLength(5);
    expect(buckets.every((bucket) => bucket.volumeKg === 0)).toBe(true);
  });

  it('ignores a session older than the oldest bucket', () => {
    const entries: RangeEntry[] = [makeEntry({ performedAt: '2026-01-01', volumeKg: 900 })];
    const buckets = volumeSeries(entries, 7, 1, TODAY);
    expect(buckets.every((bucket) => bucket.volumeKg === 0)).toBe(true);
  });
});

describe('averageMetric', () => {
  it('averages the days that carry a reading', () => {
    const logs: DailyLog[] = [
      makeLog({ sleepHours: 8 }),
      makeLog({ sleepHours: 6 }),
      makeLog({ sleepHours: null }),
    ];
    expect(averageMetric(logs, (log) => log.sleepHours)).toBe(7);
  });

  it('returns nothing when the metric was never logged', () => {
    expect(averageMetric([makeLog({})], (log) => log.weightKg)).toBeNull();
  });

  it('returns nothing for no logs', () => {
    expect(averageMetric([], (log) => log.sleepHours)).toBeNull();
  });
});

describe('metricDelta', () => {
  it('compares the oldest reading with the newest', () => {
    const logs: DailyLog[] = [
      makeLog({ loggedDate: '2026-08-01', weightKg: 80 }),
      makeLog({ loggedDate: '2026-08-09', weightKg: 78.5 }),
    ];
    expect(metricDelta(logs, (log) => log.weightKg)).toBeCloseTo(-1.5);
  });

  it('orders by date rather than trusting the array', () => {
    const logs: DailyLog[] = [
      makeLog({ loggedDate: '2026-08-09', weightKg: 78 }),
      makeLog({ loggedDate: '2026-08-01', weightKg: 80 }),
    ];
    expect(metricDelta(logs, (log) => log.weightKg)).toBe(-2);
  });

  it('needs two readings to describe a direction', () => {
    expect(metricDelta([makeLog({ weightKg: 80 })], (log) => log.weightKg)).toBeNull();
  });

  it('skips days where the metric is missing', () => {
    const logs: DailyLog[] = [
      makeLog({ loggedDate: '2026-08-01', waistCm: 90 }),
      makeLog({ loggedDate: '2026-08-05', waistCm: null }),
      makeLog({ loggedDate: '2026-08-09', waistCm: 88 }),
    ];
    expect(metricDelta(logs, (log) => log.waistCm)).toBe(-2);
  });
});
