// One goal: title, deadline, progress bar with milestone ticks, a pace-based
// prediction, quick +/- controls, milestone celebration panel, and a
// per-goal milestone notification toggle.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Switch, StyleSheet, AccessibilityInfo, Animated } from 'react-native';
import Card from './Card';
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
import { predictGoal } from '../utils/predict';
import { daysUntil } from '../utils/dates';
import { getMilestoneStatus } from '../utils/milestones';
import { useApp } from '../context/AppContext';

// Uppercase label shown in the celebration panel, keyed by threshold percent.
// NOTE: this is presentation-only — the milestone row's own copy
// ("Next milestone: …", "Goal complete — every milestone hit") is unchanged.
const CELEBRATION_LABEL = {
  25: 'QUARTER WAY',
  50: 'HALFWAY',
  75: 'ALMOST THERE',
  100: 'GOAL COMPLETE',
};

const AUTO_DISMISS_MS = 6000;

export default function GoalCard({ goal, onChange, onRemove }) {
  const { state, acknowledgeMilestone, setGoalMilestoneNotify } = useApp();
  const pred = predictGoal(goal);
  const pct = Math.round(pred.percent * 100);
  // Meaning accents: red = urgent/behind, green = done/on track (small text).
  const urgent = pred.status === 'behind' || pred.status === 'overdue';
  const onTrack = pred.status === 'ontrack' || pred.status === 'done';

  const milestones = getMilestoneStatus(goal);
  const { pendingCelebration, next } = milestones;

  // Step size for +/- buttons: 1, or 5% of target for larger goals.
  const step = goal.target >= 40 ? Math.max(1, Math.round(goal.target * 0.05)) : 1;

  const dLeft = goal.deadline ? daysUntil(goal.deadline) : null;
  const overdue = dLeft !== null && dLeft < 0;
  const deadlineText =
    dLeft === null
      ? 'No deadline'
      : dLeft < 0
      ? `!${Math.abs(dLeft)}d overdue`
      : dLeft === 0
      ? 'Due today'
      : `${dLeft}d left`;

  // Auto-dismiss the celebration panel after AUTO_DISMISS_MS, unless a
  // screen reader is active (that timer could cut off the announcement
  // before the user has time to act on it).
  const timerRef = useRef(null);
  useEffect(() => {
    if (pendingCelebration == null) return undefined;

    let cancelled = false;
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      if (cancelled || enabled) return;
      timerRef.current = setTimeout(() => {
        acknowledgeMilestone(goal.id, pendingCelebration);
      }, AUTO_DISMISS_MS);
    });

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [pendingCelebration, goal.id, acknowledgeMilestone]);

  function dismissCelebration() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    acknowledgeMilestone(goal.id, pendingCelebration);
  }

  // Panel entrance: quick opacity + scale-in.
  const panelAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (pendingCelebration == null) return undefined;
    panelAnim.setValue(0);
    const anim = Animated.timing(panelAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [pendingCelebration, panelAnim]);

  // Milestone row copy, or null when there's nothing to show (no target,
  // or every threshold already celebrated).
  const allCelebrated =
    goal.target > 0 && [25, 50, 75, 100].every((t) => milestones.celebrated.includes(t));

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title} numberOfLines={1}>{goal.title}</Text>
        <Pressable onPress={onRemove} hitSlop={10}>
          <Text style={styles.remove}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {goal.current}
          {goal.target ? ` / ${goal.target}` : ''}
          {goal.unit ? ` ${goal.unit}` : ''}
        </Text>
        {overdue ? (
          <View style={styles.overdueChip}>
            <Text style={styles.overdueChipText}>{deadlineText}</Text>
          </View>
        ) : (
          <Text style={[styles.meta, styles.metaRight]}>{deadlineText}</Text>
        )}
      </View>

      {/* Progress bar with milestone ticks at 25/50/75% */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%` }]} />
        {goal.target > 0 &&
          [25, 50, 75].map((t) => {
            const isNext = next && next.percent === t;
            const isReached = milestones.reached.includes(t);
            return (
              <View
                key={t}
                importantForAccessibility="no"
                accessibilityElementsHidden
                style={[
                  styles.tick,
                  { left: `${t}%` },
                  isReached
                    ? styles.tickReached
                    : isNext
                    ? styles.tickNext
                    : styles.tickFuture,
                ]}
              />
            );
          })}
      </View>

      {/* Milestone row / celebration panel */}
      {pendingCelebration != null ? (
        <Animated.View
          style={[
            styles.celebration,
            {
              opacity: panelAnim,
              transform: [
                {
                  scale: panelAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
              ],
            },
          ]}
          accessibilityRole="alert"
        >
          <Text style={styles.celebrationPct}>{pendingCelebration}%</Text>
          <View style={styles.celebrationRule} />
          <Text style={styles.celebrationLabel}>{CELEBRATION_LABEL[pendingCelebration]}</Text>
          <Text style={styles.celebrationTitle} numberOfLines={1}>{goal.title}</Text>
          <Pressable
            onPress={dismissCelebration}
            hitSlop={12}
            accessibilityLabel="Dismiss milestone celebration"
            style={styles.celebrationDismissWrap}
          >
            <Text style={styles.celebrationDismiss}>✕</Text>
          </Pressable>
        </Animated.View>
      ) : allCelebrated ? (
        <Text style={styles.milestoneRow}>Goal complete — every milestone hit</Text>
      ) : goal.target > 0 && next ? (
        <Text style={styles.milestoneRow}>
          Next milestone: {next.percent}% · {next.remaining} {goal.unit || ''} to go
        </Text>
      ) : null}

      {/* Prediction: red prompt when urgent, bright green text when on track */}
      <Text style={styles.predictRow}>
        <Text style={[styles.predictPrompt, urgent && styles.predictPromptUrgent]}>
          {'> '}
        </Text>
        <Text
          style={[
            styles.predict,
            urgent && styles.predictUrgent,
            onTrack && styles.predictOnTrack,
          ]}
        >
          {urgent ? '!' : ''}
          {pred.label}
        </Text>
      </Text>

      {/* Progress controls */}
      <View style={styles.controls}>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(Math.max(0, goal.current - step))}
        >
          <Text style={styles.stepText}>−{step}</Text>
        </Pressable>
        <Text style={styles.pctText}>{pct}%</Text>
        <Pressable
          style={styles.stepBtn}
          onPress={() => onChange(goal.current + step)}
        >
          <Text style={styles.stepText}>+{step}</Text>
        </Pressable>
      </View>

      {/* Per-goal milestone notification toggle */}
      {goal.target > 0 && (
        <View style={styles.notifyRow}>
          <View style={styles.notifyTextWrap}>
            <View style={styles.notifyLabelRow}>
              <Text style={styles.notifyLabel}>Notify on milestones</Text>
              <Switch
                value={!!goal.milestoneNotifyEnabled}
                onValueChange={(v) => setGoalMilestoneNotify(goal.id, v)}
                trackColor={{ false: colors.gray200, true: colors.white }}
                thumbColor={colors.black}
                accessibilityLabel={`Notify on milestones for ${goal.title}`}
                accessibilityHint={
                  state.settings.reminderEnabled
                    ? undefined
                    : 'Requires the Daily reminder setting to be turned on to send notifications'
                }
              />
            </View>
            {!state.settings.reminderEnabled && (
              <Text style={styles.notifyHint}>
                Turn on Daily reminder in Settings to receive this
              </Text>
            )}
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: {
    fontFamily: fontFamily.display,
    color: colors.textPrimary,
    fontSize: font.h2,
    letterSpacing: tracking.h2,
    textTransform: 'uppercase',
    flex: 1,
    marginRight: spacing.sm,
  },
  remove: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, marginBottom: spacing.sm },
  meta: {
    fontFamily: fontFamily.mono,
    fontSize: font.monoSmall,
    color: colors.textPrimary,
  },
  metaRight: { color: colors.textSecondary },
  // Red = urgent: overdue deadline gets a filled blood-red chip.
  overdueChip: {
    backgroundColor: colors.red,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  overdueChipText: {
    fontFamily: fontFamily.monoBold,
    fontSize: font.monoSmall,
    color: colors.white,
  },
  track: {
    height: 8,
    backgroundColor: colors.gray100,
    borderRadius: radius.pill,
    overflow: 'visible',
    position: 'relative',
  },
  fill: { height: '100%', backgroundColor: colors.white, borderRadius: radius.pill },
  tick: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    marginLeft: -1,
  },
  tickReached: { backgroundColor: colors.gray600 },
  tickNext: {
    backgroundColor: colors.textPrimary,
    top: -3,
    height: 14, // track height (8) + 3px overflow top/bottom
  },
  tickFuture: { backgroundColor: colors.gray300 },
  milestoneRow: {
    fontFamily: fontFamily.mono,
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  celebration: {
    // Green = done: the one filled accent surface in the app.
    backgroundColor: colors.green,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    alignItems: 'center',
  },
  celebrationPct: {
    fontFamily: fontFamily.monoBold,
    fontSize: 48,
    color: colors.white,
  },
  celebrationRule: {
    width: 40,
    height: border.thin,
    backgroundColor: colors.greenBright + '55',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  celebrationLabel: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: colors.greenBright,
  },
  celebrationTitle: {
    fontFamily: fontFamily.sans,
    fontSize: font.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  celebrationDismissWrap: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
  },
  celebrationDismiss: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '700',
  },
  predictRow: { marginTop: spacing.sm },
  predictPrompt: {
    fontFamily: fontFamily.mono,
    fontSize: font.small,
    color: colors.textMuted,
  },
  predictPromptUrgent: { color: colors.red },
  predict: { fontFamily: fontFamily.sans, fontSize: font.small, color: colors.textSecondary },
  predictUrgent: { color: colors.textPrimary },
  predictOnTrack: { color: colors.greenBright },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  stepBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: border.thin,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  stepText: {
    fontFamily: fontFamily.monoBold,
    color: colors.textPrimary,
    fontSize: font.body,
  },
  pctText: {
    fontFamily: fontFamily.monoBold,
    color: colors.textPrimary,
    fontSize: font.h2,
  },
  notifyRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: border.hairline,
    borderTopColor: colors.border,
  },
  notifyTextWrap: { flex: 1 },
  notifyLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifyLabel: {
    fontFamily: fontFamily.sans,
    color: colors.textPrimary,
    fontSize: font.small,
  },
  notifyHint: {
    fontFamily: fontFamily.sans,
    color: colors.textMuted,
    fontSize: font.tiny,
    marginTop: spacing.xs,
  },
});
