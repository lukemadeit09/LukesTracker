// Goals screen: create any goal (target + unit + deadline) and track it.

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
import { colors, spacing, radius, font } from '../theme';
import { dayKey } from '../utils/dates';
import GoalCard from '../components/GoalCard';

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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.h1}>Goals</Text>
      <Text style={styles.sub}>Set a target, pick a deadline, track your pace.</Text>

      {state.goals.length === 0 && !open && (
        <Text style={styles.empty}>
          No goals yet. Tap “New goal” to create your first one — read 24 books,
          run 100 km, save $5,000… anything with a number and a date.
        </Text>
      )}

      {state.goals.map((g) => (
        <GoalCard
          key={g.id}
          goal={g}
          onChange={(v) => updateGoalProgress(g.id, v)}
          onRemove={() => removeGoal(g.id)}
        />
      ))}

      {/* Add form */}
      {open ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>New goal</Text>

          <TextInput
            style={styles.input}
            placeholder="Goal name (e.g. Read 24 books)"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: spacing.sm }]}
              placeholder="Target (e.g. 24)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={target}
              onChangeText={setTarget}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Unit (books)"
              placeholderTextColor={colors.muted}
              value={unit}
              onChangeText={setUnit}
            />
          </View>

          <Pressable style={styles.dateBtn} onPress={() => setShowPicker(true)}>
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
      ) : (
        <Pressable style={styles.newBtn} onPress={() => setOpen(true)}>
          <Text style={styles.newBtnText}>＋ New goal</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  h1: { color: colors.text, fontSize: font.h1, fontWeight: '900', letterSpacing: 1 },
  sub: { color: colors.muted, fontSize: font.small, marginTop: 2, marginBottom: spacing.lg },
  empty: { color: colors.muted, fontSize: font.body, lineHeight: 22, marginBottom: spacing.md },
  form: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  formTitle: { color: colors.text, fontSize: font.h2, fontWeight: '700', marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.background,
    color: colors.text,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: font.body,
    borderWidth: 1,
    borderColor: colors.secondary,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row' },
  dateBtn: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.secondary,
    marginBottom: spacing.md,
  },
  dateBtnText: { color: colors.text, fontSize: font.body },
  action: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  cancel: { backgroundColor: colors.secondary, marginRight: spacing.sm },
  cancelText: { color: colors.text, fontWeight: '700' },
  create: { backgroundColor: colors.accent },
  createText: { color: colors.text, fontWeight: '800' },
  newBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  newBtnText: { color: colors.text, fontSize: font.body, fontWeight: '800' },
});
