import { formatDuration } from './duration';

describe('formatDuration', () => {
  it('returns nothing for a session that was never completed', () => {
    expect(formatDuration(null)).toBe('');
  });

  it('returns nothing for a zero-length session', () => {
    // A session finished the instant it started carries no useful duration.
    expect(formatDuration(0)).toBe('');
  });

  it('formats under an hour in minutes', () => {
    expect(formatDuration(2700)).toBe('45m');
  });

  it('drops the minutes on a whole hour', () => {
    expect(formatDuration(3600)).toBe('1h');
  });

  it('formats hours and minutes together', () => {
    expect(formatDuration(4800)).toBe('1h 20m');
  });

  it('floors partial minutes rather than rounding up', () => {
    expect(formatDuration(119)).toBe('1m');
  });
});
