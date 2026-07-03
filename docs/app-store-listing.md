# App Store listing — Lukes Tracker

Copy-paste material for App Store Connect. Character limits noted where
Apple enforces them.

## App name (30 chars max)

```
Lukes Tracker
```

## Subtitle (30 chars max)

```
Habits, goals & streaks
```

(29 chars. Alternative: `Discipline, tracked daily` — 25 chars.)

## Promotional text (170 chars max, editable without review)

```
Track habits, set goals, keep the streak alive. Stark black & white
design, on-device data, zero accounts. Your discipline, nobody's
business.
```

## Description (4000 chars max)

```
Lukes Tracker is a goal and habit tracker for people who take
discipline seriously — and privacy just as seriously.

EVERYTHING STAYS ON YOUR PHONE
No account. No sign-up. No cloud. No analytics. The app makes zero
network requests — your habits, goals, and history live only on your
device, and you can export them as JSON anytime.

TRACK THE DAILY WORK
- Tick off your daily habits with satisfying checkboxes
- A GitHub-style activity grid fills in day by day — watch four months
  of effort take shape
- Streaks, perfect days, and a daily completion bar keep the chain
  visible

SET REAL GOALS
- Any goal with a number: read 24 books, run 500 km, save $5,000
- Pick a deadline and log progress with quick +/- controls
- Pace-based forecasts tell you honestly whether you're on track:
  "On track — projected 28 books by deadline" or "Behind — need
  6.7 km/day"
- Milestones at 25 / 50 / 75 / 100% with a one-time celebration when
  you cross each

UNDERSTAND YOUR PATTERNS
- 14-day trend chart with your average
- Completion rate by weekday — find your weak days
- Longest streak, week-over-week delta, goals-on-track ratio

STAY ON IT
- Optional daily reminder at a time you choose
- Optional per-goal milestone notifications
- A rotating daily quote on discipline and consistency

DESIGNED LIKE A MANIFESTO
Pure black, sharp typography, monospaced numbers, and vintage
engravings — Doré's celestial rose, a 1707 map of the Moon, Piranesi's
staircases — reworked as subtle backdrops. No clutter, no gamification
kitsch. Just you and the work.

Lukes Tracker is independent software: one-time download, no
subscription, no ads, no data harvesting. It does one thing — it keeps
you honest.
```

## Keywords (100 chars max, comma-separated, no spaces needed)

```
habit,tracker,goal,streak,discipline,daily,routine,productivity,todo,minimal,private,offline
```

(98 chars. Don't repeat "lukes"/"tracker" from the name — the name
already ranks for those.)

## Category

- Primary: Productivity
- Secondary: Lifestyle (or Health & Fitness if positioning around routines)

## Age rating

4+ (no objectionable content).

## App Privacy questionnaire (App Store Connect > App Privacy)

Answer: **Data Not Collected.**

- "Do you or your third-party partners collect data from this app?" → **No**
- That's the only question; the listing then shows the "Data Not
  Collected" badge.

Why this is accurate (verified by security review in this repo):
- No network requests of any kind (no fetch/analytics/crash reporting)
- No accounts, no identifiers, no push tokens (notifications are
  local-only via expo-notifications)
- All user data lives in on-device AsyncStorage; the only way data
  leaves the device is the user-initiated JSON export via the system
  share sheet — user-initiated sharing does not count as collection

## Privacy policy URL (required even for "Data Not Collected")

Simplest option: a `PRIVACY.md` in the GitHub repo (public), e.g.
`https://github.com/lukemadeit09/LukesTracker/blob/main/PRIVACY.md`,
stating: no data collected, no accounts, all data on-device, local
notifications only, optional user-initiated export.

## Review notes (App Review Information)

```
Lukes Tracker is fully offline. No account is required and no server
exists. To test: add a habit on Home and tick it; create a goal on the
Goals tab (e.g. target 10, deadline next month) and tap + to log
progress; milestones fire at 25/50/75/100%. Notification features are
optional and gated behind the standard iOS permission prompt.
```

## Screenshots (required sizes)

Take on the 6.9" and 6.5" iPhone simulators (or device) — suggested set:
1. Home — hero message, streak, activity grid (red rose backdrop)
2. Goals — a goal on-track (green) and one behind (red)
3. Stats — trend chart + weekday heat (green moon backdrop)
4. Milestone celebration panel
5. Settings — grouped sections (blue armillary backdrop)
