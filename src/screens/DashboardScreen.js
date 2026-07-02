// The home dashboard: greeting + motivation, overview stats,
// the daily activity grid, and today's tickable tasks.

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
import { colors, spacing, radius, font } from '../theme';
import { todayKey } from '../utils/dates';
import { messageForScore } from '../utils/messages';
import Checkbox from '../components/Checkbox';
import StatCard from '../components/StatCard';
import ContributionGrid from '../components/ContributionGrid';

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
        {/* Header */}
        <Text style={styles.brand}>LUKES TRACKER</Text>
        <Text style={styles.message}>{messageForScore(score, today)}</Text>

        {/* Overview stats */}
        <View style={styles.statRow}>
          <StatCard value={`🔥 ${streak}`} label="Day streak" accent />
          <StatCard
            value={tasks.length ? `${doneToday}/${tasks.length}` : '0'}
            label="Today's tasks"
          />
          <StatCard value={activeDays} label="Active days" />
        </View>

        {/* Today's progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(score * 100)}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {Math.round(score * 100)}% of today complete
        </Text>

        {/* Activity grid */}
        <Text style={styles.sectionTitle}>Daily activity</Text>
        <View style={styles.panel}>
          <ContributionGrid scoreFor={(key) => dayScore(key)} />
        </View>

        {/* Today's tasks */}
        <Text style={styles.sectionTitle}>Today's habits</Text>

        {tasks.length === 0 && (
          <Text style={styles.empty}>
            No habits yet. Add your first one below — something you want to do
            every day.
          </Text>
        )}

        {tasks.map((t) => (
          <Checkbox
            key={t.id}
            label={t.title}
            checked={isDone(t.id)}
            onToggle={() => toggleTask(t.id)}
            onLongPress={() => removeTask(t.id)}
          />
        ))}

        {tasks.length > 0 && (
          <Text style={styles.hint}>Long-press a habit to delete it.</Text>
        )}

        {/* Add task */}
        <View style={styles.addRow}>
          <TextInput
            style={styles.input}
            placeholder="New daily habit…"
            placeholderTextColor={colors.muted}
            value={newTask}
            onChangeText={setNewTask}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <Pressable
            style={({ pressed }) => [styles.addBtn, pressed && { opacity: 0.8 }]}
            onPress={handleAdd}
          >
            <Text style={styles.addBtnText}>＋</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  brand: {
    color: colors.text,
    fontSize: font.h1,
    fontWeight: '900',
    letterSpacing: 2,
  },
  message: { color: colors.accent, fontSize: font.body, marginTop: spacing.xs, marginBottom: spacing.lg },
  statRow: { flexDirection: 'row', marginHorizontal: -spacing.xs, marginBottom: spacing.md },
  progressTrack: {
    height: 10,
    backgroundColor: colors.secondary + '55',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
  progressLabel: { color: colors.muted, fontSize: font.small, marginTop: spacing.xs },
  sectionTitle: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: '700',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  panel: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  empty: { color: colors.muted, fontSize: font.body, lineHeight: 22, marginBottom: spacing.sm },
  hint: { color: colors.muted, fontSize: font.tiny, marginTop: spacing.xs, marginBottom: spacing.sm },
  addRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.body,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  addBtn: {
    width: 50,
    height: 50,
    marginLeft: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: { color: colors.text, fontSize: 26, fontWeight: '800', marginTop: -2 },
});
