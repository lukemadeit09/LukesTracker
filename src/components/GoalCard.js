// One goal: title, deadline, progress bar with milestone ticks, a pace-based
// prediction, quick +/- controls, milestone celebration banner, and a
// per-goal milestone notification toggle.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Switch, StyleSheet, AccessibilityInfo } from 'react-native';
import { colors, spacing, radius, font } from '../theme';
import { predictGoal, statusColor } from '../utils/predict';
import { daysUntil } from '../utils/dates';
import { getMilestoneStatus } from '../utils/milestones';
import { useApp } from '../context/AppContext';

// Copy shown in the celebration banner, keyed by threshold percent.
const CELEBRATION_COPY = {
  25: (title) => `Quarter way — 25% of ${title}`,
  50: (title) => `Halfway there — 50% of ${title}`,
  75: (title) => `Almost there — 75% of ${title}`,
  100: (title) => `Goal complete — ${title} 🎯`,
};

const AUTO_DISMISS_MS = 6000;

export default function GoalCard({ goal, onChange, onRemove }) {
  const { state, acknowledgeMilestone, setGoalMilestoneNotify } = useApp();
  const pred = predictGoal(goal);
  const pct = Math.round(pred.percent * 100);
  const sColor = statusColor(pred.status, colors);

  const milestones = getMilestoneStatus(goal);
  const { pendingCelebration, next } = milestones;

  // Step size for +/- buttons: 1, or 5% of target for larger goals.
  const step = goal.target >= 40 ? Math.max(1, Math.round(goal.target * 0.05)) : 1;

  const dLeft = goal.deadline ? daysUntil(goal.deadline) : null;
  const deadlineText =
    dLeft === null
      ? 'No deadline'
      : dLeft < 0
      ? `${Math.abs(dLeft)}d overdue`
      : dLeft === 0
      ? 'Due today'
      : `${dLeft}d left`;

  // Auto-dismiss the celebration banner after AUTO_DISMISS_MS, unless a
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

  // Milestone row copy, or null when there's nothing to show (no target,
  // or every threshold already celebrated).
  const allCelebrated =
    goal.target > 0 && [25, 50, 75, 100].every((t) => milestones.celebrated.includes(t));

  return (
    <View style={styles.card}>
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
        <Text style={[styles.meta, { color: colors.muted }]}>{deadlineText}</Text>
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

      {/* Milestone row / celebration banner */}
      {pendingCelebration != null ? (
        <View style={styles.celebration} accessibilityRole="alert">
          <Text style={styles.celebrationCheck}>✓</Text>
          <Text style={styles.celebrationText} numberOfLines={1}>
            {CELEBRATION_COPY[pendingCelebration](goal.title)}
          </Text>
          <Pressable
            onPress={dismissCelebration}
            hitSlop={12}
            accessibilityLabel="Dismiss milestone celebration"
          >
            <Text style={styles.celebrationDismiss}>✕</Text>
          </Pressable>
        </View>
      ) : allCelebrated ? (
        <Text style={styles.milestoneRow}>Goal complete — every milestone hit</Text>
      ) : goal.target > 0 && next ? (
        <Text style={styles.milestoneRow}>
          Next milestone: {next.percent}% · {next.remaining} {goal.unit || ''} to go
        </Text>
      ) : null}

      {/* Prediction */}
      <Text style={[styles.predict, { color: sColor }]}>{pred.label}</Text>

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
          style={[styles.stepBtn, styles.stepBtnPlus]}
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
                trackColor={{ false: colors.secondary, true: colors.accent }}
                thumbColor={colors.text}
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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: font.h2, fontWeight: '700', flex: 1, marginRight: spacing.sm },
  remove: { color: colors.muted, fontSize: 16, fontWeight: '700' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 2, marginBottom: spacing.sm },
  meta: { color: colors.text, fontSize: font.small },
  track: {
    height: 10,
    backgroundColor: colors.secondary + '55',
    borderRadius: radius.pill,
    overflow: 'visible',
    position: 'relative',
  },
  fill: { height: '100%', backgroundColor: colors.accent, borderRadius: radius.pill },
  tick: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: '100%',
    marginLeft: -1,
  },
  tickReached: { backgroundColor: colors.background + 'aa' },
  tickNext: {
    backgroundColor: colors.text,
    top: -3,
    height: 16, // track height (10) + 3px overflow top/bottom
  },
  tickFuture: { backgroundColor: colors.muted + '66' },
  milestoneRow: {
    fontSize: font.small,
    color: colors.muted,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  celebration: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent + '1a',
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.accent + '55',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  celebrationCheck: {
    color: colors.accent,
    fontSize: font.body,
    fontWeight: '800',
    marginRight: spacing.sm,
  },
  celebrationText: {
    flex: 1,
    color: colors.text,
    fontWeight: '700',
    fontSize: font.small,
  },
  celebrationDismiss: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: spacing.sm,
  },
  predict: { fontSize: font.small, marginTop: spacing.sm, fontWeight: '600' },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  stepBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.secondary,
    borderRadius: radius.sm,
  },
  stepBtnPlus: { backgroundColor: colors.accent },
  stepText: { color: colors.text, fontWeight: '800', fontSize: font.body },
  pctText: { color: colors.muted, fontSize: font.body, fontWeight: '700' },
  notifyRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.secondary + '55',
  },
  notifyTextWrap: { flex: 1 },
  notifyLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notifyLabel: { color: colors.text, fontSize: font.small, fontWeight: '600' },
  notifyHint: { color: colors.muted, fontSize: font.tiny, marginTop: spacing.xs },
});
