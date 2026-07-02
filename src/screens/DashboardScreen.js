// The home dashboard: hero message + streak, activity grid, and today's
// tickable tasks. First screen on launch — "#1 TODAY" / "#2 ACTIVITY" /
// "#3 HABITS", numbered per-screen starting at 1.

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
import { todayKey } from '../utils/dates';
import { messageForScore } from '../utils/messages';
import Checkbox from '../components/Checkbox';
import StatCard from '../components/StatCard';
import ContributionGrid from '../components/ContributionGrid';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import RadiatingLines from '../components/art/RadiatingLines';

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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <RadiatingLines />
          <Text style={styles.kicker}>{'> LUKES TRACKER'}</Text>
          <Text style={styles.message}>{messageForScore(score, today)}</Text>
        </View>

        {/* #1 TODAY */}
        <SectionHeader index={1} label="TODAY" />

        <View style={styles.statRow}>
          <StatCard value={streak} label="Day streak" emphasized />
          <StatCard
            value={tasks.length ? `${doneToday}/${tasks.length}` : '0'}
            label="Today's tasks"
            emphasized={allDoneToday}
          />
          <StatCard value={activeDays} label="Active days" />
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(score * 100)}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {Math.round(score * 100)}% of today complete
        </Text>

        {/* #2 ACTIVITY */}
        <SectionHeader index={2} label="ACTIVITY" title="Daily activity" />
        <Card style={styles.gridCard}>
          <ContributionGrid scoreFor={(key) => dayScore(key)} />
          {activeDays === 0 && (
            <Text style={styles.gridEmpty}>
              Your activity will appear here once you complete a habit.
            </Text>
          )}
        </Card>

        {/* #3 HABITS */}
        <SectionHeader index={3} label="HABITS" title="Today's habits" />

        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyMark} />
            <View style={styles.emptyTextWrap}>
              <Text style={styles.emptyHeading}>No habits yet</Text>
              <Text style={styles.emptyBody}>
                Add something you want to do every day — reading, training, deep
                work. Small and repeatable beats big and occasional.
              </Text>
            </View>
          </View>
        ) : (
          <Card style={styles.habitsCard}>
            {tasks.map((t, i) => (
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
          <Text style={styles.hint}>Long-press a habit to delete it.</Text>
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
              <Text style={[styles.addBtnText, pressed && styles.addBtnTextPressed]}>+</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  hero: { position: 'relative', paddingTop: spacing.sm, paddingBottom: spacing.md },
  kicker: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    fontWeight: weight.semibold,
    letterSpacing: tracking.label,
    color: colors.textMuted,
  },
  message: {
    fontSize: font.h1,
    fontWeight: weight.h1,
    letterSpacing: tracking.h1,
    lineHeight: 38,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  statRow: { flexDirection: 'row', marginTop: spacing.md, marginBottom: spacing.md },
  progressTrack: {
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.white, borderRadius: radius.pill },
  progressLabel: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  gridCard: { marginTop: spacing.md },
  gridEmpty: {
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  habitsCard: { marginTop: spacing.md, padding: 0 },
  emptyState: {
    flexDirection: 'row',
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  emptyMark: {
    width: 24,
    height: 24,
    borderWidth: border.thin,
    borderColor: colors.gray300,
    marginRight: spacing.md,
    marginTop: 2,
  },
  emptyTextWrap: { flex: 1 },
  emptyHeading: {
    fontSize: font.h2,
    fontWeight: weight.h2,
    color: colors.textPrimary,
  },
  emptyBody: {
    fontSize: font.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  hint: {
    fontSize: font.tiny,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.body,
    borderWidth: border.thin,
    borderColor: colors.border,
  },
  addBtn: {
    width: 50,
    height: 50,
    marginLeft: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: border.thick,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnPressed: { backgroundColor: colors.white },
  addBtnText: { color: colors.white, fontSize: 26, fontWeight: '800', marginTop: -2 },
  addBtnTextPressed: { color: colors.black },
});
