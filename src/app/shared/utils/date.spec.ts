import {
  calculateAge,
  differenceInDays,
  parseLocalDate,
  toLocalDateString,
  toLocalDateStringDaysAgo,
} from './date';

describe('toLocalDateString', () => {
  it('formats a date as the local calendar day', () => {
    expect(toLocalDateString(new Date(2026, 7, 10))).toBe('2026-08-10');
  });

  it('pads single-digit months and days', () => {
    expect(toLocalDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  // The DR-10 bug: toISOString() would report 2026-08-09 for this moment in any
  // negative-UTC-offset timezone, dating a workout to the day before.
  it('reports the local day for a time late in the evening', () => {
    expect(toLocalDateString(new Date(2026, 7, 10, 23, 30))).toBe('2026-08-10');
  });
});

describe('toLocalDateStringDaysAgo', () => {
  it('walks back within a month', () => {
    expect(toLocalDateStringDaysAgo(new Date(2026, 7, 10), 6)).toBe('2026-08-04');
  });

  it('walks back across a month boundary', () => {
    expect(toLocalDateStringDaysAgo(new Date(2026, 7, 3), 5)).toBe('2026-07-29');
  });

  it('walks back across a year boundary', () => {
    expect(toLocalDateStringDaysAgo(new Date(2026, 0, 2), 3)).toBe('2025-12-30');
  });

  it('returns the same day for a zero offset', () => {
    expect(toLocalDateStringDaysAgo(new Date(2026, 7, 10), 0)).toBe('2026-08-10');
  });
});

describe('parseLocalDate', () => {
  it('reads a bare date at local midnight', () => {
    const parsed: Date = parseLocalDate('2026-08-10');
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(7);
    expect(parsed.getDate()).toBe(10);
    expect(parsed.getHours()).toBe(0);
  });

  it('ignores the time portion of a full timestamp', () => {
    const parsed: Date = parseLocalDate('2026-08-10T23:30:00.000Z');
    expect(parsed.getDate()).toBe(10);
  });
});

describe('differenceInDays', () => {
  it('counts whole days between two dates', () => {
    expect(differenceInDays('2026-08-10', '2026-08-04')).toBe(6);
  });

  it('is zero for the same day', () => {
    expect(differenceInDays('2026-08-10', '2026-08-10')).toBe(0);
  });

  it('goes negative when the later date is actually earlier', () => {
    expect(differenceInDays('2026-08-04', '2026-08-10')).toBe(-6);
  });

  it('counts across a month boundary', () => {
    expect(differenceInDays('2026-08-02', '2026-07-30')).toBe(3);
  });

  // A span containing a DST change is 23 or 25 hours long; rounding keeps it
  // a whole number of days instead of truncating to one less.
  it('is unaffected by a daylight-saving boundary', () => {
    expect(differenceInDays('2026-03-30', '2026-03-28')).toBe(2);
    expect(differenceInDays('2026-11-02', '2026-10-31')).toBe(2);
  });
});

describe('calculateAge', () => {
  const today: Date = new Date(2026, 7, 11);

  it('returns nothing when no birth date is set', () => {
    expect(calculateAge(null, today)).toBeNull();
  });

  it('returns nothing for an empty string', () => {
    expect(calculateAge('', today)).toBeNull();
  });

  it('counts whole years after this year’s birthday', () => {
    expect(calculateAge('1996-04-12', today)).toBe(30);
  });

  it('has not counted a birthday still to come this year', () => {
    expect(calculateAge('1996-12-25', today)).toBe(29);
  });

  it('counts the birthday itself', () => {
    expect(calculateAge('1996-08-11', today)).toBe(30);
  });

  it('does not count the day before the birthday', () => {
    expect(calculateAge('1996-08-12', today)).toBe(29);
  });

  it('handles a 29 February birthday in a non-leap year', () => {
    expect(calculateAge('2004-02-29', new Date(2026, 1, 28))).toBe(21);
    expect(calculateAge('2004-02-29', new Date(2026, 2, 1))).toBe(22);
  });

  it('returns nothing for a date in the future', () => {
    expect(calculateAge('2027-01-01', today)).toBeNull();
  });

  it('is zero for a birth date earlier this year', () => {
    expect(calculateAge('2026-01-01', today)).toBe(0);
  });

  // Parsed by splitting the string: new Date('1996-04-12') is UTC midnight,
  // which is 1996-04-11 locally west of Greenwich and would read as an age
  // short by a year on the birthday itself.
  it('reads the birthday from the calendar date, not a UTC instant', () => {
    expect(calculateAge('1996-04-12', new Date(2026, 3, 12))).toBe(30);
  });
});
