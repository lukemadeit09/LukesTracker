import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppProvider, useApp } from '../AppContext';

// Mock expo-notifications so no real scheduling / permission prompts happen.
// Platform.OS in the RN jest preset defaults to 'ios', so the Android-only
// setNotificationChannelAsync branch won't run, but we mock it anyway for safety.
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  setNotificationChannelAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => 'notif-id'),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DAILY: 'daily' },
}));

import * as Notifications from 'expo-notifications';

// Small harness that exposes the context value via a ref-like callback,
// since there's no dedicated test-only hook export.
let latestCtx = null;
function Harness() {
  latestCtx = useApp();
  return null;
}

// Renders the provider and waits for its initial async loadState() to
// resolve (ready === true) before returning, all inside `act` so React
// doesn't warn about the state updates from that effect landing outside
// an act() scope.
async function renderApp() {
  render(
    <AppProvider>
      <Harness />
    </AppProvider>
  );
  await waitFor(() => {
    expect(latestCtx.ready).toBe(true);
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
  latestCtx = null;
  jest.clearAllMocks();
});

describe('AppContext milestone flow', () => {
  test('updateGoalProgress crossing 25% then acknowledgeMilestone(25) clears pendingCelebration and persists the ack', async () => {
    await renderApp();

    await act(() => {
      latestCtx.addGoal({ title: 'Read 24 books', target: 100, unit: 'books' });
    });

    await waitFor(() => {
      expect(latestCtx.state.goals).toHaveLength(1);
    });
    const goalId = latestCtx.state.goals[0].id;

    // Cross the 25% threshold.
    await act(() => {
      latestCtx.updateGoalProgress(goalId, 25);
    });

    await waitFor(() => {
      const g = latestCtx.state.goals.find((x) => x.id === goalId);
      expect(g.current).toBe(25);
    });

    // Import lazily to compute pendingCelebration the same way the UI would.
    const { getMilestoneStatus } = require('../../utils/milestones');
    let goal = latestCtx.state.goals.find((x) => x.id === goalId);
    let status = getMilestoneStatus(goal);
    expect(status.pendingCelebration).toBe(25);

    // Acknowledge it.
    await act(() => {
      latestCtx.acknowledgeMilestone(goalId, 25);
    });

    await waitFor(() => {
      const g = latestCtx.state.goals.find((x) => x.id === goalId);
      expect(g.milestonesCelebrated).toContain(25);
    });

    goal = latestCtx.state.goals.find((x) => x.id === goalId);
    status = getMilestoneStatus(goal);
    expect(status.pendingCelebration).toBeNull();

    // Verify the ack was actually persisted to AsyncStorage (durability).
    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('lukestracker:v1');
      const saved = JSON.parse(raw);
      const savedGoal = saved.goals.find((g) => g.id === goalId);
      expect(savedGoal.milestonesCelebrated).toEqual([25]);
    });
  });

  test('acknowledgeMilestone is idempotent — acknowledging an already-celebrated percent is a no-op', async () => {
    await renderApp();

    await act(() => {
      latestCtx.addGoal({ title: 'Run a marathon', target: 40, unit: 'miles' });
    });
    await waitFor(() => expect(latestCtx.state.goals).toHaveLength(1));
    const goalId = latestCtx.state.goals[0].id;

    await act(() => {
      latestCtx.updateGoalProgress(goalId, 10); // 25%
    });
    await waitFor(() => {
      expect(latestCtx.state.goals.find((g) => g.id === goalId).current).toBe(10);
    });

    await act(() => {
      latestCtx.acknowledgeMilestone(goalId, 25);
    });
    await waitFor(() => {
      expect(
        latestCtx.state.goals.find((g) => g.id === goalId).milestonesCelebrated
      ).toEqual([25]);
    });

    await act(() => {
      latestCtx.acknowledgeMilestone(goalId, 25); // again
    });

    // Still just one entry, not duplicated.
    expect(
      latestCtx.state.goals.find((g) => g.id === goalId).milestonesCelebrated
    ).toEqual([25]);
  });

  describe('sendMilestoneNotification gating via updateGoalProgress', () => {
    async function setupGoal({ milestoneNotifyEnabled, reminderEnabled }) {
      await renderApp();

      if (reminderEnabled) {
        await act(() => {
          latestCtx.updateSettings({ reminderEnabled: true });
        });
        await waitFor(() => expect(latestCtx.state.settings.reminderEnabled).toBe(true));
      }

      await act(() => {
        latestCtx.addGoal({ title: 'Save $1000', target: 1000, unit: 'dollars' });
      });
      await waitFor(() => expect(latestCtx.state.goals).toHaveLength(1));
      const goalId = latestCtx.state.goals[0].id;

      if (milestoneNotifyEnabled) {
        await act(() => {
          latestCtx.setGoalMilestoneNotify(goalId, true);
        });
        await waitFor(() =>
          expect(
            latestCtx.state.goals.find((g) => g.id === goalId).milestoneNotifyEnabled
          ).toBe(true)
        );
      }

      return goalId;
    }

    test('does NOT notify when milestoneNotifyEnabled is true but global reminderEnabled is false', async () => {
      const goalId = await setupGoal({ milestoneNotifyEnabled: true, reminderEnabled: false });

      await act(() => {
        latestCtx.updateGoalProgress(goalId, 250); // crosses 25%
      });
      await waitFor(() => {
        expect(latestCtx.state.goals.find((g) => g.id === goalId).current).toBe(250);
      });

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    test('does NOT notify when global reminderEnabled is true but goal.milestoneNotifyEnabled is false', async () => {
      const goalId = await setupGoal({ milestoneNotifyEnabled: false, reminderEnabled: true });

      await act(() => {
        latestCtx.updateGoalProgress(goalId, 250);
      });
      await waitFor(() => {
        expect(latestCtx.state.goals.find((g) => g.id === goalId).current).toBe(250);
      });

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    test('notifies when BOTH goal.milestoneNotifyEnabled and settings.reminderEnabled are true, on a fresh crossing', async () => {
      const goalId = await setupGoal({ milestoneNotifyEnabled: true, reminderEnabled: true });

      await act(() => {
        latestCtx.updateGoalProgress(goalId, 250); // 0% -> 25%, a fresh crossing
      });

      await waitFor(() => {
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
      });
      const call = Notifications.scheduleNotificationAsync.mock.calls[0][0];
      expect(call.content.body).toMatch(/25%/);
      expect(call.trigger).toBeNull();
    });

    test('does NOT re-notify for a subsequent +1 update that stays past the same threshold', async () => {
      const goalId = await setupGoal({ milestoneNotifyEnabled: true, reminderEnabled: true });

      await act(() => {
        latestCtx.updateGoalProgress(goalId, 250); // crosses 25%
      });
      await waitFor(() => {
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
      });

      Notifications.scheduleNotificationAsync.mockClear();

      await act(() => {
        latestCtx.updateGoalProgress(goalId, 260); // still within the 25%-49% band, no new threshold
      });
      await waitFor(() => {
        expect(latestCtx.state.goals.find((g) => g.id === goalId).current).toBe(260);
      });

      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    test('notifies again on the next fresh crossing (e.g. 25% then later 50%)', async () => {
      const goalId = await setupGoal({ milestoneNotifyEnabled: true, reminderEnabled: true });

      await act(() => {
        latestCtx.updateGoalProgress(goalId, 250); // crosses 25%
      });
      await waitFor(() => {
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
      });

      await act(() => {
        latestCtx.updateGoalProgress(goalId, 500); // crosses 50%
      });
      await waitFor(() => {
        expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
      });
      const secondCall = Notifications.scheduleNotificationAsync.mock.calls[1][0];
      expect(secondCall.content.body).toMatch(/50%/);
    });
  });
});
