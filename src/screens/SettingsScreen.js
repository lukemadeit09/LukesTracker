// Settings: daily reminder toggle + time, and a reset option.

import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme';
import { scheduleDailyReminder, cancelReminders } from '../utils/notify';

function fmtTime(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function SettingsScreen() {
  const { state, updateSettings, resetAll } = useApp();
  const { reminderEnabled, reminderHour, reminderMinute } = state.settings;
  const [showPicker, setShowPicker] = useState(false);

  async function toggleReminder(value) {
    if (value) {
      const ok = await scheduleDailyReminder(reminderHour, reminderMinute);
      if (!ok) {
        Alert.alert(
          'Notifications off',
          'Enable notifications for Lukes Tracker in your phone settings to get reminders.'
        );
        return;
      }
    } else {
      await cancelReminders();
    }
    updateSettings({ reminderEnabled: value });
  }

  async function changeTime(date) {
    const h = date.getHours();
    const m = date.getMinutes();
    updateSettings({ reminderHour: h, reminderMinute: m });
    if (reminderEnabled) await scheduleDailyReminder(h, m);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Settings</Text>
      <Text style={styles.sub}>Reminders keep your streak alive.</Text>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Daily reminder</Text>
            <Text style={styles.hint}>A nudge to check in every day</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={toggleReminder}
            trackColor={{ false: colors.secondary, true: colors.accent }}
            thumbColor={colors.text}
          />
        </View>

        <Pressable
          style={[styles.timeRow, !reminderEnabled && { opacity: 0.4 }]}
          disabled={!reminderEnabled}
          onPress={() => setShowPicker(true)}
        >
          <Text style={styles.label}>Reminder time</Text>
          <Text style={styles.time}>{fmtTime(reminderHour, reminderMinute)}</Text>
        </Pressable>

        {showPicker && (
          <DateTimePicker
            value={new Date(2020, 0, 1, reminderHour, reminderMinute)}
            mode="time"
            themeVariant="dark"
            onChange={(event, selected) => {
              setShowPicker(Platform.OS === 'ios');
              if (event.type !== 'dismissed' && selected) changeTime(selected);
            }}
          />
        )}
      </View>

      <Pressable
        style={styles.resetBtn}
        onPress={() =>
          Alert.alert('Reset all data?', 'This permanently clears habits, goals and history.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reset',
              style: 'destructive',
              onPress: () => {
                cancelReminders();
                resetAll();
              },
            },
          ])
        }
      >
        <Text style={styles.resetText}>Reset all data</Text>
      </Pressable>

      <Text style={styles.footer}>Lukes Tracker · all data stays on your device</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  h1: { color: colors.text, fontSize: font.h1, fontWeight: '900', letterSpacing: 1 },
  sub: { color: colors.muted, fontSize: font.small, marginTop: 2, marginBottom: spacing.lg },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: colors.text, fontSize: font.body, fontWeight: '600' },
  hint: { color: colors.muted, fontSize: font.small, marginTop: 2 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.secondary + '55',
  },
  time: { color: colors.accent, fontSize: font.body, fontWeight: '800' },
  resetBtn: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: '#e25c5c88',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  resetText: { color: '#e25c5c', fontWeight: '700' },
  footer: { color: colors.muted, fontSize: font.tiny, textAlign: 'center', marginTop: spacing.xl },
});
