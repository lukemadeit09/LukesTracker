import { predictGoal, statusColor } from '../predict';
import { dayKey, addDays } from '../dates';

// Helper: build a createdAt key `daysAgo` days before `now`.
function createdDaysAgo(daysAgo, now = new Date()) {
  return dayKey(addDays(now, -daysAgo));
}

function deadlineInDays(days, now = new Date()) {
  return dayKey(addDays(now, days));
}

describe('predictGoal', () => {
  const now = new Date(2026, 6, 2); // 2026-07-02, matches project "today"

  test('completed goal (current >= target) → status done, regardless of deadline', () => {
    const goal = {
      target: 100,
      current: 100,
      createdAt: createdDaysAgo(10, now),
      deadline: deadlineInDays(5, now),
    };
    const result = predictGoal(goal, now);
    expect(result.status).toBe('done');
    expect(result.percent).toBe(1);
    expect(result.label).toMatch(/Goal reached/);
  });

  test('completed goal when current overshoots target', () => {
    const goal = {
      target: 100,
      current: 150,
      createdAt: createdDaysAgo(10, now),
      deadline: null,
    };
    const result = predictGoal(goal, now);
    expect(result.status).toBe('done');
    expect(result.percent).toBe(1);
  });

  describe('no deadline', () => {
    test('zero progress with no deadline → nostart, daysLeft null', () => {
      const goal = {
        target: 100,
        current: 0,
        createdAt: createdDaysAgo(5, now),
        deadline: null,
      };
      const result = predictGoal(goal, now);
      expect(result.status).toBe('nostart');
      expect(result.daysLeft).toBeNull();
      expect(result.label).toMatch(/Log progress to see a forecast/);
    });

    test('positive pace with no deadline → projection with a computed finish date', () => {
      const goal = {
        target: 100,
        current: 20,
        createdAt: createdDaysAgo(10, now), // rate = 2/day
        deadline: null,
      };
      const result = predictGoal(goal, now);
      expect(result.status).toBe('projection');
      expect(result.daysLeft).toBeNull();
      // remaining 80 at rate 2/day = 40 days
      expect(result.daysToFinish).toBe(40);
      expect(result.label).toMatch(/At this pace, done in ~40 days/);
    });

    test('projection singular day label when daysToFinish is 1', () => {
      const goal = {
        target: 10,
        current: 9,
        createdAt: createdDaysAgo(1, now), // rate = 9/day, remaining 1 → ceil(1/9) = 1
        deadline: null,
      };
      const result = predictGoal(goal, now);
      expect(result.daysToFinish).toBe(1);
      expect(result.label).toMatch(/~1 day$/);
    });
  });

  describe('with a deadline in the future', () => {
    test('on-track: projected finish meets or exceeds target by deadline', () => {
      const goal = {
        target: 100,
        current: 50,
        createdAt: createdDaysAgo(10, now), // rate = 5/day
        deadline: deadlineInDays(10, now), // 10 days left; projected 50+50=100
      };
      const result = predictGoal(goal, now);
      expect(result.status).toBe('ontrack');
      expect(result.daysLeft).toBe(10);
      expect(result.projected).toBe(100);
      expect(result.label).toMatch(/^On track/);
    });

    test('behind: projected finish falls short of target by deadline', () => {
      const goal = {
        target: 100,
        current: 10,
        createdAt: createdDaysAgo(10, now), // rate = 1/day
        deadline: deadlineInDays(5, now), // projected 10+5=15, short of 100
      };
      const result = predictGoal(goal, now);
      expect(result.status).toBe('behind');
      expect(result.label).toMatch(/^Behind/);
      expect(result.requiredRate).toBeCloseTo(90 / 5);
    });

    test('zero progress with a future deadline → nostart with a required rate', () => {
      const goal = {
        target: 50,
        current: 0,
        createdAt: createdDaysAgo(3, now),
        deadline: deadlineInDays(10, now),
      };
      const result = predictGoal(goal, now);
      expect(result.status).toBe('nostart');
      expect(result.requiredRate).toBeCloseTo(5); // 50 remaining / 10 days
      expect(result.label).toMatch(/Need ~5/);
    });

    test('deadline exactly today (daysLeft 0) is not treated as overdue', () => {
      const goal = {
        target: 100,
        current: 50,
        createdAt: createdDaysAgo(10, now),
        deadline: deadlineInDays(0, now),
      };
      const result = predictGoal(goal, now);
      expect(result.daysLeft).toBe(0);
      expect(result.status).not.toBe('overdue');
    });
  });

  describe('overdue', () => {
    test('deadline passed (daysLeft < 0) and goal incomplete → overdue', () => {
      const goal = {
        target: 100,
        current: 40,
        createdAt: createdDaysAgo(20, now),
        deadline: deadlineInDays(-5, now),
      };
      const result = predictGoal(goal, now);
      expect(result.status).toBe('overdue');
      expect(result.daysLeft).toBe(-5);
      expect(result.label).toBe('Deadline passed');
    });
  });

  test('elapsed days is floored at 1 to avoid divide-by-zero for a goal created today', () => {
    const goal = {
      target: 100,
      current: 10,
      createdAt: dayKey(now),
      deadline: null,
    };
    const result = predictGoal(goal, now);
    // elapsed clamped to 1 day, so ratePerDay === current
    expect(result.ratePerDay).toBe(10);
  });

  test('target 0 (no numeric target) → percent 0, does not throw, falls into nostart/projection paths', () => {
    const goal = {
      target: 0,
      current: 0,
      createdAt: createdDaysAgo(5, now),
      deadline: null,
    };
    const result = predictGoal(goal, now);
    expect(result.percent).toBe(0);
    expect(result.status).toBe('nostart');
  });
});

describe('statusColor', () => {
  const colors = { accent: '#f00', muted: '#888' };

  test('done, ontrack, and projection map to accent color', () => {
    expect(statusColor('done', colors)).toBe(colors.accent);
    expect(statusColor('ontrack', colors)).toBe(colors.accent);
    expect(statusColor('projection', colors)).toBe(colors.accent);
  });

  test('behind and overdue map to the warning red', () => {
    expect(statusColor('behind', colors)).toBe('#e25c5c');
    expect(statusColor('overdue', colors)).toBe('#e25c5c');
  });

  test('unknown/nostart status falls back to muted', () => {
    expect(statusColor('nostart', colors)).toBe(colors.muted);
    expect(statusColor('something-else', colors)).toBe(colors.muted);
  });
});
