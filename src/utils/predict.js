// Pace-based goal prediction.
// Looks at how much progress you've made since starting a goal, works out
// your average daily rate, and projects it forward to the deadline.

import { daysUntil } from './dates';

// Returns a rich prediction object for a goal.
export function predictGoal(goal, now = new Date()) {
  const target = Number(goal.target) || 0;
  const current = Math.min(Number(goal.current) || 0, target || Infinity);
  const percent = target > 0 ? Math.min(1, current / target) : 0;

  // Days since the goal was created (at least 1 so we never divide by zero).
  // `now` is honored here (not just accepted): all day math pins to it.
  const elapsed = Math.max(1, -daysUntil(goal.createdAt, now));
  const ratePerDay = current / elapsed; // average progress per day so far

  const daysLeft = goal.deadline ? daysUntil(goal.deadline, now) : null;

  // Already finished.
  if (target > 0 && current >= target) {
    return { percent: 1, status: 'done', ratePerDay, daysLeft, label: 'Goal reached 🎉' };
  }

  const remaining = target - current;

  // No deadline → just project a finish date from current pace.
  if (daysLeft === null) {
    if (ratePerDay <= 0) {
      return { percent, status: 'nostart', ratePerDay, daysLeft, label: 'Log progress to see a forecast' };
    }
    const daysToFinish = Math.ceil(remaining / ratePerDay);
    return {
      percent,
      status: 'projection',
      ratePerDay,
      daysLeft,
      daysToFinish,
      label: `At this pace, done in ~${daysToFinish} day${daysToFinish === 1 ? '' : 's'}`,
    };
  }

  // Deadline passed.
  if (daysLeft < 0) {
    return { percent, status: 'overdue', ratePerDay, daysLeft, label: 'Deadline passed' };
  }

  // No progress logged yet.
  if (ratePerDay <= 0) {
    const requiredRate = remaining / Math.max(1, daysLeft);
    return {
      percent,
      status: 'nostart',
      ratePerDay,
      daysLeft,
      requiredRate,
      label: `Need ~${formatRate(requiredRate, goal.unit)} to finish in time`,
    };
  }

  // Project where you'll be at the deadline.
  const projected = current + ratePerDay * daysLeft;
  const requiredRate = remaining / Math.max(1, daysLeft);
  const onTrack = projected >= target;

  return {
    percent,
    status: onTrack ? 'ontrack' : 'behind',
    ratePerDay,
    daysLeft,
    projected,
    requiredRate,
    label: onTrack
      ? `On track — projected ${Math.round(projected)}${unitSuffix(goal.unit)} by deadline`
      : `Behind — need ~${formatRate(requiredRate, goal.unit)} (doing ${formatRate(ratePerDay, goal.unit)})`,
  };
}

function unitSuffix(unit) {
  return unit ? ` ${unit}` : '';
}

function formatRate(rate, unit) {
  const r = rate >= 10 ? Math.round(rate) : Math.round(rate * 10) / 10;
  return `${r}${unitSuffix(unit)}/day`;
}

// Color hint for the prediction status (consumed by the UI).
export function statusColor(status, colors) {
  switch (status) {
    case 'done':
    case 'ontrack':
    case 'projection':
      return colors.accent;
    case 'behind':
    case 'overdue':
      return '#e25c5c'; // warning red, used sparingly
    default:
      return colors.muted;
  }
}
