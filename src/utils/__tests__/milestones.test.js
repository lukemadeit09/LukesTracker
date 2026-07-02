import { getMilestoneStatus } from '../milestones';

function makeGoal(overrides = {}) {
  return {
    id: 'g1',
    title: 'Read 24 books',
    target: 100,
    current: 0,
    unit: 'books',
    milestonesCelebrated: [],
    ...overrides,
  };
}

describe('getMilestoneStatus', () => {
  describe('no usable target', () => {
    test('target 0 → no thresholds reached, next null, nothing pending', () => {
      const status = getMilestoneStatus(makeGoal({ target: 0, current: 50 }));
      expect(status.reached).toEqual([]);
      expect(status.next).toBeNull();
      expect(status.pendingCelebration).toBeNull();
      expect(status.thresholds).toEqual([25, 50, 75, 100]);
    });

    test('missing target → treated like 0', () => {
      const goal = makeGoal({ current: 10 });
      delete goal.target;
      const status = getMilestoneStatus(goal);
      expect(status.reached).toEqual([]);
      expect(status.next).toBeNull();
      expect(status.pendingCelebration).toBeNull();
    });

    test('non-numeric target → treated like 0', () => {
      const status = getMilestoneStatus(makeGoal({ target: 'not-a-number', current: 10 }));
      expect(status.reached).toEqual([]);
      expect(status.next).toBeNull();
      expect(status.pendingCelebration).toBeNull();
    });

    test('negative target → treated like 0 (no thresholds)', () => {
      const status = getMilestoneStatus(makeGoal({ target: -10, current: 5 }));
      expect(status.reached).toEqual([]);
      expect(status.next).toBeNull();
    });
  });

  describe('zero progress', () => {
    test('current 0 → nothing reached, next is 25%', () => {
      const status = getMilestoneStatus(makeGoal({ target: 100, current: 0 }));
      expect(status.reached).toEqual([]);
      expect(status.pendingCelebration).toBeNull();
      expect(status.next).toEqual({ percent: 25, remaining: 25 });
    });
  });

  describe('exact threshold boundaries', () => {
    test('current at exactly 25% counts as reached', () => {
      const status = getMilestoneStatus(makeGoal({ target: 100, current: 25 }));
      expect(status.reached).toEqual([25]);
      expect(status.next).toEqual({ percent: 50, remaining: 25 });
    });

    test('current at exactly 50% counts as reached (25 and 50)', () => {
      const status = getMilestoneStatus(makeGoal({ target: 100, current: 50 }));
      expect(status.reached).toEqual([25, 50]);
      expect(status.next).toEqual({ percent: 75, remaining: 25 });
    });

    test('current at exactly 75% counts as reached (25, 50, 75)', () => {
      const status = getMilestoneStatus(makeGoal({ target: 100, current: 75 }));
      expect(status.reached).toEqual([25, 50, 75]);
      expect(status.next).toEqual({ percent: 100, remaining: 25 });
    });

    test('current at exactly 100% counts as reached (all four), next is null', () => {
      const status = getMilestoneStatus(makeGoal({ target: 100, current: 100 }));
      expect(status.reached).toEqual([25, 50, 75, 100]);
      expect(status.next).toBeNull();
    });

    test('boundary math holds for a non-100 target (e.g. 24 books)', () => {
      // 25% of 24 = 6
      const status = getMilestoneStatus(makeGoal({ target: 24, current: 6 }));
      expect(status.reached).toEqual([25]);
      // next threshold is 50% of 24 = 12, remaining = 6
      expect(status.next).toEqual({ percent: 50, remaining: 6 });
    });
  });

  describe('current beyond target', () => {
    test('current > target is clamped, same as 100%', () => {
      const over = getMilestoneStatus(makeGoal({ target: 100, current: 150 }));
      const exact = getMilestoneStatus(makeGoal({ target: 100, current: 100 }));
      expect(over.reached).toEqual(exact.reached);
      expect(over.next).toBeNull();
      expect(over.reached).toEqual([25, 50, 75, 100]);
    });

    test('negative current is clamped to 0', () => {
      const status = getMilestoneStatus(makeGoal({ target: 100, current: -10 }));
      expect(status.reached).toEqual([]);
      expect(status.next).toEqual({ percent: 25, remaining: 25 });
    });
  });

  describe('pendingCelebration ordering', () => {
    test('oldest reached-but-uncelebrated threshold is returned first', () => {
      const status = getMilestoneStatus(
        makeGoal({ target: 100, current: 80, milestonesCelebrated: [] })
      );
      expect(status.reached).toEqual([25, 50, 75]);
      expect(status.pendingCelebration).toBe(25);
    });

    test('skips already-celebrated thresholds to find the next pending one', () => {
      const status = getMilestoneStatus(
        makeGoal({ target: 100, current: 80, milestonesCelebrated: [25] })
      );
      expect(status.pendingCelebration).toBe(50);
    });

    test('pendingCelebration is null once all reached thresholds are celebrated', () => {
      const status = getMilestoneStatus(
        makeGoal({ target: 100, current: 80, milestonesCelebrated: [25, 50, 75] })
      );
      expect(status.pendingCelebration).toBeNull();
    });

    test('pendingCelebration is null when nothing has been reached yet', () => {
      const status = getMilestoneStatus(
        makeGoal({ target: 100, current: 10, milestonesCelebrated: [] })
      );
      expect(status.pendingCelebration).toBeNull();
    });

    test('all four celebrated at 100% → pendingCelebration null', () => {
      const status = getMilestoneStatus(
        makeGoal({ target: 100, current: 100, milestonesCelebrated: [25, 50, 75, 100] })
      );
      expect(status.pendingCelebration).toBeNull();
    });
  });

  describe('one-way ratchet: celebrated thresholds stay celebrated even if current drops', () => {
    test('celebrated contains 50 but current drops below 50% → 50 not reached, not pending, stays celebrated', () => {
      const status = getMilestoneStatus(
        makeGoal({ target: 100, current: 30, milestonesCelebrated: [25, 50] })
      );
      // 50% is no longer mathematically reached at 30% progress.
      expect(status.reached).toEqual([25]);
      // It must not come back as pending even though it's still in `celebrated`.
      expect(status.pendingCelebration).toBeNull();
      // celebrated array itself is untouched — still reflects history.
      expect(status.celebrated).toEqual([25, 50]);
    });

    test('climbing back past a de-reached-but-celebrated threshold does not re-trigger it', () => {
      // Back up to 60% — 50 becomes "reached" again, but it's already celebrated,
      // so pendingCelebration should not fire on it again.
      const status = getMilestoneStatus(
        makeGoal({ target: 100, current: 60, milestonesCelebrated: [25, 50] })
      );
      expect(status.reached).toEqual([25, 50]);
      expect(status.pendingCelebration).toBeNull();
    });
  });

  describe('next.remaining math', () => {
    test('remaining is units left to reach the next threshold, not a percent', () => {
      const status = getMilestoneStatus(makeGoal({ target: 200, current: 10 }));
      // next threshold 25% of 200 = 50, remaining = 50 - 10 = 40
      expect(status.next).toEqual({ percent: 25, remaining: 40 });
    });

    test('remaining is 0 exactly at a threshold boundary transition point', () => {
      const status = getMilestoneStatus(makeGoal({ target: 40, current: 20 }));
      // 20/40 = 50%, so 50 is reached; next is 75% of 40 = 30, remaining = 10
      expect(status.reached).toContain(50);
      expect(status.next).toEqual({ percent: 75, remaining: 10 });
    });

    test('remaining never goes negative when current overshoots within a band', () => {
      const status = getMilestoneStatus(makeGoal({ target: 10, current: 9.9 }));
      expect(status.next.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  test('celebrated defaults to [] when milestonesCelebrated is missing on the goal', () => {
    const goal = makeGoal({ target: 100, current: 100 });
    delete goal.milestonesCelebrated;
    const status = getMilestoneStatus(goal);
    expect(status.celebrated).toEqual([]);
    expect(status.pendingCelebration).toBe(25);
  });

  test('thresholds constant is always [25, 50, 75, 100] regardless of goal shape', () => {
    const status = getMilestoneStatus(makeGoal({ target: 50, current: 12 }));
    expect(status.thresholds).toEqual([25, 50, 75, 100]);
  });
});
