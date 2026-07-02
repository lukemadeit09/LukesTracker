// Settings: daily reminder toggle + time, and a reset option, over the Doré
// engraving — the quietest screen. Sections: // 01 REMINDERS  // 02 DATA
// Accent budget: red only (destructive reset).

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
import { colors, spacing, radius, font, tracking, fontFamily, border } from '../theme';
import { scheduleDailyReminder, cancelReminders } from '../utils/notify';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import FadeRise from '../components/FadeRise';
import ArtBackdrop from '../components/art/ArtBackdrop';

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
    <View style={styles.screen}>
      <ArtBackdrop source="dore" />

      <ScrollView contentContainerStyle={styles.content}>
        <FadeRise order={0}>
          <Text style={styles.kicker}>{'// LUKES TRACKER'}</Text>
          <Text style={styles.masthead}>SETTINGS</Text>
          <Text style={styles.sub}>Reminders keep your streak alive.</Text>
        </FadeRise>

        {/* // 01 REMINDERS */}
        <FadeRise order={1}>
          <SectionHeader index={1} label="REMINDERS" />
          <Card style={styles.panel}>
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
        </FadeRise>

        {/* // 02 DATA */}
        <FadeRise order={2}>
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
            <Text style={styles.resetText}>RESET ALL DATA</Text>
          </Pressable>

          <Text style={styles.footer}>
            {'// LUKES TRACKER — ALL DATA STAYS ON YOUR DEVICE'}
          </Text>
        </FadeRise>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },
  kicker: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  masthead: {
    fontFamily: fontFamily.display,
    fontSize: font.display,
    letterSpacing: tracking.display,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  sub: {
    fontFamily: fontFamily.sans,
    color: colors.textSecondary,
    fontSize: font.small,
    marginTop: spacing.xs,
  },
  panel: { marginTop: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: fontFamily.sans, color: colors.textPrimary, fontSize: font.body },
  hint: { fontFamily: fontFamily.sans, color: colors.textSecondary, fontSize: font.small, marginTop: 2 },
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
  time: { fontFamily: fontFamily.monoBold, color: colors.textPrimary, fontSize: font.monoSmall },
  // Red = urgent: the only accent on this screen, for the destructive action.
  resetBtn: {
    marginTop: spacing.md,
    borderWidth: border.thin,
    borderColor: colors.red,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  resetText: {
    fontFamily: fontFamily.monoBold,
    fontSize: font.monoSmall,
    letterSpacing: tracking.label,
    color: colors.white,
  },
  footer: {
    fontFamily: fontFamily.mono,
    fontSize: 9,
    letterSpacing: tracking.label,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
