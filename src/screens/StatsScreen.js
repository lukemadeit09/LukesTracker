// Statistics: completion trend over the last 2 weeks, headline numbers,
// weekday heat, and a pace forecast for every goal.
// "#1 OVERVIEW" / "#2 TREND" / "#3 WEEKDAY HEAT" / "#4 GOAL FORECASTS".

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
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
import { lastNDays } from '../utils/dates';
import { predictGoal } from '../utils/predict';
import BarChart from '../components/BarChart';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import Lattice from '../components/art/Lattice';

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function fmtDelta(n) {
  const pct = Math.round(n * 100);
  if (pct > 0) return `+${pct}%`;
  if (pct < 0) return `${pct}%`;
  return '±0%';
}

export default function StatsScreen() {
  const { state, dayScore, longestStreak, weekdayHeat } = useApp();

  const days = useMemo(() => lastNDays(14), []);

  const chartData = days.map((key) => {
    const [y, m, d] = key.split('-').map(Number);
    return { label: WEEKDAY[new Date(y, m - 1, d).getDay()], value: dayScore(key) };
  });

  // Headline numbers.
  const scores = days.map((k) => dayScore(k));
  const avg = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const perfectDays = Object.values(state.completions).filter(
    (ids) => state.tasks.length > 0 && ids.length >= state.tasks.length
  ).length;
  const totalTicks = Object.values(state.completions).reduce(
    (sum, ids) => sum + ids.length,
    0
  );

  // Week-over-week delta: last 7 days' average score vs the previous 7.
  const last7 = scores.slice(-7);
  const prev7 = scores.slice(0, Math.max(0, scores.length - 7));
  const last7Avg = last7.reduce((a, b) => a + b, 0) / (last7.length || 1);
  const prev7Avg = prev7.length ? prev7.reduce((a, b) => a + b, 0) / prev7.length : 0;
  const wowDelta = last7Avg - prev7Avg;

  // Goal-on-track ratio: goals with a deadline, how many are 'ontrack' or 'done'.
  const predictions = state.goals.map((g) => predictGoal(g));
  const goalsWithDeadline = predictions.filter((p) => p.daysLeft !== null);
  const onTrackCount = goalsWithDeadline.filter(
    (p) => p.status === 'ontrack' || p.status === 'done'
  ).length;

  const heat = weekdayHeat();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.masthead}>
        <Lattice />
        <Text style={styles.kicker}>{'> STATS'}</Text>
        <Text style={styles.h1}>Statistics</Text>
        <Text style={styles.sub}>Your progress over time.</Text>
      </View>

      {/* #1 OVERVIEW */}
      <SectionHeader index={1} label="OVERVIEW" />

      <View style={styles.statRow}>
        <StatCard value={`${Math.round(avg * 100)}%`} label="14-day avg" emphasized />
        <StatCard value={perfectDays} label="Perfect days" />
        <StatCard value={totalTicks} label="Total check-ins" />
      </View>

      <View style={[styles.statRow, styles.statRowSecond]}>
        <StatCard value={longestStreak()} label="Longest streak" />
        <StatCard value={fmtDelta(wowDelta)} label="Week over week" />
        <StatCard
          value={goalsWithDeadline.length ? `${onTrackCount}/${goalsWithDeadline.length}` : '—'}
          label="Goals on track"
        />
      </View>

      {/* #2 TREND */}
      <SectionHeader index={2} label="TREND" title="Last 14 days" />
      <Card style={styles.panel}>
        {state.tasks.length === 0 ? (
          <Text style={styles.empty}>Add daily habits to start charting your activity.</Text>
        ) : (
          <BarChart data={chartData} averageValue={avg} />
        )}
      </Card>

      {/* #3 WEEKDAY HEAT */}
      <SectionHeader index={3} label="WEEKDAY HEAT" title="Completion by day of week" />
      <Card style={styles.panel}>
        {heat.map((h) => (
          <View key={h.weekday} style={styles.heatRow}>
            <Text style={styles.heatLabel}>{h.label}</Text>
            <View style={styles.heatTrack}>
              <View style={[styles.heatFill, { width: `${Math.round(h.avgScore * 100)}%` }]} />
            </View>
            <Text style={styles.heatPct}>{Math.round(h.avgScore * 100)}%</Text>
          </View>
        ))}
      </Card>

      {/* #4 GOAL FORECASTS */}
      <SectionHeader index={4} label="GOAL FORECASTS" title="Pace toward your targets" />
      {state.goals.length === 0 ? (
        <Text style={styles.empty}>No goals yet — create one to see a prediction.</Text>
      ) : (
        state.goals.map((g) => {
          const p = predictGoal(g);
          const pct = Math.round(p.percent * 100);
          const emphasize = p.status === 'behind' || p.status === 'overdue';
          return (
            <Card key={g.id} style={styles.forecast}>
              <View style={styles.forecastHead}>
                <Text style={styles.forecastTitle} numberOfLines={1}>{g.title}</Text>
                <Text style={styles.forecastPct}>{pct}%</Text>
              </View>
              <View
                style={styles.forecastTrack}
                accessibilityElementsHidden
                importantForAccessibility="no"
              >
                <View style={[styles.forecastFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.forecastLabelRow}>
                <Text style={styles.forecastPrompt}>{'> '}</Text>
                <Text style={[styles.forecastLabel, emphasize && styles.forecastLabelEmphasize]}>
                  {emphasize ? '!' : ''}
                  {p.label}
                </Text>
              </Text>
            </Card>
          );
        })
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
  statRow: { flexDirection: 'row', marginTop: spacing.md },
  statRowSecond: { marginTop: spacing.sm },
  panel: { marginTop: spacing.md },
  empty: { color: colors.textSecondary, fontSize: font.body, lineHeight: 22 },
  heatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  heatLabel: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    fontWeight: weight.semibold,
    letterSpacing: tracking.label,
    color: colors.textMuted,
    width: 32,
  },
  heatTrack: {
    flex: 1,
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginHorizontal: spacing.sm,
  },
  heatFill: { height: '100%', backgroundColor: colors.white, borderRadius: radius.pill },
  heatPct: {
    fontFamily: fontFamily.mono,
    fontSize: font.monoSmall,
    color: colors.textPrimary,
    width: 40,
    textAlign: 'right',
  },
  forecast: { marginTop: spacing.md },
  forecastHead: { flexDirection: 'row', justifyContent: 'space-between' },
  forecastTitle: { color: colors.textPrimary, fontSize: font.body, fontWeight: weight.bold, flex: 1, marginRight: spacing.sm },
  forecastPct: { fontFamily: fontFamily.mono, color: colors.textPrimary, fontSize: font.body, fontWeight: '700' },
  forecastTrack: {
    height: border.thick,
    backgroundColor: colors.gray100,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  forecastFill: { height: '100%', backgroundColor: colors.white },
  forecastLabelRow: { marginTop: spacing.xs },
  forecastPrompt: { fontFamily: fontFamily.mono, fontSize: font.small, color: colors.textMuted },
  forecastLabel: { fontSize: font.small, color: colors.textSecondary },
  forecastLabelEmphasize: { color: colors.textPrimary, fontWeight: weight.bold },
});
