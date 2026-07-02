// Goals screen: create any goal (target + unit + deadline) and track it.
// "#1 IN PROGRESS" / "#2 NEW GOAL", numbered per-screen starting at 1.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
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
import { dayKey } from '../utils/dates';
import GoalCard from '../components/GoalCard';
import SectionHeader from '../components/SectionHeader';
import Orbits from '../components/art/Orbits';

export default function GoalsScreen() {
  const { state, addGoal, updateGoalProgress, removeGoal } = useApp();

  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('');
  const [deadline, setDeadline] = useState(null); // Date | null
  const [showPicker, setShowPicker] = useState(false);
  const [open, setOpen] = useState(false); // show/hide the add form

  function reset() {
    setTitle('');
    setTarget('');
    setUnit('');
    setDeadline(null);
    setOpen(false);
  }

  function handleCreate() {
    if (!title.trim()) return;
    addGoal({
      title,
      target,
      unit,
      deadline: deadline ? dayKey(deadline) : null,
    });
    reset();
  }

  const hasGoals = state.goals.length > 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.masthead}>
        <Orbits />
        <Text style={styles.kicker}>{'> GOALS'}</Text>
        <Text style={styles.h1}>Goals</Text>
        <Text style={styles.sub}>Set a target, pick a deadline, track your pace.</Text>
      </View>

      {hasGoals && <SectionHeader index={1} label="IN PROGRESS" />}

      {!hasGoals && !open && (
        <View style={styles.emptyState}>
          <Orbits variant="empty" />
          <Text style={styles.emptyHeading}>No goals yet</Text>
          <Text style={styles.emptyBody}>
            Create your first goal — a number, a unit, and optionally a
            deadline. Read 24 books. Run 100 km. Save $5,000.
          </Text>
        </View>
      )}

      <View style={styles.goalsList}>
        {state.goals.map((g) => (
          <GoalCard
            key={g.id}
            goal={g}
            onChange={(v) => updateGoalProgress(g.id, v)}
            onRemove={() => removeGoal(g.id)}
          />
        ))}
      </View>

      {/* Add form */}
      {open ? (
        <>
          <SectionHeader index={hasGoals ? 2 : 1} label="NEW GOAL" />
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Goal name (e.g. Read 24 books)"
              placeholderTextColor={colors.textDisabled}
              value={title}
              onChangeText={setTitle}
            />

            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: spacing.sm }]}
                placeholder="Target (e.g. 24)"
                placeholderTextColor={colors.textDisabled}
                keyboardType="numeric"
                value={target}
                onChangeText={setTarget}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Unit (books)"
                placeholderTextColor={colors.textDisabled}
                value={unit}
                onChangeText={setUnit}
              />
            </View>

            <Pressable
              style={styles.dateBtn}
              onPress={() => setShowPicker(true)}
              accessibilityRole="button"
              accessibilityLabel={
                deadline ? `Deadline, ${deadline.toDateString()}` : 'Pick a deadline, optional'
              }
            >
              <Text style={styles.dateBtnText}>
                {deadline ? `Deadline: ${deadline.toDateString()}` : 'Pick a deadline (optional)'}
              </Text>
            </Pressable>

            {showPicker && (
              <DateTimePicker
                value={deadline || new Date()}
                mode="date"
                minimumDate={new Date()}
                themeVariant="dark"
                onChange={(event, selected) => {
                  // Android closes the dialog itself; iOS stays inline.
                  setShowPicker(Platform.OS === 'ios');
                  if (event.type !== 'dismissed' && selected) setDeadline(selected);
                }}
              />
            )}

            <View style={styles.row}>
              <Pressable style={[styles.action, styles.cancel]} onPress={reset}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.action, styles.create]} onPress={handleCreate}>
                <Text style={styles.createText}>Create goal</Text>
              </Pressable>
            </View>
          </View>
        </>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.newBtn, pressed && styles.newBtnPressed]}
          onPress={() => setOpen(true)}
        >
          {({ pressed }) => (
            <Text style={[styles.newBtnText, pressed && styles.newBtnTextPressed]}>
              + New goal
            </Text>
          )}
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  masthead: { position: 'relative', paddingTop: spacing.sm },
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
  emptyState: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyHeading: {
    fontSize: font.h2,
    fontWeight: weight.h2,
    color: colors.textPrimary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: font.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  goalsList: { marginTop: spacing.md },
  form: {
    borderWidth: border.thin,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.body,
    borderWidth: border.thin,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row' },
  dateBtn: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: border.thin,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  dateBtnText: { color: colors.textPrimary, fontSize: font.body },
  action: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  cancel: { borderWidth: border.thin, borderColor: colors.gray400, marginRight: spacing.sm },
  cancelText: { color: colors.textSecondary, fontWeight: weight.semibold },
  create: { backgroundColor: colors.white },
  createText: { color: colors.black, fontWeight: weight.bold },
  newBtn: {
    borderWidth: border.thick,
    borderColor: colors.white,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  newBtnPressed: { backgroundColor: colors.white },
  newBtnText: { color: colors.white, fontSize: font.body, fontWeight: weight.bold },
  newBtnTextPressed: { color: colors.black },
});
