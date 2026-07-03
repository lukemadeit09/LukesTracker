// Pure weekday completion-rate math ("weekday heat").
// Answers: "which days of the week am I strongest/weakest on?", independent
// of the Trend chart's fixed last-14-days recency window.

import { lastNDays } from './dates';

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// Rolling lookback, mirrors the activity grid's "recent window" philosophy
// (recent-weighted, not all-time) so one early outlier day can't skew a
// weekday's average forever.
const DEFAULT_WINDOW_DAYS = 90;

// weekdayHeat(tasks, completions, windowDays = 90, end = new Date()) ->
//   [{ weekday: 0-6, label: 'SUN'..'SAT', avgScore: number }, ...] (7 entries, Sun first)
//
// avgScore is the average of dayScore's fraction-complete (0..1) across every
// calendar day in the last `windowDays` days ending at `end` that falls on
// that weekday. `end` is injectable so callers (and tests) can pin time.
// Days with zero tasks that day (i.e. no tasks exist at all) contribute 0,
// matching dayScore's own "no tasks -> 0" behavior. A weekday with no days
// in the window at all (windowDays < 7) gets avgScore 0.
export function weekdayHeat(tasks, completions, windowDays = DEFAULT_WINDOW_DAYS, end = new Date()) {
  const sums = [0, 0, 0, 0, 0, 0, 0];
  const counts = [0, 0, 0, 0, 0, 0, 0];

  const hasTasks = Array.isArray(tasks) && tasks.length > 0;
  const taskCount = hasTasks ? tasks.length : 0;
  const safeCompletions = completions && typeof completions === 'object' ? completions : {};

  const days = lastNDays(Math.max(0, windowDays), end);
  for (const day of days) {
    const [y, m, d] = day.split('-').map(Number);
    const weekday = new Date(y, m - 1, d).getDay(); // 0 (Sun) .. 6 (Sat)
    const done = Array.isArray(safeCompletions[day]) ? safeCompletions[day].length : 0;
    const score = hasTasks ? Math.min(1, done / taskCount) : 0;
    sums[weekday] += score;
    counts[weekday] += 1;
  }

  return WEEKDAY_LABELS.map((label, weekday) => ({
    weekday,
    label,
    avgScore: counts[weekday] > 0 ? sums[weekday] / counts[weekday] : 0,
  }));
}
