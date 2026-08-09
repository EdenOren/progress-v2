const SECONDS_PER_MINUTE: number = 60;
const MINUTES_PER_HOUR: number = 60;

/**
 * Session length for display: `45m`, `1h`, `1h 20m`, or empty when the session
 * was never completed and has no duration to show.
 */
export function formatDuration(durationSeconds: number | null): string {
  if (!durationSeconds) {
    return '';
  }
  const minutes: number = Math.floor(durationSeconds / SECONDS_PER_MINUTE);
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes}m`;
  }
  const hours: number = Math.floor(minutes / MINUTES_PER_HOUR);
  const remainingMinutes: number = minutes % MINUTES_PER_HOUR;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
