import {
  differenceInDays,
  parseLocalDate,
  toLocalDateStringDaysAgo,
} from '../../../shared/utils/date';
import type { DailyLog } from '../../../core/services/data/daily-log/daily-log.model';
import type { RangeEntry } from '../../../core/services/data/entries.service';

export interface SubjectFrequency {
  readonly subjectId: string;
  readonly subjectName: string;
  readonly sessionCount: number;
}

export interface VolumeBucket {
  readonly startIsoDate: string;
  readonly volumeKg: number;
}

export type DailyLogMetricSelector = (log: DailyLog) => number | null;

/**
 * The window is inclusive of today, so a 7-day range covers today plus the six
 * days before it. Anything dated ahead of today stays in rather than being
 * silently dropped — a clock or timezone skew should not hide a session.
 */
export function filterEntriesWithinDays(
  entries: RangeEntry[],
  rangeDays: number,
  todayIsoDate: string,
): RangeEntry[] {
  return entries.filter(
    (entry) => differenceInDays(todayIsoDate, entry.performedAt) < rangeDays,
  );
}

export function filterLogsWithinDays(
  logs: DailyLog[],
  rangeDays: number,
  todayIsoDate: string,
): DailyLog[] {
  return logs.filter((log) => differenceInDays(todayIsoDate, log.loggedDate) < rangeDays);
}

export function countWorkouts(entries: RangeEntry[]): number {
  return entries.length;
}

export function totalDurationSeconds(entries: RangeEntry[]): number {
  return entries.reduce((total, entry) => total + (entry.durationSeconds ?? 0), 0);
}

/**
 * Averaged over the sessions that actually recorded a duration — sessions
 * completed before durations were tracked would otherwise drag the mean down.
 */
export function averageDurationSeconds(entries: RangeEntry[]): number {
  const timed: RangeEntry[] = entries.filter((entry) => !!entry.durationSeconds);
  if (!timed.length) {
    return 0;
  }
  return Math.round(totalDurationSeconds(timed) / timed.length);
}

export function totalVolumeKg(entries: RangeEntry[]): number {
  return entries.reduce((total, entry) => total + entry.volumeKg, 0);
}

export function totalSets(entries: RangeEntry[]): number {
  return entries.reduce((total, entry) => total + entry.setCount, 0);
}

export function daysSinceLastWorkout(
  entries: RangeEntry[],
  todayIsoDate: string,
): number | null {
  if (!entries.length) {
    return null;
  }
  const gaps: number[] = entries.map((entry) =>
    differenceInDays(todayIsoDate, entry.performedAt),
  );
  return Math.max(Math.min(...gaps), 0);
}

export function subjectFrequency(entries: RangeEntry[]): SubjectFrequency[] {
  const counts: Map<string, SubjectFrequency> = new Map<string, SubjectFrequency>();
  for (const entry of entries) {
    const existing: SubjectFrequency | undefined = counts.get(entry.subjectId);
    counts.set(entry.subjectId, {
      subjectId: entry.subjectId,
      subjectName: entry.subjectName,
      sessionCount: (existing?.sessionCount ?? 0) + 1,
    });
  }
  return [...counts.values()].sort((first, second) => {
    if (second.sessionCount !== first.sessionCount) {
      return second.sessionCount - first.sessionCount;
    }
    return first.subjectName.localeCompare(second.subjectName);
  });
}

/**
 * Fixed-width buckets walking back from today, oldest first, zero-filled so a
 * week without training reads as a gap in the chart instead of vanishing.
 */
export function volumeSeries(
  entries: RangeEntry[],
  rangeDays: number,
  bucketDays: number,
  todayIsoDate: string,
): VolumeBucket[] {
  const bucketCount: number = Math.ceil(rangeDays / bucketDays);
  const today: Date = parseLocalDate(todayIsoDate);
  const volumes: number[] = new Array<number>(bucketCount).fill(0);
  for (const entry of entries) {
    const daysAgo: number = Math.max(differenceInDays(todayIsoDate, entry.performedAt), 0);
    const bucketsBack: number = Math.floor(daysAgo / bucketDays);
    const index: number = bucketCount - 1 - bucketsBack;
    if (index < 0) {
      continue;
    }
    volumes[index] += entry.volumeKg;
  }
  return volumes.map((volumeKg, index) => {
    const bucketsBack: number = bucketCount - 1 - index;
    const daysBack: number = bucketsBack * bucketDays + (bucketDays - 1);
    return { startIsoDate: toLocalDateStringDaysAgo(today, daysBack), volumeKg };
  });
}

export function averageMetric(logs: DailyLog[], selector: DailyLogMetricSelector): number | null {
  const values: number[] = collectValues(logs, selector);
  if (!values.length) {
    return null;
  }
  return values.reduce((total, value) => total + value, 0) / values.length;
}

/**
 * Oldest logged value against the newest. Needs two readings to describe a
 * direction, so a single log in the window yields nothing.
 */
export function metricDelta(logs: DailyLog[], selector: DailyLogMetricSelector): number | null {
  const ordered: DailyLog[] = [...logs].sort((first, second) =>
    first.loggedDate.localeCompare(second.loggedDate),
  );
  const values: number[] = collectValues(ordered, selector);
  if (values.length < 2) {
    return null;
  }
  const [oldest] = values;
  const [newest] = [...values].reverse();
  return newest - oldest;
}

function collectValues(logs: DailyLog[], selector: DailyLogMetricSelector): number[] {
  const values: number[] = [];
  for (const log of logs) {
    const value: number | null = selector(log);
    if (value !== null) {
      values.push(value);
    }
  }
  return values;
}
