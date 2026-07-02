import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Avoid touching the real notification module during a component render test.
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

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';
import GoalCard from '../GoalCard';
import { AppProvider, useApp } from '../../context/AppContext';

// GoalCard schedules a 6s auto-dismiss timer for the celebration banner
// unless a screen reader is detected. Rather than dealing with a real
// 6-second timer outliving the test (flaky + slow), we simulate the
// screen-reader-active branch so no timer is ever scheduled — this also
// happens to cover a real accessibility code path.
jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockResolvedValue(true);

const STORE_KEY = 'lukestracker:v1';

function seededGoal(overrides = {}) {
  return {
    id: 'goal-1',
    title: 'Read 24 books',
    target: 100,
    current: 25, // exactly at the 25% threshold -> reached, uncelebrated
    unit: 'books',
    deadline: null,
    createdAt: '2026-06-01',
    milestonesCelebrated: [],
    milestoneNotifyEnabled: false,
    ...overrides,
  };
}

async function seedState(goal) {
  await AsyncStorage.setItem(
    STORE_KEY,
    JSON.stringify({
      tasks: [],
      completions: {},
      goals: [goal],
      settings: { reminderEnabled: false, reminderHour: 20, reminderMinute: 0 },
    })
  );
}

// Wrapper that renders the real AppProvider (so GoalCard's internal useApp()
// call works) and always displays the *current* goal from context state
// rather than a stale prop, so the banner disappears after dismissal.
function Harness({ goalId }) {
  return (
    <AppProvider>
      <ConnectedCard goalId={goalId} />
    </AppProvider>
  );
}

function ConnectedCard({ goalId }) {
  const { state, ready, updateGoalProgress, removeGoal } = useApp();
  if (!ready) return null;
  const goal = state.goals.find((g) => g.id === goalId);
  if (!goal) return null;
  return (
    <GoalCard
      goal={goal}
      onChange={(next) => updateGoalProgress(goal.id, next)}
      onRemove={() => removeGoal(goal.id)}
    />
  );
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('GoalCard celebration banner', () => {
  test('renders the celebration banner text when the goal has a pendingCelebration', async () => {
    await seedState(seededGoal({ current: 25 })); // exactly 25%, not yet celebrated

    const { findByText } = await render(<Harness goalId="goal-1" />);

    const banner = await findByText('Quarter way — 25% of Read 24 books');
    expect(banner).toBeTruthy();
  });

  test('does not render the banner (shows the normal milestone row instead) when nothing is pending', async () => {
    await seedState(seededGoal({ current: 10 })); // 10% - below any threshold

    const { findByText, queryByText } = await render(<Harness goalId="goal-1" />);

    await findByText(/Next milestone: 25%/);
    expect(queryByText(/Quarter way/)).toBeNull();
  });

  test('pressing the dismiss ✕ acknowledges the milestone and the banner disappears', async () => {
    await seedState(seededGoal({ current: 25 }));

    const { findByText, findByLabelText, queryByText } = await render(<Harness goalId="goal-1" />);

    await findByText('Quarter way — 25% of Read 24 books');

    const dismissBtn = await findByLabelText('Dismiss milestone celebration');
    await act(async () => {
      fireEvent.press(dismissBtn);
    });

    await waitFor(() => {
      expect(queryByText('Quarter way — 25% of Read 24 books')).toBeNull();
    });

    // Milestone row should now show the *next* uncelebrated/unreached threshold.
    await findByText(/Next milestone: 50%/);

    // And the ack should be durably persisted.
    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      const saved = JSON.parse(raw);
      expect(saved.goals[0].milestonesCelebrated).toEqual([25]);
    });
  });
});
