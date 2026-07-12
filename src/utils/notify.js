// Local daily reminders via expo-notifications.
// Only local scheduling is used (no push servers), which works in Expo Go.
// expo-notifications does not support web: every entry point below no-ops
// there (the Settings UI explains reminders aren't available on web).

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { randomReminder } from './quotes';

const isWeb = Platform.OS === 'web';

// Show alerts even when the app is foregrounded.
if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function ensurePermission() {
  if (isWeb) return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

// Schedule a single repeating daily reminder at the given time.
// Returns true on success. Clears any previously scheduled reminders first.
export async function scheduleDailyReminder(hour, minute) {
  if (isWeb) return false;
  const ok = await ensurePermission();
  if (!ok) return false;

  await cancelReminders();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Daily reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Lukes Tracker',
      body: randomReminder(),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return true;
}

export async function cancelReminders() {
  if (isWeb) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Microcopy mirrors the in-app celebration banner (see docs/design/milestones.md).
const MILESTONE_COPY = {
  25: (title) => `Quarter way — 25% of ${title}`,
  50: (title) => `Halfway there — 50% of ${title}`,
  75: (title) => `Almost there — 75% of ${title}`,
  100: (title) => `Goal complete — ${title} \u{1F3AF}`, // target emoji, the one exception
};

// Fire an immediate local notification when a goal crosses a milestone.
// Event-triggered (trigger: null), unlike the daily-repeating reminder.
// Caller (AppContext) is responsible for gating on
// `goal.milestoneNotifyEnabled && settings.reminderEnabled` and on only
// calling this for newly-crossed thresholds. Fails silently on any error,
// including missing permission, so a goal card never surfaces a permission
// prompt (that belongs to the Settings flow only).
export async function sendMilestoneNotification(goalTitle, percent) {
  if (isWeb) return false;
  try {
    const ok = await ensurePermission();
    if (!ok) return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Daily reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const copy = MILESTONE_COPY[percent];
    const body = copy ? copy(goalTitle) : `${percent}% of ${goalTitle}`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lukes Tracker',
        body,
      },
      trigger: null, // fire immediately
    });
    return true;
  } catch (e) {
    // Fail silently — the in-app banner is the guaranteed fallback.
    return false;
  }
}
