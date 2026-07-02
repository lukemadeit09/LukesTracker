// Central app state: loads saved data once, exposes actions, and
// persists to the device whenever anything changes.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadState, saveState, emptyState } from '../storage';
import { todayKey, lastNDays } from '../utils/dates';
import { getMilestoneStatus } from '../utils/milestones';
import { sendMilestoneNotification } from '../utils/notify';
import { longestStreak as computeLongestStreak } from '../utils/streaks';
import { weekdayHeat as computeWeekdayHeat } from '../utils/heat';

const AppContext = createContext(null);

let idCounter = 0;
function makeId() {
  // Time + counter keeps ids unique even within the same millisecond.
  return `${Date.now().toString(36)}${(idCounter++).toString(36)}`;
}

export function AppProvider({ children }) {
  const [state, setState] = useState(emptyState);
  const [ready, setReady] = useState(false);

  // Load once on startup.
  useEffect(() => {
    (async () => {
      const loaded = await loadState();
      setState(loaded);
      setReady(true);
    })();
  }, []);

  // Save on every change (but not before the first load finishes,
  // otherwise we'd overwrite saved data with the empty default).
  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  // --- Actions -------------------------------------------------------------

  function addTask(title) {
    const clean = title.trim();
    if (!clean) return;
    setState((s) => ({
      ...s,
      tasks: [...s.tasks, { id: makeId(), title: clean, createdAt: todayKey() }],
    }));
  }

  function removeTask(taskId) {
    setState((s) => {
      // Drop the task and scrub it from every day's completion list.
      const completions = {};
      for (const [day, ids] of Object.entries(s.completions)) {
        completions[day] = ids.filter((id) => id !== taskId);
      }
      return {
        ...s,
        tasks: s.tasks.filter((t) => t.id !== taskId),
        completions,
      };
    });
  }

  // Toggle a task's completion for a given day (defaults to today).
  function toggleTask(taskId, day = todayKey()) {
    setState((s) => {
      const done = s.completions[day] || [];
      const next = done.includes(taskId)
        ? done.filter((id) => id !== taskId)
        : [...done, taskId];
      return { ...s, completions: { ...s.completions, [day]: next } };
    });
  }

  function isDone(taskId, day = todayKey()) {
    return (state.completions[day] || []).includes(taskId);
  }

  // --- Goal actions --------------------------------------------------------

  function addGoal({ title, target, unit, deadline }) {
    const clean = (title || '').trim();
    if (!clean) return;
    setState((s) => ({
      ...s,
      goals: [
        ...s.goals,
        {
          id: makeId(),
          title: clean,
          target: Number(target) || 0,
          current: 0,
          unit: (unit || '').trim(),
          deadline: deadline || null,
          createdAt: todayKey(),
          milestonesCelebrated: [],
          milestoneNotifyEnabled: false,
        },
      ],
    }));
  }

  function updateGoalProgress(goalId, current) {
    setState((s) => {
      const goal = s.goals.find((g) => g.id === goalId);
      const nextCurrent = Math.max(0, Number(current) || 0);

      // Detect thresholds newly crossed by *this* update (old current below
      // the threshold, new current at/above it) so we notify once per crossing
      // rather than on every subsequent +1/-1 around the same milestone.
      if (goal) {
        const before = getMilestoneStatus(goal);
        const after = getMilestoneStatus({ ...goal, current: nextCurrent });
        const newlyCrossed = after.reached.filter((t) => !before.reached.includes(t));

        const shouldNotify =
          newlyCrossed.length > 0 &&
          goal.milestoneNotifyEnabled &&
          s.settings.reminderEnabled;

        if (shouldNotify) {
          // Notify for each newly crossed threshold, oldest first. Fire-and-forget:
          // notify.js wraps this in try/catch and fails silently on its own.
          for (const percent of newlyCrossed) {
            sendMilestoneNotification(goal.title, percent);
          }
        }
      }

      return {
        ...s,
        goals: s.goals.map((g) =>
          g.id === goalId ? { ...g, current: nextCurrent } : g
        ),
      };
    });
  }

  function removeGoal(goalId) {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== goalId) }));
  }

  // Mark a milestone threshold as celebrated (one-way ratchet — never removed,
  // idempotent if already present). Called when the user dismisses the
  // celebration banner or its auto-dismiss timer fires.
  function acknowledgeMilestone(goalId, percent) {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) => {
        if (g.id !== goalId) return g;
        const celebrated = Array.isArray(g.milestonesCelebrated) ? g.milestonesCelebrated : [];
        if (celebrated.includes(percent)) return g; // already celebrated, no-op
        return { ...g, milestonesCelebrated: [...celebrated, percent] };
      }),
    }));
  }

  // Per-goal opt-in for milestone notifications. Does not itself schedule
  // anything — updateGoalProgress checks this flag when progress changes.
  function setGoalMilestoneNotify(goalId, enabled) {
    setState((s) => ({
      ...s,
      goals: s.goals.map((g) =>
        g.id === goalId ? { ...g, milestoneNotifyEnabled: !!enabled } : g
      ),
    }));
  }

  // --- Settings ------------------------------------------------------------

  function updateSettings(patch) {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }

  // Wipe everything back to defaults.
  function resetAll() {
    setState({ ...emptyState, settings: { ...emptyState.settings } });
  }

  // --- Derived values ------------------------------------------------------

  // Fraction (0..1) of today's tasks completed.
  function dayScore(day = todayKey()) {
    if (state.tasks.length === 0) return 0;
    const done = (state.completions[day] || []).length;
    return Math.min(1, done / state.tasks.length);
  }

  // Current streak: consecutive days (ending today) with at least one task done.
  function currentStreak() {
    if (state.tasks.length === 0) return 0;
    let streak = 0;
    const days = lastNDays(366).reverse(); // today first, going back
    for (const day of days) {
      const done = (state.completions[day] || []).length;
      if (done > 0) streak++;
      else break;
    }
    return streak;
  }

  // Longest streak ever (not just the one ending today): consecutive days,
  // anywhere in history, with at least one task done. Pure derivation over
  // state.completions — see src/utils/streaks.js for the walk itself.
  function longestStreak() {
    return computeLongestStreak(state.completions, state.tasks);
  }

  // Completion rate per weekday (Sun..Sat) over a recent rolling window
  // (default 90 days), independent of the Trend chart's 14-day window.
  // See src/utils/heat.js for the pure computation.
  function weekdayHeat(windowDays) {
    return computeWeekdayHeat(state.tasks, state.completions, windowDays);
  }

  const value = {
    ready,
    state,
    // task actions
    addTask,
    removeTask,
    toggleTask,
    isDone,
    // goal actions
    addGoal,
    updateGoalProgress,
    removeGoal,
    acknowledgeMilestone,
    setGoalMilestoneNotify,
    // settings
    updateSettings,
    resetAll,
    // derived
    dayScore,
    currentStreak,
    longestStreak,
    weekdayHeat,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
