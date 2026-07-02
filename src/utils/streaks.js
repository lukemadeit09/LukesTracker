// Pure streak math over completion history.
// Mirrors AppContext's currentStreak() logic (a day "counts" when it has at
// least one completed task that day) but scans the whole history instead of
// stopping at the first gap from today.

import { dayKey, addDays } from './dates';

// Returns the longest run of consecutive calendar days, anywhere in history,
// that each have at least one entry in `completions[day]`. A day key present
// with an empty array (e.g. after every task on that day was deleted) does
// NOT count as active — only `length > 0` counts.
//
// longestStreak(completions, tasks) -> number (0 if there's no data at all)
export function longestStreak(completions, tasks) {
  if (!completions || typeof completions !== 'object') return 0;
  if (!Array.isArray(tasks) || tasks.length === 0) return 0;

  // Active days: day keys with a non-empty completion list. Sorted 'YYYY-MM-DD'
  // strings sort correctly lexicographically, so no Date parsing needed here.
  const activeDays = Object.keys(completions)
    .filter((day) => Array.isArray(completions[day]) && completions[day].length > 0)
    .sort();

  if (activeDays.length === 0) return 0;

  // Walk the full range from the earliest active day to today, day by day,
  // tracking the longest run of consecutive active days. Deriving the range
  // from the data itself (rather than a fixed lookback window) means streaks
  // from any point in the app's history are found, not just a recent slice.
  const earliest = activeDays[0];
  const [y, m, d] = earliest.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date();

  const activeSet = new Set(activeDays);

  let longest = 0;
  let current = 0;
  for (let day = start; day <= end; day = addDays(day, 1)) {
    if (activeSet.has(dayKey(day))) {
      current++;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }

  return longest;
}
