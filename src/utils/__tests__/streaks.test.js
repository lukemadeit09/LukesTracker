import { longestStreak } from '../streaks';
import { dayKey, addDays } from '../dates';

function daysAgo(n, now = new Date()) {
  return dayKey(addDays(now, -n));
}

describe('longestStreak', () => {
  const now = new Date(2026, 6, 2); // 2026-07-02, matches project "today"
  const tasks = [{ id: 't1', title: 'Read', createdAt: daysAgo(30, now) }];

  test('no tasks at all -> 0', () => {
    expect(longestStreak({}, [])).toBe(0);
  });

  test('tasks exist but completions is empty -> 0', () => {
    expect(longestStreak({}, tasks)).toBe(0);
  });

  test('a day key present with an empty array does NOT count as active', () => {
    const completions = { [daysAgo(0, now)]: [] };
    expect(longestStreak(completions, tasks)).toBe(0);
  });

  test('single active day -> streak of 1', () => {
    const completions = { [daysAgo(0, now)]: ['t1'] };
    expect(longestStreak(completions, tasks)).toBe(1);
  });

  test('run of consecutive days is counted correctly', () => {
    const completions = {
      [daysAgo(4, now)]: ['t1'],
      [daysAgo(3, now)]: ['t1'],
      [daysAgo(2, now)]: ['t1'],
      [daysAgo(1, now)]: ['t1'],
      [daysAgo(0, now)]: ['t1'],
    };
    expect(longestStreak(completions, tasks)).toBe(5);
  });

  test('a gap breaks the streak; longest run (not the most recent) wins', () => {
    const completions = {
      // Older, longer run of 4.
      [daysAgo(20, now)]: ['t1'],
      [daysAgo(19, now)]: ['t1'],
      [daysAgo(18, now)]: ['t1'],
      [daysAgo(17, now)]: ['t1'],
      // Gap.
      // Recent, shorter run of 2.
      [daysAgo(1, now)]: ['t1'],
      [daysAgo(0, now)]: ['t1'],
    };
    expect(longestStreak(completions, tasks)).toBe(4);
  });

  test('empty-array days inside an otherwise consecutive run break the streak', () => {
    const completions = {
      [daysAgo(2, now)]: ['t1'],
      [daysAgo(1, now)]: [], // task deleted that day -> not active
      [daysAgo(0, now)]: ['t1'],
    };
    expect(longestStreak(completions, tasks)).toBe(1);
  });

  test('a single historical active day far from today still yields streak 1, not 0', () => {
    const completions = { [daysAgo(200, now)]: ['t1'] };
    expect(longestStreak(completions, tasks)).toBe(1);
  });

  test('malformed completions (not an object) -> 0, does not throw', () => {
    expect(longestStreak(null, tasks)).toBe(0);
    expect(longestStreak(undefined, tasks)).toBe(0);
  });
});
