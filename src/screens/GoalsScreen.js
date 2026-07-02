// Goals: create any goal (target + unit + deadline) and track it, over the
// Piranesi staircase — the climb. Sections: // 01 IN PROGRESS  // 02 NEW GOAL
// Accent budget on this screen: red (behind/overdue) + green (done/on track),
// both inside GoalCard. The art stays white.

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
import { colors, spacing, radius, font, tracking, fontFamily, border } from '../theme';
import { dayKey } from '../utils/dates';
import GoalCard from '../components/GoalCard';
import SectionHeader from '../components/SectionHeader';
import Card from '../components/Card';
import FadeRise from '../components/FadeRise';
import ArtBackdrop from '../components/art/ArtBackdrop';

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
    <View style={styles.screen}>
      <ArtBackdrop source="piranesi" />

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <FadeRise order={0}>
          <Text style={styles.masthead}>GOALS</Text>
          <Text style={styles.sub}>Set a target, pick a deadline, track your pace.</Text>
        </FadeRise>

        {/* // 01 IN PROGRESS */}
        <FadeRise order={1}>
          {hasGoals && <SectionHeader index={1} label="IN PROGRESS" />}

          {!hasGoals && !open && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyCaption}>{'// NOTHING CLIMBING YET'}</Text>
              <Text style={styles.emptyHeading}>NO GOALS YET</Text>
              <Text style={styles.emptyBody}>
                Create your first goal — a number, a unit, and optionally a
                deadline. Read 24 books. Run 100 km. Save $5,000.
              </Text>
            </Card>
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
        </FadeRise>

        {/* // 02 NEW GOAL */}
        <FadeRise order={2}>
          {open ? (
            <>
              <SectionHeader index={hasGoals ? 2 : 1} label="NEW GOAL" />
              <Card style={styles.form}>
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
                    {deadline ? `DEADLINE: ${deadline.toDateString()}` : 'PICK A DEADLINE (OPTIONAL)'}
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
                    <Text style={styles.cancelText}>CANCEL</Text>
                  </Pressable>
                  <Pressable style={[styles.action, styles.create]} onPress={handleCreate}>
                    <Text style={styles.createText}>CREATE GOAL</Text>
                  </Pressable>
                </View>
              </Card>
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
  emptyCard: { marginTop: spacing.lg, alignItems: 'flex-start' },
  emptyCaption: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    color: colors.textMuted,
  },
  emptyHeading: {
    fontFamily: fontFamily.display,
    fontSize: font.h2,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptyBody: {
    fontFamily: fontFamily.sans,
    fontSize: font.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 19,
  },
  goalsList: { marginTop: spacing.md },
  form: { marginTop: spacing.md },
  input: {
    backgroundColor: colors.surfaceSolid,
    color: colors.textPrimary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontFamily: fontFamily.sans,
    fontSize: font.body,
    borderWidth: border.thin,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row' },
  dateBtn: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: border.thin,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  dateBtnText: {
    fontFamily: fontFamily.mono,
    color: colors.textSecondary,
    fontSize: font.monoSmall,
    letterSpacing: tracking.label,
  },
  action: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.sm, alignItems: 'center' },
  cancel: { borderWidth: border.thin, borderColor: colors.gray400, marginRight: spacing.sm },
  cancelText: {
    fontFamily: fontFamily.mono,
    color: colors.textSecondary,
    fontSize: font.monoSmall,
    letterSpacing: tracking.label,
  },
  create: { backgroundColor: colors.white },
  createText: {
    fontFamily: fontFamily.monoBold,
    color: colors.black,
    fontSize: font.monoSmall,
    letterSpacing: tracking.label,
  },
  newBtn: {
    borderWidth: border.thick,
    borderColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.surface,
  },
  newBtnPressed: { backgroundColor: colors.white },
  newBtnText: {
    fontFamily: fontFamily.monoBold,
    color: colors.white,
    fontSize: font.small,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
  },
  newBtnTextPressed: { color: colors.black },
});
