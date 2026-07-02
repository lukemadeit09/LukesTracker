# Milestones — Design Spec

Status: draft for `backend-dev` + `frontend-dev`
Owner: design
Feature lives inside: **Goals** tab (no new nav entry). Touches `GoalCard`, `GoalsScreen`, `AppContext`, `notify.js`, `SettingsScreen`.

---

## 1. Concept

Every goal implicitly has 4 milestones: **25%, 50%, 75%, 100%** of `target`. No user configuration needed — they're derived from `target`/`current`, same as the existing progress bar math in `predictGoal`.

Two things change on top of what exists today:

1. **Visibility** — the progress bar gets tick markers at 25/50/75/100, and the card gains a small milestone row showing the *next* target and how far away it is.
2. **Celebration** — the first time a render sees `current` has crossed a milestone that hasn't been celebrated yet, show a one-time, tasteful inline celebration banner on that goal's card. Dismissing (or a short auto-timeout) marks it celebrated forever — it will not reappear, including after app restart.

Keep the existing card structure and spacing. This is additive, not a redesign.

---

## 2. Data model changes (for backend-dev)

Add to each goal object in `src/storage.js` (`emptyState.goals` shape) and to `addGoal` in `AppContext.js`:

```
goal.milestonesCelebrated: number[]   // e.g. [25, 50] — which milestone percents have been shown+dismissed
goal.milestoneNotifyEnabled: boolean  // default false — per-goal opt-in for milestone notifications
```

Notes:
- `milestonesCelebrated` stores **percent thresholds reached and acknowledged** (subset of `[25, 50, 75, 100]`), not full history — no timestamps needed for v1. If analytics/history is wanted later, this can grow into `[{ percent, celebratedAt }]`, but keep v1 minimal per the "resist clutter" mandate — flag this as an option, not a requirement.
- Do **not** store "reached" separately — "reached" is always derived live from `current / target` at render time. Only "celebrated" needs persistence, because it's the only state that can't be recomputed.
- `milestoneNotifyEnabled` is per-goal so a user can silence a goal they've stopped caring about while keeping the global reminder on for the rest of the app.
- Migration: `loadState()` in `storage.js` already merges `emptyState` into old saved data at the top level, but this needs a **per-goal** merge too, since goals are items in an array, not top-level keys. Flag to backend-dev: `loadState` must map over `parsed.goals` and backfill `milestonesCelebrated: []` and `milestoneNotifyEnabled: false` on any goal missing them (older saved goals won't have these fields).

### New context actions needed (`AppContext.js`)

```
acknowledgeMilestone(goalId, percent)
  // Adds `percent` to that goal's milestonesCelebrated array (idempotent — no-op if already present).
  // Called when the user dismisses the celebration banner, or after the auto-dismiss timer.

setGoalMilestoneNotify(goalId, enabled)
  // Sets goal.milestoneNotifyEnabled. UI calls this from the per-goal notification toggle
  // (see §6). Does NOT itself schedule a notification — see §6 for why.
```

Derived helper (can live in a new `src/utils/milestones.js`, not context — pure function of a goal):

```
getMilestoneStatus(goal) -> {
  thresholds: [25, 50, 75, 100],
  reached: number[],       // thresholds where percent >= threshold, derived from current/target
  celebrated: number[],    // goal.milestonesCelebrated
  pendingCelebration: number | null, // first reached-but-not-celebrated threshold, in order — the one to show now
  next: { percent: number, remaining: number } | null, // next uncrossed threshold + amount left, or null if 100% done
}
```

`GoalCard` and `GoalsScreen` both consume this helper rather than recomputing threshold math inline, matching how `predictGoal` is already used.

---

## 3. Visual design — progress bar markers

Extends the existing `track`/`fill` bar in `GoalCard.js` (currently a plain `View` with height 10, `radius.pill`, `colors.secondary + '55'` background, `colors.accent` fill).

**Layout**: the track becomes a `View` with `position: relative` so we can absolutely-position three small tick marks at 25%, 50%, 75% (100% is implied by the bar's own right edge, so it gets no separate tick — avoids clutter).

- Each tick: a **2px-wide, full-height vertical line**, centered on its percent position (`left: {pct}%`, `marginLeft: -1`).
- Tick color logic (this is the "next target" affordance):
  - **Reached** (current milestone threshold already at/under current progress, i.e. bar fill has passed it): tick is `colors.background` at low opacity over the fill — effectively just let the orange fill show through; no visible tick needed once passed. Simplest: render ticks only for thresholds **not yet reached**, using `colors.background + 'aa'` (dark, so it reads as a subtle notch against both the muted track and the orange fill wherever it happens to land).
  - **Next milestone** (the very next unreached threshold): same tick, but rendered slightly taller than the track (overflow by 3px top/bottom, so it pokes out) in `colors.text` at full opacity — a small bright marker showing "you're headed here next."
  - **Future milestones beyond next**: standard subtle tick, `colors.muted + '66'`.
- At 100%, the fill covers the whole track and all ticks are naturally submerged — no extra styling needed.

This keeps the bar visually identical at a glance (still a clean pill) but rewards a closer look with structure. No numbers cluttering the bar itself — numbers live in the milestone row below.

### Milestone row (new, sits directly under the progress bar, above the existing `predict` label)

A single line, small text, muted by default:

```
Next milestone: 75%  ·  6 books to go
```

- Style: reuses `styles.predict` sizing (`font.small`) but in `colors.muted`, `fontWeight: '600'`. Sits between the `track` and the existing `predict` (pace) text, separated by `spacing.xs`.
- At 100% complete, this row is replaced with a static line in `colors.accent`:
  `"Goal complete — every milestone hit"`
- If `target` is 0 or unset (edge case — goal has no numeric target), omit the row entirely (milestones require a target; nothing to compute).

---

## 4. The celebration moment

### Trigger

On each render of `GoalCard`, compute `pendingCelebration` via `getMilestoneStatus(goal)`. If non-null, render the celebration banner **instead of** the milestone row (the pace/predict line stays below it, unchanged). Only one pending celebration is shown at a time per goal, oldest threshold first — if a user logs a big jump that crosses two milestones in one update (e.g. 20% to 80%), they'll see the 25% celebration, dismiss it, then immediately see the 50% one, then 75%, in sequence. This keeps each moment singular and readable rather than stacking banners.

### Layout (replaces the milestone row, same vertical slot — no card height jump beyond ~1 extra line)

A slim inline banner, not a modal/overlay — stays disciplined, doesn't interrupt flow:

```
┌─────────────────────────────────────────────┐
│  ✓  Halfway there — 50% of Read 24 books      ✕│
└─────────────────────────────────────────────┘
```

- Container: full card width, `backgroundColor: colors.accent + '1a'` (accent at ~10% opacity — a subtle warm wash, not a solid block), `borderRadius: radius.sm`, `borderWidth: 1`, `borderColor: colors.accent + '55'`, `paddingVertical: spacing.sm`, `paddingHorizontal: spacing.md`, `flexDirection: row`, `alignItems: center`, `marginTop: spacing.xs`, `marginBottom: spacing.xs`.
- Left: a small checkmark glyph or accent dot (reuse text glyph `✓`, `color: colors.accent`, `fontSize: font.body`, `fontWeight: 800`) — no icon library dependency, consistent with the existing `✕`/`＋` text-glyph pattern already used in this codebase.
- Middle (flex: 1): copy in `color: colors.text`, `fontWeight: 700`, `fontSize: font.small`. Copy varies by threshold (see microcopy table below).
- Right: dismiss `✕`, `color: colors.muted`, same `hitSlop={10}` pattern as the existing remove button in `GoalCard`, tap target effectively ≥44×44 with hitSlop.
- No animation library needed for v1 — a simple `Animated.timing` fade/slide-in (opacity 0→1, translateY 4→0, ~200ms) on mount is a nice-to-have polish note for frontend-dev, not a requirement. No confetti, no color bursts, no sound — matches "classy, not confetti-overload."

### Microcopy per threshold

| Threshold | Copy |
|---|---|
| 25% | `Quarter way — 25% of {title}` |
| 50% | `Halfway there — 50% of {title}` |
| 75% | `Almost there — 75% of {title}` |
| 100% | `Goal complete — {title} 🎯` (the one place a symbol is acceptable — a single target glyph, not celebratory confetti-emoji spam) |

If `title` is long, truncate the banner text with `numberOfLines={1}` the same way the card title already does.

### Dismissal

- **Tap the ✕** → calls `acknowledgeMilestone(goal.id, pendingCelebration)` immediately. Banner swaps back to the normal milestone row on next render (no exit animation required, but a quick fade-out is fine if trivial).
- **Auto-dismiss**: if the user takes no action, auto-acknowledge after **6 seconds** so the banner never becomes stale clutter left sitting on the card during future visits. This is a UX safety net, not the primary path — most users will just tap ✕ or keep interacting with the app (any interaction elsewhere doesn't dismiss it; only the timer or explicit tap does, so a user who glances away briefly doesn't miss it).
- Tapping the `+`/`−` step buttons while a celebration is showing does **not** dismiss it prematurely — the banner is about the milestone just crossed, independent of further edits. It will resolve on its own timer or by explicit dismissal.
- Once dismissed (by either path), `acknowledgeMilestone` persists via the existing `AppContext` save-on-change effect, so it is durable across restarts immediately — no separate "confirm" step needed.

### Multiple goals celebrating at once

Each `GoalCard` manages its own pending celebration independently — if three goals all cross a milestone from the same batch of edits (unlikely but possible, e.g. a bulk import in the future), three banners can show simultaneously, one per card, each dismissed independently. No global celebration modal/queue — keeps the mental model simple and matches the card-local nature of goals.

---

## 5. States summary

| State | Visual |
|---|---|
| No milestones reached yet | Normal milestone row: `Next milestone: 25% · N {unit} to go` |
| Milestone reached, not yet celebrated (`pendingCelebration` set) | Celebration banner replaces the milestone row (see §4) |
| Milestone reached and celebrated | Normal milestone row showing the *next* uncelebrated/unreached threshold; tick for that threshold now full-opacity per §3 |
| All 4 milestones celebrated (100% done and acknowledged) | Static row: `Goal complete — every milestone hit`, in `colors.accent`. Progress bar fully filled, ticks submerged. |
| Goal has no target (0 or blank) | No milestone row, no ticks — bar behaves exactly as it does today |
| Goal deleted mid-celebration | N/A — card unmounts, nothing to clean up (no scheduled timers outlive the component if `useEffect` cleanup clears the auto-dismiss timeout on unmount) |
| User un-does progress (e.g. presses `−` below a milestone after celebrating it) | Celebration stays marked celebrated (it's a one-way ratchet — `milestonesCelebrated` is never cleared by progress decreasing). Tick and row reflect current position, but no "un-celebration" occurs. Ticks below current progress still render as "reached" style since threshold ≤ current is still mathematically true... **exception**: if current later drops below an already-celebrated threshold, that threshold no longer shows as "reached" in tick styling (recomputed live from current), but it stays in `milestonesCelebrated` so it won't re-fire a banner if the user climbs back past it. This avoids spamming repeat celebrations from someone bouncing around the same milestone. |

---

## 6. Per-goal milestone notification

### Where it lives in the UI

Inside `GoalCard`, add a small row **below the progress controls** (`controls` row), only relevant when a milestone notification makes sense (goal has a target > 0):

```
🔔 Notify on milestones          [ toggle ]
```

- Style: same `rowBetween`-style pattern as Settings' reminder row — `flexDirection: row`, `justifyContent: space-between`, `alignItems: center`, `marginTop: spacing.sm`, `paddingTop: spacing.sm`, `borderTopWidth: 1`, `borderTopColor: colors.secondary + '55'` (visually separates it as a secondary/settings-like affordance rather than a primary action, consistent with how Settings separates the time row).
- Label: `color: colors.text`, `font.small`, `fontWeight: 600`. Use a plain "Notify on milestones" — drop the bell glyph if the team prefers zero-icon consistency with the rest of the card (card currently uses text glyphs `✕ ＋ − +`, so a bell emoji is a mild style break — **recommendation: skip the emoji**, just use the text label to stay consistent with the rest of the app's glyph-minimalism). Final call to frontend-dev/product, but default to no bell.
- Control: `Switch`, same props as Settings (`trackColor={{ false: colors.secondary, true: colors.accent }}`, `thumbColor={colors.text}`), so it's visually identical to the global reminder toggle — reinforces "this is the same notification system, scoped."
- This row only renders when `goal.target > 0`. If a user hasn't set a target, milestones (and thus milestone notifications) don't apply.

### Interaction with the global reminder toggle (Settings)

This is a **derived/gated feature**, not an independent scheduler:

- The per-goal switch sets `goal.milestoneNotifyEnabled` (persisted, so the user's intent survives even if global reminders are off).
- Whether a notification actually fires requires **both**:
  1. `state.settings.reminderEnabled === true` (global toggle in Settings)
  2. `goal.milestoneNotifyEnabled === true` (this specific goal)
- If the global toggle is off, the per-goal switch is still visible and toggleable (so the user can set up milestone notifications ahead of time), but shows a muted hint underneath when off:
  `Turn on Daily reminder in Settings to receive this`
  — styled `color: colors.muted`, `font.tiny`, `marginTop: spacing.xs`. This avoids a dead-end toggle with no explanation (a11y/clarity requirement).
- **Mechanism**: reuse `scheduleDailyReminder`-style local notification via `expo-notifications`, but milestone notifications are **event-triggered**, not time-scheduled — they should fire near-immediately when a milestone is crossed (not on a daily timer). Recommend a new small function in `notify.js`:

  ```
  sendMilestoneNotification(goalTitle, percent)
  ```

  fired as an **immediate local notification** (trigger: null / fire-now) at the moment `pendingCelebration` is first detected for a goal with `milestoneNotifyEnabled && settings.reminderEnabled`, mirroring the in-app banner. This is a one-line addition parallel to `scheduleDailyReminder`, reusing the same `ensurePermission()` guard and the same `Notifications.setNotificationChannelAsync('reminders', …)` channel on Android — same channel as the daily reminder so users see one unified "Reminders" notification category in system settings, not two.
  - Copy mirrors the in-app banner: title `Lukes Tracker`, body e.g. `Halfway there — 50% of Read 24 books`.
  - If `ensurePermission()` fails (no OS permission), fail silently for milestone notifications specifically — do not show the same permission `Alert` that Settings shows for the daily reminder (that prompt belongs to the primary Settings flow; repeating it from a goal card would be intrusive). The in-app banner is the guaranteed fallback either way, so nothing is lost.

Flag to **backend-dev**: confirm whether `notify.js` should expose this as a new exported function (`sendMilestoneNotification`) versus overloading `scheduleDailyReminder`. Design recommends a separate function since the trigger semantics (immediate vs. daily-repeating) are fundamentally different, and the two should be independently testable/cancelable.

---

## 7. Accessibility

- **Touch targets**: the celebration banner's dismiss `✕` uses `hitSlop={10}` minimum, matching the existing remove-goal `✕`, bringing the effective tappable area to at least 34×34pt on top of the glyph's own size — recommend bumping to `hitSlop={12}` to comfortably clear the 44×44 Apple HIG / Android accessibility guideline given the glyph itself is small. The milestone-notify `Switch` is a native control and meets minimum target size by default.
- **Contrast**: banner text (`colors.text` white) on the accent-wash background (`colors.accent + '1a'` over `colors.surface`) — verify contrast; because the wash is only ~10% opacity over the existing dark surface, the effective background stays close to `colors.surface`, so white text contrast is equivalent to existing card text (already passes elsewhere in the app). Do not put white text directly on full-opacity `colors.accent` (orange) — contrast there is weaker; this is why the design uses a *tinted wash*, not a solid accent-filled banner.
- **Screen reader labels**: 
  - Banner should expose an `accessibilityRole="alert"` (or at minimum `accessibilityLiveRegion="polite"` on Android) so screen reader users are notified when it appears without needing to discover it manually.
  - Dismiss control: `accessibilityLabel="Dismiss milestone celebration"`.
  - Progress bar ticks are decorative — mark the tick `View`s with `accessibilityElementsHidden`/`importantForAccessibility="no"` so screen readers don't try to enumerate three unlabeled marks; instead, the milestone row's text (`Next milestone: 75% · 6 books to go`) already conveys the same info accessibly.
  - Milestone-notify switch: `accessibilityLabel="Notify on milestones for {goal.title}"`, `accessibilityHint` describing dependency on the global setting when off.
- **Auto-dismiss caution**: a 6-second auto-timeout could be too fast for screen-reader users (who need time for the announcement to be read aloud plus time to act). Recommend: **pause/cancel the auto-dismiss timer while VoiceOver/TalkBack is active** if detectable (`AccessibilityInfo.isScreenReaderEnabled()`), falling back to dismiss-on-tap only in that case. Flag this explicitly to frontend-dev as a required check, not optional polish — this is the one place auto-dismiss could actively hurt a user who needs the info most.
- **Motion**: the optional fade/slide-in entrance animation should respect `AccessibilityInfo.isReduceMotionEnabled()` — skip the animation (render at final state instantly) if reduce-motion is on.

---

## 8. Component/file impact summary

| File | Change |
|---|---|
| `src/storage.js` | Add `milestonesCelebrated: []`, `milestoneNotifyEnabled: false` defaults; backfill on load for existing goals |
| `src/context/AppContext.js` | Add `acknowledgeMilestone(goalId, percent)`, `setGoalMilestoneNotify(goalId, enabled)`; extend `addGoal` to initialize new fields |
| `src/utils/milestones.js` (new) | Pure helper `getMilestoneStatus(goal)` — thresholds/reached/celebrated/pendingCelebration/next |
| `src/utils/notify.js` | New `sendMilestoneNotification(goalTitle, percent)` — immediate local notification, gated by caller on `reminderEnabled && goal.milestoneNotifyEnabled` |
| `src/components/GoalCard.js` | Add tick marks to `track`, milestone row (or celebration banner) under the bar, per-goal notify toggle row below `controls` |
| `src/screens/GoalsScreen.js` | No structural change — `GoalCard` handles all milestone UI internally; screen just needs to pass through any new context actions if `GoalCard` doesn't call `useApp()` directly (currently `GoalCard` is presentational and receives callbacks as props, so either wire `acknowledgeMilestone`/`setGoalMilestoneNotify` as new props from `GoalsScreen`, or have `GoalCard` call `useApp()` itself — **recommend the latter** since these are self-contained, goal-scoped actions that don't need to bubble through the screen, avoiding prop-drilling growth on `GoalsScreen`) |
| `src/screens/SettingsScreen.js` | No change required — global toggle already exists and is simply read by the gating logic above |

---

## 9. What stays out of scope (deliberately)

- No milestone history/timeline view — this app is about the current state, not a log.
- No custom/user-defined milestone percentages — fixed at 25/50/75/100 to keep the mental model universal and the UI simple.
- No confetti, haptics-heavy, or full-screen celebration modal — the whole point is restraint befitting a discipline app.
- No per-milestone custom notification copy — copy is fixed per threshold (table in §4) to avoid a settings-sprawl problem.
