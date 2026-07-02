// One module for all motivational copy: the daily quote, the score-based
// hero message, and the notification reminder lines. No APIs — everything
// ships with the app and rotates deterministically by date.

// ~50 quotes on discipline, consistency, and building. Kept short so they
// sit well in the quote card.
export const QUOTES = [
  { text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', author: 'Will Durant' },
  { text: 'Discipline equals freedom.', author: 'Jocko Willink' },
  { text: 'How we spend our days is, of course, how we spend our lives.', author: 'Annie Dillard' },
  { text: 'You do not rise to the level of your goals. You fall to the level of your systems.', author: 'James Clear' },
  { text: 'Small deeds done are better than great deeds planned.', author: 'Peter Marshall' },
  { text: 'The chains of habit are too weak to be felt until they are too strong to be broken.', author: 'Samuel Johnson' },
  { text: 'It is not the mountain we conquer but ourselves.', author: 'Edmund Hillary' },
  { text: 'Well begun is half done.', author: 'Aristotle' },
  { text: 'A journey of a thousand miles begins with a single step.', author: 'Laozi' },
  { text: 'Nothing in this world can take the place of persistence.', author: 'Calvin Coolidge' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Do the hard jobs first. The easy jobs will take care of themselves.', author: 'Dale Carnegie' },
  { text: 'Motivation gets you going, but discipline keeps you growing.', author: 'John C. Maxwell' },
  { text: 'You will never change your life until you change something you do daily.', author: 'John C. Maxwell' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { text: 'The best time to plant a tree was twenty years ago. The second best time is now.', author: 'Proverb' },
  { text: 'Rivers know this: there is no hurry. We shall get there some day.', author: 'A. A. Milne' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'What you do every day matters more than what you do once in a while.', author: 'Gretchen Rubin' },
  { text: 'Amateurs sit and wait for inspiration. The rest of us just get up and go to work.', author: 'Stephen King' },
  { text: 'Either you run the day or the day runs you.', author: 'Jim Rohn' },
  { text: 'Discipline is the bridge between goals and accomplishment.', author: 'Jim Rohn' },
  { text: 'We must all suffer one of two things: the pain of discipline or the pain of regret.', author: 'Jim Rohn' },
  { text: 'Do what you can, with what you have, where you are.', author: 'Theodore Roosevelt' },
  { text: 'Perseverance is not a long race; it is many short races one after the other.', author: 'Walter Elliot' },
  { text: 'The man who moves a mountain begins by carrying away small stones.', author: 'Confucius' },
  { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'First we make our habits, then our habits make us.', author: 'Charles C. Noble' },
  { text: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
  { text: 'Action is the foundational key to all success.', author: 'Pablo Picasso' },
  { text: 'The way to get started is to quit talking and begin doing.', author: 'Walt Disney' },
  { text: 'Great things are done by a series of small things brought together.', author: 'Vincent van Gogh' },
  { text: 'If you get tired, learn to rest, not to quit.', author: 'Banksy' },
  { text: 'Hard choices, easy life. Easy choices, hard life.', author: 'Jerzy Gregorek' },
  { text: 'You miss 100% of the shots you don’t take.', author: 'Wayne Gretzky' },
  { text: 'Whether you think you can, or you think you can’t — you’re right.', author: 'Henry Ford' },
  { text: 'I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.', author: 'Bruce Lee' },
  { text: 'The successful warrior is the average man, with laser-like focus.', author: 'Bruce Lee' },
  { text: 'Fall seven times, stand up eight.', author: 'Japanese proverb' },
  { text: 'He who has a why to live can bear almost any how.', author: 'Friedrich Nietzsche' },
  { text: 'No one saves us but ourselves. We ourselves must walk the path.', author: 'Buddha' },
  { text: 'Waste no more time arguing about what a good man should be. Be one.', author: 'Marcus Aurelius' },
  { text: 'You have power over your mind — not outside events. Realize this, and you will find strength.', author: 'Marcus Aurelius' },
  { text: 'The impediment to action advances action. What stands in the way becomes the way.', author: 'Marcus Aurelius' },
  { text: 'Difficulties strengthen the mind, as labor does the body.', author: 'Seneca' },
  { text: 'Luck is what happens when preparation meets opportunity.', author: 'Seneca' },
  { text: 'Man conquers the world by conquering himself.', author: 'Zeno of Citium' },
  { text: 'Practice yourself, for heaven’s sake, in little things.', author: 'Epictetus' },
  { text: 'Progress is not achieved by luck or accident, but by working on yourself daily.', author: 'Epictetus' },
];

// Deterministic hash for date-keyed rotation (stable across re-renders).
function hash(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// The quote of the day: same quote all day, changes at midnight.
export function dailyQuote(dayKey) {
  return QUOTES[hash(dayKey) % QUOTES.length];
}

// --- Score-based hero messages (formerly src/utils/messages.js) ------------

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

export function messageForScore(score, seed = '') {
  if (score >= 1) return DONE[hash(seed) % DONE.length];
  if (score > 0) return MIDWAY[hash(seed) % MIDWAY.length];
  return START[hash(seed) % START.length];
}

// --- Notification reminder lines (used by src/utils/notify.js) -------------

export const REMINDER_LINES = [
  'Time to check in. What did you get done today?',
  "Don't break the chain. Tick off today's habits.",
  'Discipline now, pride later. Open your tracker.',
  'A small effort today keeps your streak alive.',
];

export function randomReminder() {
  return REMINDER_LINES[Math.floor(Math.random() * REMINDER_LINES.length)];
}
