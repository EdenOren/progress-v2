const ISO_DATE_LENGTH: number = 10;
const MILLISECONDS_PER_DAY: number = 86400000;

/**
 * Calendar date in the user's own timezone. `toISOString()` would hand back a
 * UTC day, which is the previous day for anyone west of Greenwich after their
 * local midnight — the bug fixed in DR-10.
 */
export function toLocalDateString(date: Date): string {
  const year: number = date.getFullYear();
  const month: string = String(date.getMonth() + 1).padStart(2, '0');
  const day: string = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toLocalDateStringDaysAgo(date: Date, days: number): string {
  const shifted: Date = new Date(date.getTime());
  shifted.setDate(shifted.getDate() - days);
  return toLocalDateString(shifted);
}

/**
 * Accepts a bare date or a full timestamp and reads only the calendar day, at
 * local midnight, so day arithmetic never drifts across a timezone offset.
 */
export function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.slice(0, ISO_DATE_LENGTH).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function differenceInDays(laterIsoDate: string, earlierIsoDate: string): number {
  const later: number = parseLocalDate(laterIsoDate).getTime();
  const earlier: number = parseLocalDate(earlierIsoDate).getTime();
  // Rounding absorbs the one-hour shift a DST boundary puts inside the span.
  return Math.round((later - earlier) / MILLISECONDS_PER_DAY);
}
