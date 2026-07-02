// Home: huge TODAY masthead over the Flammarion engraving (blue variant),
// quote of the day, stat row, animated day progress, activity grid, habits.
// Sections: // 01 TODAY  // 02 QUOTE  // 03 ACTIVITY  // 04 HABITS
// Accent budget on this screen: blue (activity) + greenBright (all done).

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font, tracking, fontFamily, border } from '../theme';
import { todayKey } from '../utils/dates';
import { messageForScore } from '../utils/quotes';
import Checkbox from '../components/Checkbox';
import StatCard from '../components/StatCard';
import ContributionGrid from '../components/ContributionGrid';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import QuoteCard from '../components/QuoteCard';
import FadeRise from '../components/FadeRise';
import ProgressBar from '../components/ProgressBar';
import ArtBackdrop from '../components/art/ArtBackdrop';

export default function DashboardScreen() {
  const {
    state,
    addTask,
    removeTask,
    toggleTask,
    isDone,
    dayScore,
    currentStreak,
  } = useApp();

  const [newTask, setNewTask] = useState('');
  const today = todayKey();

  const tasks = state.tasks;
  const doneToday = (state.completions[today] || []).filter((id) =>
    tasks.some((t) => t.id === id)
  ).length;
  const score = dayScore();
  const streak = currentStreak();
  const activeDays = Object.values(state.completions).filter(
    (ids) => ids.length > 0
  ).length;
  const allDoneToday = tasks.length > 0 && doneToday === tasks.length;

  function handleAdd() {
    addTask(newTask);
    setNewTask('');
  }

  return (
    <View style={styles.screen}>
      <ArtBackdrop source="flammarionBlue" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Masthead */}
          <FadeRise order={0}>
            <Text style={styles.kicker}>{'// LUKES TRACKER'}</Text>
            <Text style={styles.masthead}>TODAY</Text>
            <Text style={styles.message}>{messageForScore(score, today)}</Text>
          </FadeRise>

          {/* // 01 TODAY */}
          <FadeRise order={1}>
            <SectionHeader index={1} label="TODAY" />
            <View style={styles.statRow}>
              <StatCard value={streak} label="Day streak" emphasized />
              <StatCard
                value={tasks.length ? `${doneToday}/${tasks.length}` : '0'}
                label="Today's tasks"
                emphasized={allDoneToday}
                tone={allDoneToday ? colors.greenBright : undefined}
              />
              <StatCard value={activeDays} label="Active days" />
            </View>

            <View style={styles.progressWrap}>
              <ProgressBar value={score} />
              <Text style={styles.progressLabel}>
                {allDoneToday ? (
                  <Text style={styles.progressDone}>ALL DONE — PERFECT DAY</Text>
                ) : (
                  `${Math.round(score * 100)}% OF TODAY COMPLETE`
                )}
              </Text>
            </View>
          </FadeRise>

          {/* // 02 QUOTE — the card carries its own "// QUOTE OF THE DAY" caption */}
          <FadeRise order={2}>
            <View style={styles.quoteSpacer} />
            <QuoteCard index={2} />
          </FadeRise>

          {/* // 03 ACTIVITY */}
          <FadeRise order={3}>
            <SectionHeader index={3} label="ACTIVITY" />
            <Card style={styles.gridCard}>
              <ContributionGrid scoreFor={(key) => dayScore(key)} />
              {activeDays === 0 && (
                <Text style={styles.gridEmpty}>
                  Your activity will appear here once you complete a habit.
                </Text>
              )}
            </Card>
          </FadeRise>

          {/* // 04 HABITS */}
          <FadeRise order={4}>
            <SectionHeader index={4} label="HABITS" />

            {tasks.length === 0 ? (
              <Card style={styles.emptyCard}>
                <View style={styles.emptyMark} />
                <View style={styles.emptyTextWrap}>
                  <Text style={styles.emptyHeading}>NO HABITS YET</Text>
                  <Text style={styles.emptyBody}>
                    Add something you want to do every day — reading, training,
                    deep work. Small and repeatable beats big and occasional.
                  </Text>
                </View>
              </Card>
            ) : (
              <Card style={styles.habitsCard}>
                {tasks.map((t) => (
                  <Checkbox
                    key={t.id}
                    label={t.title}
                    checked={isDone(t.id)}
                    onToggle={() => toggleTask(t.id)}
                    onLongPress={() => removeTask(t.id)}
                  />
                ))}
              </Card>
            )}

            {tasks.length > 0 && (
              <Text style={styles.hint}>{'// LONG-PRESS A HABIT TO DELETE IT'}</Text>
            )}

            {/* Add task */}
            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                placeholder="New daily habit…"
                placeholderTextColor={colors.textDisabled}
                value={newTask}
                onChangeText={setNewTask}
                onSubmitEditing={handleAdd}
                returnKeyType="done"
              />
              <Pressable
                style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
                onPress={handleAdd}
              >
                {({ pressed }) => (
                  <Text style={[styles.addBtnText, pressed && styles.addBtnTextPressed]}>
                    +
                  </Text>
                )}
              </Pressable>
            </View>
          </FadeRise>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // Bottom padding clears the floating dock.
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
  message: {
    fontFamily: fontFamily.displayMed,
    fontSize: font.h2,
    lineHeight: 26,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statRow: { flexDirection: 'row', marginTop: spacing.md, marginLeft: -spacing.xs },
  progressWrap: { marginTop: spacing.md },
  progressLabel: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  progressDone: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    color: colors.greenBright,
  },
  quoteSpacer: { height: spacing.lg },
  gridCard: { marginTop: spacing.md },
  gridEmpty: {
    fontFamily: fontFamily.sans,
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  habitsCard: { marginTop: spacing.md, padding: 0, overflow: 'hidden' },
  emptyCard: { marginTop: spacing.md, flexDirection: 'row', alignItems: 'flex-start' },
  emptyMark: {
    width: 22,
    height: 22,
    borderWidth: border.thick,
    borderColor: colors.gray300,
    marginRight: spacing.md,
    marginTop: 2,
  },
  emptyTextWrap: { flex: 1 },
  emptyHeading: {
    fontFamily: fontFamily.display,
    fontSize: font.h2 - 2,
    color: colors.textPrimary,
  },
  emptyBody: {
    fontFamily: fontFamily.sans,
    fontSize: font.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  hint: {
    fontFamily: fontFamily.mono,
    fontSize: 9,
    letterSpacing: tracking.label,
    color: colors.textDisabled,
    marginTop: spacing.sm,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceSolid,
    color: colors.textPrimary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.sans,
    fontSize: font.body,
    borderWidth: border.thin,
    borderColor: colors.border,
  },
  addBtn: {
    width: 50,
    height: 50,
    marginLeft: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressed: { backgroundColor: colors.gray600 },
  addBtnText: { color: colors.black, fontSize: 26, fontFamily: fontFamily.monoBold, marginTop: -2 },
  addBtnTextPressed: { color: colors.black },
});
