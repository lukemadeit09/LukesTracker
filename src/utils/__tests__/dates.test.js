import { dayKey, todayKey, addDays, lastNDays, daysUntil } from '../dates';

describe('dayKey', () => {
  test('formats as YYYY-MM-DD using local date parts', () => {
    const d = new Date(2026, 6, 2); // July 2, 2026 (month is 0-indexed)
    expect(dayKey(d)).toBe('2026-07-02');
  });

  test('pads single-digit month and day with leading zeros', () => {
    const d = new Date(2026, 0, 5); // Jan 5, 2026
    expect(dayKey(d)).toBe('2026-01-05');
  });

  test('defaults to "now" when called with no arguments', () => {
    const before = new Date();
    const key = dayKey();
    const expected = dayKey(before);
    expect(key).toBe(expected);
  });
});

describe('todayKey', () => {
  test('matches dayKey(new Date())', () => {
    expect(todayKey()).toBe(dayKey(new Date()));
  });
});

describe('addDays', () => {
  test('adds positive days, rolling over month boundaries', () => {
    const d = new Date(2026, 0, 30); // Jan 30, 2026
    const result = addDays(d, 3);
    expect(dayKey(result)).toBe('2026-02-02');
  });

  test('subtracts days with a negative n', () => {
    const d = new Date(2026, 6, 2);
    const result = addDays(d, -2);
    expect(dayKey(result)).toBe('2026-06-30');
  });

  test('does not mutate the original date', () => {
    const d = new Date(2026, 6, 2);
    const copy = new Date(d);
    addDays(d, 5);
    expect(d.getTime()).toBe(copy.getTime());
  });
});

describe('lastNDays', () => {
  test('returns `count` entries, oldest first, ending on `end`', () => {
    const end = new Date(2026, 6, 2); // 2026-07-02
    const days = lastNDays(5, end);
    expect(days).toHaveLength(5);
    expect(days).toEqual([
      '2026-06-28',
      '2026-06-29',
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
    ]);
  });

  test('last entry is always the end date', () => {
    const end = new Date(2026, 6, 2);
    const days = lastNDays(30, end);
    expect(days[days.length - 1]).toBe(dayKey(end));
  });

  test('count of 1 returns just the end date', () => {
    const end = new Date(2026, 6, 2);
    expect(lastNDays(1, end)).toEqual(['2026-07-02']);
  });

  test('defaults end to now when omitted', () => {
    const days = lastNDays(3);
    expect(days).toHaveLength(3);
    expect(days[2]).toBe(todayKey());
  });
});

describe('daysUntil', () => {
  test('returns null when deadlineKey is falsy', () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(undefined)).toBeNull();
    expect(daysUntil('')).toBeNull();
  });

  test('returns 0 for a deadline of today', () => {
    expect(daysUntil(todayKey())).toBe(0);
  });

  test('returns a positive count for a future deadline', () => {
    const future = dayKey(addDays(new Date(), 7));
    expect(daysUntil(future)).toBe(7);
  });

  test('returns a negative count for a past deadline', () => {
    const past = dayKey(addDays(new Date(), -4));
    expect(daysUntil(past)).toBe(-4);
  });
});
