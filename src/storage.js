// Local persistence on the device via AsyncStorage.
// Everything the app knows lives under a single key as JSON.

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_KEY = 'lukestracker:v1';

// Shape of all saved data. Kept flat and simple so it's easy to extend.
export const emptyState = {
  tasks: [],        // [{ id, title, createdAt }]  daily habits/tasks
  completions: {},  // { 'YYYY-MM-DD': [taskId, ...] }  which tasks done that day
  goals: [],        // [{ id, title, target, current, unit, deadline, createdAt,
                    //    milestonesCelebrated, milestoneNotifyEnabled }]
  settings: {       // app preferences
    reminderEnabled: false,
    reminderHour: 20, // 8pm default
    reminderMinute: 0,
    artEnabled: true, // background engravings on/off (Settings > Appearance)
  },
};

export async function loadState() {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (!raw) return { ...emptyState };
    const parsed = JSON.parse(raw);
    // Merge so missing keys (from older versions) get sensible defaults.
    return {
      ...emptyState,
      ...parsed,
      settings: { ...emptyState.settings, ...(parsed.settings || {}) },
      // Goals are items in an array, not top-level keys, so they need their
      // own per-goal backfill for fields added after a goal was first saved.
      goals: (parsed.goals || []).map((g) => ({
        milestonesCelebrated: [],
        milestoneNotifyEnabled: false,
        ...g,
      })),
    };
  } catch (e) {
    console.warn('Failed to load state, starting fresh:', e);
    return { ...emptyState };
  }
}

export async function saveState(state) {
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}
