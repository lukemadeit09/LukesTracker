# Lukes Tracker

A minimalist, dark-themed goal-tracking app for people who take discipline seriously. Built with React Native + Expo. All data stays on your device — no accounts, no servers, no tracking.

> **Screenshots**
>
> _Coming soon — dashboard, goals, stats._
>
> <!-- Add screenshots: docs/screenshots/dashboard.png, goals.png, stats.png -->

## Features

- **Dashboard** — day streak 🔥, today's completion %, motivational message that adapts to your progress
- **Daily habits** — tickable checkboxes; long-press to delete
- **Activity grid** — GitHub-style contribution graph; each day's square fills with more accent color the more you complete
- **Goals** — any goal with a numeric target, unit, and deadline (real date picker)
- **Predictions** — pace-based forecasting: _"On track — projected 22 books by deadline"_ or _"Behind — need ~0.5/day (doing 0.3/day)"_
- **Milestones** — automatic 25/50/75/100% markers on every goal, a one-time celebration banner when you cross one (persisted — never repeats after restart), and opt-in per-goal notifications
- **Statistics** — 14-day completion chart, perfect days, total check-ins, per-goal forecasts
- **Reminders** — a daily local notification at a time you choose
- **Private by design** — everything is stored on-device in AsyncStorage; the app makes zero network calls

## Tech stack

| Layer | Choice |
|---|---|
| Framework | React Native 0.81 + Expo SDK 54 |
| State | React Context (`src/context/AppContext.js`) |
| Persistence | `@react-native-async-storage/async-storage` (single JSON key, versioned migration) |
| Notifications | `expo-notifications` (local only — no push, no tokens) |
| Charts / grid | Plain `View`s — no chart library |
| Navigation | Custom bottom tab bar — no navigation library |
| Tests | `jest-expo` + `@testing-library/react-native` (64 tests) |

## Getting started

Prerequisites: Node.js 20+ and npm.

```bash
git clone git@github.com:lukemadeit09/LukesTracker.git
cd LukesTracker
npm install
npm start
```

## Running on your phone (Expo Go)

1. Install **Expo Go** from the [App Store](https://apps.apple.com/app/expo-go/id982107779) or [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent).
2. Make sure your phone and computer are on the **same Wi-Fi network**.
3. Run `npx expo start` in the project folder.
4. Scan the QR code — with the Camera app (iOS) or from inside Expo Go (Android).

The app hot-reloads as you edit code. Shake the phone for the dev menu.

### When it doesn't work

| Symptom | Fix |
|---|---|
| "Project is incompatible with this version of Expo Go" | The project's SDK must match Expo Go's supported SDK. This project targets **SDK 54**. If Expo Go has moved on, upgrade the project (`npm install expo@^<sdk> && npx expo install --fix`), or if the project is newer than Expo Go, downgrade the same way. |
| Old/broken bundle, stale errors after dependency changes | Restart with a cleared cache: `npx expo start -c` |
| QR scans but never connects / times out | Phone and computer must be on the same network — no guest Wi-Fi, VPNs off. As a fallback run `npx expo start --tunnel` (slower, but works across networks). |
| Blank screen after adding a native module | Fully stop the server and restart (`Ctrl+C`, then `npx expo start -c`), and reopen the project in Expo Go. |
| Notifications don't appear | Check the OS-level notification permission for Expo Go; the in-app toggle prompts once and fails gracefully if denied. |

## Testing

```bash
npm test        # 5 suites, 64 tests: milestones, predictions, dates, context flows, UI
```

## Building & publishing

Development happens in Expo Go (above). For a permanent install, use **EAS Build** — config is in [eas.json](eas.json):

- `eas build -p android --profile preview` → a standalone **APK** you can sideload directly on any Android phone.
- `eas build -p <platform> --profile production` + `eas submit` → store-ready builds for the **Play Store / App Store** (requires developer accounts).

No builds are wired to CI; run them manually when needed.

## Project structure

```
App.js                       # root: theme, provider, bottom tabs
src/
  theme.js                   # color palette + spacing/radius/font tokens
  storage.js                 # AsyncStorage load/save + migrations
  context/AppContext.js      # all state, actions, derived values (streaks, scores)
  screens/                   # Dashboard, Goals, Stats, Settings
  components/                # GoalCard, ContributionGrid, Checkbox, BarChart, StatCard
  utils/                     # dates, predictions, milestones, notifications, messages
docs/design/                 # feature design specs (written before code)
.claude/agents/              # the subagent pipeline (below)
```

### Palette

`#253237` background · `#4f5d75` slate · `#bfc0c0` silver · `#ffffff` text · `#ef8354` accent

## Development workflow: the subagent pipeline

This repo is developed with [Claude Code](https://claude.com/claude-code) using five project subagents (`.claude/agents/`), run in order for every feature:

1. **ui-designer** — writes a design spec to `docs/design/` before any code (layout, states, a11y, data needs)
2. **backend-dev** — implements storage, state actions, and pure logic against the spec
3. **frontend-dev** — builds the screens/components against the backend's API
4. **tester** — writes and runs jest tests on what was built
5. **security-reviewer** — final read-only gate: privacy/exfiltration sweep, permissions, `npm audit`, secrets

Each agent has a scoped toolset (designers and reviewers can't edit code), so the order is enforced by capability, not just convention. The milestones feature (`docs/design/milestones.md`) was built end-to-end this way.

## Privacy

There is no backend. The app performs **zero network requests** — verified by the security-review step on every feature. Your goals, habits, and history live in a single AsyncStorage key on your device and go nowhere else.
