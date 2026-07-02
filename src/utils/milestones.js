// Pure milestone math for goals.
// Every goal implicitly has 4 milestones at 25/50/75/100% of its target.
// "Reached" is always derived live from current/target — only "celebrated"
// needs to be persisted (see AppContext's acknowledgeMilestone).

const THRESHOLDS = [25, 50, 75, 100];

// Returns a status object describing where a goal stands relative to its
// milestone thresholds. Pure function of `goal` — safe to call on every render.
//
// getMilestoneStatus(goal) -> {
//   thresholds: [25, 50, 75, 100],
//   reached: number[],                 // thresholds crossed by current/target
//   celebrated: number[],              // goal.milestonesCelebrated (defaulted to [])
//   pendingCelebration: number | null, // oldest reached-but-uncelebrated threshold
//   next: { percent, remaining } | null,
// }
export function getMilestoneStatus(goal) {
  const target = Number(goal && goal.target) || 0;
  const rawCurrent = Number(goal && goal.current) || 0;
  const celebrated = Array.isArray(goal && goal.milestonesCelebrated)
    ? goal.milestonesCelebrated
    : [];

  // No target means there's nothing to divide progress by — no milestones apply.
  if (target <= 0) {
    return {
      thresholds: THRESHOLDS,
      reached: [],
      celebrated,
      pendingCelebration: null,
      next: null,
    };
  }

  // Clamp current into [0, target] so overshooting progress doesn't invent
  // percentages beyond 100 or produce a negative "remaining".
  const current = Math.min(Math.max(rawCurrent, 0), target);
  const percent = (current / target) * 100;

  const reached = THRESHOLDS.filter((t) => percent >= t);

  // Oldest (smallest) reached threshold not yet celebrated, in order.
  const pendingCelebration =
    reached.find((t) => !celebrated.includes(t)) ?? null;

  // Next uncrossed threshold, or null once every threshold has been reached.
  const nextThreshold = THRESHOLDS.find((t) => percent < t);
  let next = null;
  if (nextThreshold !== undefined) {
    const targetUnits = (nextThreshold / 100) * target;
    next = {
      percent: nextThreshold,
      remaining: Math.max(0, targetUnits - current),
    };
  }

  return {
    thresholds: THRESHOLDS,
    reached,
    celebrated,
    pendingCelebration,
    next,
  };
}
