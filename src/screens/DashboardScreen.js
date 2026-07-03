// Home: the daily message as hero over Dore's Paradiso rose (blood red),
// quote of the day, stats, animated day progress, grid, habits.

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
      {/* Blood-red Paradiso rose; tint is baked dark, so opacity runs higher. */}
      <ArtBackdrop source="paradisoRed" min={0.5} max={0.7} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Masthead: the day's message is the hero */}
          <FadeRise order={0}>
            <Text style={styles.message}>{messageForScore(score, today)}</Text>
          </FadeRise>

          {/* Today stats */}
          <FadeRise order={1}>
            <SectionHeader />
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

          {/* Quote of the day */}
          <FadeRise order={2}>
            <View style={styles.quoteSpacer} />
            <QuoteCard />
          </FadeRise>

          {/* Activity grid */}
          <FadeRise order={3}>
            <SectionHeader />
            <Card style={styles.gridCard}>
              <ContributionGrid scoreFor={(key) => dayScore(key)} />
              {activeDays === 0 && (
                <Text style={styles.gridEmpty}>
                  Your activity will appear here once you complete a habit.
                </Text>
              )}
            </Card>
          </FadeRise>

          {/* Habits */}
          <FadeRise order={4}>
            <SectionHeader />

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
  // With the brand kicker and TODAY heading gone, the daily message
  // carries the masthead role at display weight.
  message: {
    fontFamily: fontFamily.display,
    fontSize: font.h1,
    letterSpacing: tracking.h1,
    lineHeight: 38,
    color: colors.textPrimary,
    marginTop: spacing.sm,
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
