import { weekdayHeat } from '../heat';
import { dayKey, addDays } from '../dates';

function daysAgo(n, now = new Date()) {
  return dayKey(addDays(now, -n));
}

describe('weekdayHeat', () => {
  // 2026-07-02 is a Thursday.
  const now = new Date(2026, 6, 2);
  const tasks = [{ id: 't1' }, { id: 't2' }];

  test('always returns 7 entries, Sun (0) through Sat (6), with labels', () => {
    const result = weekdayHeat([], {}, 14);
    expect(result).toHaveLength(7);
    expect(result.map((r) => r.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(result.map((r) => r.label)).toEqual([
      'SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT',
    ]);
  });

  test('no tasks -> every weekday avgScore is 0', () => {
    const result = weekdayHeat([], {}, 30);
    expect(result.every((r) => r.avgScore === 0)).toBe(true);
  });

  test('no completions but tasks exist -> every day in window scores 0', () => {
    const result = weekdayHeat(tasks, {}, 14);
    expect(result.every((r) => r.avgScore === 0)).toBe(true);
  });

  test('windowDays of 0 -> no days scanned, everything 0', () => {
    const result = weekdayHeat(tasks, {}, 0);
    expect(result.every((r) => r.avgScore === 0)).toBe(true);
  });

  test('a fully-completed Thursday contributes a score of 1 to THU', () => {
    // "now" itself is a Thursday.
    const completions = { [dayKey(now)]: ['t1', 't2'] };
    const result = weekdayHeat(tasks, completions, 1);
    const thu = result.find((r) => r.label === 'THU');
    expect(thu.avgScore).toBe(1);
  });

  test('partial completion averages correctly across two same-weekday days', () => {
    // now (Thu) and 7 days ago (also Thu).
    const completions = {
      [dayKey(now)]: ['t1', 't2'], // 2/2 = 1
      [daysAgo(7, now)]: ['t1'],   // 1/2 = 0.5
    };
    const result = weekdayHeat(tasks, completions, 8);
    const thu = result.find((r) => r.label === 'THU');
    expect(thu.avgScore).toBeCloseTo(0.75); // (1 + 0.5) / 2
  });

  test('a weekday with no days in a short window stays at 0, not NaN', () => {
    // windowDays=1 only includes "today" (Thursday), so every other weekday
    // has zero days counted and must default to 0 rather than 0/0.
    const result = weekdayHeat(tasks, {}, 1);
    const mon = result.find((r) => r.label === 'MON');
    expect(mon.avgScore).toBe(0);
    expect(Number.isNaN(mon.avgScore)).toBe(false);
  });

  test('day keys outside the window do not affect the average', () => {
    const completions = {
      [daysAgo(100, now)]: ['t1', 't2'], // far outside a 14-day window
    };
    const result = weekdayHeat(tasks, completions, 14);
    expect(result.every((r) => r.avgScore === 0)).toBe(true);
  });

  test('malformed inputs do not throw', () => {
    expect(() => weekdayHeat(null, null, 14)).not.toThrow();
    expect(() => weekdayHeat(undefined, undefined)).not.toThrow();
  });
});
