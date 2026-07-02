// New-UI coverage for the Stats screen redesign: the second stat row
// (§5.1 — longest streak / week-over-week / goals on track) and the new
// "#3 WEEKDAY HEAT" section (§5.2 — 7 rows, SUN..SAT).

import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

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

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

import StatsScreen from '../StatsScreen';
import { AppProvider } from '../../context/AppContext';

function Harness() {
  return (
    <AppProvider>
      <StatsScreen />
    </AppProvider>
  );
}

describe('StatsScreen', () => {
  test('renders the new second stat row labels (longest streak / week over week / goals on track)', async () => {
    const { findByText } = await render(<Harness />);

    // These are the three new StatCards proposed in §5.1, directly below
    // the existing 14-day avg / perfect days / total check-ins row.
    expect(await findByText('Longest streak')).toBeTruthy();
    expect(await findByText('Week over week')).toBeTruthy();
    expect(await findByText('Goals on track')).toBeTruthy();
  });

  test('renders the existing first stat row alongside the new one', async () => {
    const { findByText } = await render(<Harness />);

    expect(await findByText('14-day avg')).toBeTruthy();
    expect(await findByText('Perfect days')).toBeTruthy();
    expect(await findByText('Total check-ins')).toBeTruthy();
  });

  test('renders a "#3 WEEKDAY HEAT" section with 7 rows labeled SUN..SAT', async () => {
    const { findByText } = await render(<Harness />);

    // SectionHeader renders "> #3  WEEKDAY HEAT" as one caption Text node
    // (index/label are concatenated JSX children, not separate nodes) plus
    // a separate title Text below it.
    expect(await findByText(/WEEKDAY HEAT/)).toBeTruthy();
    expect(await findByText('Completion by day of week')).toBeTruthy();

    // weekdayHeat() always returns exactly 7 entries, Sun through Sat.
    const labels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    for (const label of labels) {
      expect(await findByText(label)).toBeTruthy();
    }
  });
});
