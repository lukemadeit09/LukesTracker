// Settings — the most polished screen: grouped section cards led by colored
// icon tiles (the one sanctioned decorative use of color — 28px chips, not
// surfaces), over the blue Flammarion riso at higher prominence (15-18%).

import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  ScrollView,
  Alert,
  Share,
  StyleSheet,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Constants from 'expo-constants';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font, tracking, fontFamily, border } from '../theme';
import { scheduleDailyReminder, cancelReminders } from '../utils/notify';
import IconTile from '../components/IconTile';
import FadeRise from '../components/FadeRise';
import ArtBackdrop from '../components/art/ArtBackdrop';

function fmtTime(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

// One settings group: colored icon tile + title row, then children rows.
function Section({ icon, color, title, danger, children }) {
  return (
    <View style={[styles.section, danger && styles.sectionDanger]}>
      <View style={styles.sectionHead}>
        <IconTile icon={icon} color={color} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

// A single row: label left, value/control right. `last` drops the divider.
function Row({ label, hint, right, onPress, disabled, last, accessibilityHint }) {
  const Body = (
    <>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {right}
    </>
  );
  const rowStyle = [styles.row, !last && styles.rowDivider, disabled && { opacity: 0.4 }];
  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [...rowStyle, pressed && { opacity: 0.6 }]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityHint={accessibilityHint}
      >
        {Body}
      </Pressable>
    );
  }
  return <View style={rowStyle}>{Body}</View>;
}

export default function SettingsScreen() {
  const { state, updateSettings, resetAll } = useApp();
  const { reminderEnabled, reminderHour, reminderMinute, artEnabled } = state.settings;
  const [showPicker, setShowPicker] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';
  const storageKB = Math.max(1, Math.round(JSON.stringify(state).length / 1024));
  const activeDays = Object.values(state.completions).filter((ids) => ids.length > 0).length;

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

  async function exportData() {
    try {
      await Share.share({
        title: 'Lukes Tracker data',
        message: JSON.stringify(state, null, 2),
      });
    } catch (e) {
      // Share sheet unavailable (e.g. web) — nothing to do, data stays local.
    }
  }

  const switchColors = {
    trackColor: { false: colors.gray200, true: colors.white },
    thumbColor: colors.black,
  };

  return (
    <View style={styles.screen}>
      {/* More prominent than other screens, per spec — cards keep it readable. */}
      <ArtBackdrop source="flammarionBlue" min={0.15} max={0.18} />

      <ScrollView contentContainerStyle={styles.content}>
        <FadeRise order={0}>
          <Text style={styles.masthead}>SETTINGS</Text>
          <Text style={styles.sub}>Reminders keep your streak alive.</Text>
        </FadeRise>

        {/* Reminders */}
        <FadeRise order={1}>
          <Section icon="bell" color={colors.blue} title="Reminders">
            <Row
              label="Daily reminder"
              hint="A nudge to check in every day"
              right={
                <Switch value={reminderEnabled} onValueChange={toggleReminder} {...switchColors} />
              }
            />
            <Row
              label="Reminder time"
              disabled={!reminderEnabled}
              onPress={() => setShowPicker(true)}
              right={<Text style={styles.rowValue}>{fmtTime(reminderHour, reminderMinute)}</Text>}
              last
            />
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
          </Section>
        </FadeRise>

        {/* Appearance */}
        <FadeRise order={2}>
          <Section icon="palette" color={colors.purple} title="Appearance">
            <Row label="Theme" right={<Text style={styles.rowValue}>BLACK & WHITE</Text>} />
            <Row
              label="Background art"
              hint="Engravings behind each screen"
              right={
                <Switch
                  value={artEnabled !== false}
                  onValueChange={(v) => updateSettings({ artEnabled: v })}
                  {...switchColors}
                />
              }
              last
            />
          </Section>
        </FadeRise>

        {/* Data */}
        <FadeRise order={3}>
          <Section icon="database" color={colors.green} title="Data">
            <Row
              label="Export data"
              hint="Share everything as JSON"
              onPress={exportData}
              right={<Text style={styles.rowValue}>{'>'}</Text>}
            />
            <Row label="Storage used" right={<Text style={styles.rowValue}>{storageKB} KB</Text>} />
            <Row label="Active days" right={<Text style={styles.rowValue}>{activeDays}</Text>} last />
          </Section>
        </FadeRise>

        {/* Danger zone */}
        <FadeRise order={4}>
          <Section icon="alert" color={colors.red} title="Danger zone" danger>
            <Row
              label="Reset all data"
              hint="Permanently clears habits, goals and history"
              accessibilityHint="Permanently deletes all habits, goals, and history"
              onPress={() =>
                Alert.alert(
                  'Reset all data?',
                  'This permanently clears habits, goals and history.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Reset',
                      style: 'destructive',
                      onPress: () => {
                        cancelReminders();
                        resetAll();
                      },
                    },
                  ]
                )
              }
              right={<Text style={styles.rowValue}>{'>'}</Text>}
              last
            />
          </Section>
        </FadeRise>

        <FadeRise order={5}>
          <Text style={styles.footer}>{`// LUKES TRACKER v${version}`}</Text>
          <Text style={styles.footer}>{'// ALL DATA STAYS ON THIS DEVICE'}</Text>
        </FadeRise>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 120 },
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
  section: {
    backgroundColor: colors.surface,
    borderWidth: border.thin,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    // Captions used to space the groups; the cards carry the rhythm now.
    marginTop: spacing.lg,
  },
  // Red hairline on the danger card only.
  sectionDanger: { borderColor: colors.red },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontFamily: fontFamily.display,
    fontSize: font.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.textPrimary,
    marginLeft: spacing.sm + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  rowDivider: {
    borderBottomWidth: border.hairline,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, marginRight: spacing.md },
  rowLabel: { fontFamily: fontFamily.sans, color: colors.textPrimary, fontSize: font.body },
  rowHint: {
    fontFamily: fontFamily.sans,
    color: colors.textMuted,
    fontSize: font.tiny,
    marginTop: 2,
  },
  rowValue: {
    fontFamily: fontFamily.mono,
    color: colors.textMuted,
    fontSize: font.monoSmall,
    letterSpacing: 0.5,
  },
  footer: {
    fontFamily: fontFamily.mono,
    fontSize: 9,
    letterSpacing: tracking.label,
    color: colors.textDisabled,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
