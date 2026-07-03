// Date helpers. All dates are stored as 'YYYY-MM-DD' local-day keys
// so a day means the user's calendar day, not a UTC instant.

export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayKey() {
  return dayKey(new Date());
}

// Add (or subtract) days to a Date, returning a new Date.
export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// Build an array of the last `count` day keys, oldest first, ending today.
export function lastNDays(count, end = new Date()) {
  const out = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push(dayKey(addDays(end, -i)));
  }
  return out;
}

// Whole days from `now`'s calendar day until a 'YYYY-MM-DD' deadline
// (can be negative). `now` is injectable so callers (and tests) can pin time.
export function daysUntil(deadlineKey, now = new Date()) {
  if (!deadlineKey) return null;
  const [y, m, d] = deadlineKey.split('-').map(Number);
  const deadline = new Date(y, m - 1, d);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((deadline - startOfToday) / (1000 * 60 * 60 * 24));
}
