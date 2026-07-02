// Settings: daily reminder toggle + time, and a reset option.
// Deliberately the quietest, art-free screen — "#1 REMINDERS" / "#2 DATA".

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
import {
  colors,
  spacing,
  radius,
  font,
  weight,
  tracking,
  fontFamily,
  border,
} from '../theme';
import { scheduleDailyReminder, cancelReminders } from '../utils/notify';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';

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
      <View style={styles.masthead}>
        <Text style={styles.kicker}>{'> SETTINGS'}</Text>
        <Text style={styles.h1}>Settings</Text>
        <Text style={styles.sub}>Reminders keep your streak alive.</Text>
      </View>

      <SectionHeader index={1} label="REMINDERS" />
      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Daily reminder</Text>
            <Text style={styles.hint}>A nudge to check in every day</Text>
          </View>
          <Switch
            value={reminderEnabled}
            onValueChange={toggleReminder}
            trackColor={{ false: colors.gray200, true: colors.white }}
            thumbColor={colors.black}
          />
        </View>

        <View style={styles.divider} />

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
      </Card>

      <SectionHeader index={2} label="DATA" />
      <Pressable
        style={styles.resetBtn}
        accessibilityHint="Permanently deletes all habits, goals, and history"
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
  masthead: { paddingTop: spacing.sm },
  kicker: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    fontWeight: weight.semibold,
    letterSpacing: tracking.label,
    color: colors.textMuted,
  },
  h1: {
    fontSize: font.h1,
    fontWeight: weight.h1,
    letterSpacing: tracking.h1,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  sub: { color: colors.textSecondary, fontSize: font.small, marginTop: spacing.xs, marginBottom: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: colors.textPrimary, fontSize: font.body, fontWeight: weight.semibold },
  hint: { color: colors.textSecondary, fontSize: font.small, marginTop: 2 },
  divider: {
    height: border.hairline,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  time: { fontFamily: fontFamily.mono, color: colors.textPrimary, fontSize: font.monoSmall, fontWeight: '700' },
  resetBtn: {
    marginTop: spacing.xl,
    borderWidth: border.thin,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  resetText: { color: colors.textPrimary, fontWeight: weight.bold },
  footer: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
