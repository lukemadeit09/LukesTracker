// Regression test: the activity grid must survive a tab round-trip.
//
// Bug history: ContributionGrid used a static contentOffset={{ x: 9999 }} to
// start scrolled to the newest weeks. On remount (our tab bar unmounts the
// inactive screen), that out-of-range offset was applied unclamped, parking
// the viewport thousands of px past the ~330px-wide content — the grid
// looked empty even though every square was still rendered. The fix scrolls
// via scrollToEnd() in onContentSizeChange, which clamps correctly.

import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Native modules pulled in transitively by App's screens.
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

import App from '../../../App';

describe('activity grid across tab switches', () => {
  it('still renders all day squares after leaving Home and coming back', async () => {
    render(<App />);

    // Wait out the provider's async loadState().
    await waitFor(() => screen.getAllByTestId('grid-square'));
    const initialCount = screen.getAllByTestId('grid-square').length;
    expect(initialCount).toBeGreaterThanOrEqual(7 * 18); // ~4 months of days

    // Home -> Goals (grid unmounts) -> Home (grid remounts).
    await act(async () => fireEvent.press(screen.getByText('Goals')));
    expect(screen.queryAllByTestId('grid-square')).toHaveLength(0);
    await act(async () => fireEvent.press(screen.getByText('Home')));

    // The grid must come back fully populated.
    expect(screen.getAllByTestId('grid-square')).toHaveLength(initialCount);

    // Guard the root cause on the remounted grid: a hardcoded out-of-range
    // contentOffset parks the remounted viewport past the content. It must
    // stay absent, and the snap-to-latest behavior must instead run via
    // onContentSizeChange without throwing once content is measured.
    const scroll = screen.getByTestId('activity-grid-scroll');
    expect(scroll.props.contentOffset).toBeUndefined();
    expect(typeof scroll.props.onContentSizeChange).toBe('function');
    act(() => scroll.props.onContentSizeChange(330, 120));
  });
});
