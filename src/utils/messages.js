// Motivational lines. Picked based on how the day is going so the app
// feels encouraging rather than nagging.

const START = [
  'A new day. Make it count.',
  'Discipline is choosing what you want most.',
  'Small steps, every single day.',
  'Show up. That is half the battle.',
];

const MIDWAY = [
  'Good momentum — keep going.',
  "You're building something. Don't stop.",
  'Halfway there. Finish strong.',
  'Consistency beats intensity.',
];

const DONE = [
  'Everything done. That is discipline.',
  'Perfect day. Be proud.',
  'You showed up fully today.',
  'This is how goals get crushed.',
];

// Deterministic pick per day so the message doesn't flicker on re-render.
function pick(list, seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}

export function messageForScore(score, seed = '') {
  if (score >= 1) return pick(DONE, seed);
  if (score > 0) return pick(MIDWAY, seed);
  return pick(START, seed);
}
