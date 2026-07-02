// Statistics over the 1707 Tabula Selenographica — charted hemispheres for
// a screen about measurement.
// Accent budget: greenBright (on-track/success text) + red (behind/overdue).

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, spacing, font, tracking, fontFamily } from '../theme';
import { lastNDays } from '../utils/dates';
import { predictGoal } from '../utils/predict';
import BarChart from '../components/BarChart';
import StatCard from '../components/StatCard';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import FadeRise from '../components/FadeRise';
import ProgressBar from '../components/ProgressBar';
import ArtBackdrop from '../components/art/ArtBackdrop';

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
  const allOnTrack = goalsWithDeadline.length > 0 && onTrackCount === goalsWithDeadline.length;

  const heat = weekdayHeat();

  return (
    <View style={styles.screen}>
      <ArtBackdrop source="moon" />

      <ScrollView contentContainerStyle={styles.content}>
        <FadeRise order={0}>
          <Text style={styles.masthead}>STATS</Text>
          <Text style={styles.sub}>Your progress over time.</Text>
        </FadeRise>

        {/* Overview stats */}
        <FadeRise order={1}>
          <SectionHeader />

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
              tone={allOnTrack ? colors.greenBright : undefined}
            />
          </View>
        </FadeRise>

        {/* Trend chart */}
        <FadeRise order={2}>
          <SectionHeader title="Last 14 days" />
          <Card style={styles.panel}>
            {state.tasks.length === 0 ? (
              <Text style={styles.empty}>Add daily habits to start charting your activity.</Text>
            ) : (
              <BarChart data={chartData} averageValue={avg} />
            )}
          </Card>
        </FadeRise>

        {/* Weekday heat */}
        <FadeRise order={3}>
          <SectionHeader title="Completion by day of week" />
          <Card style={styles.panel}>
            {heat.map((h) => (
              <View key={h.weekday} style={styles.heatRow}>
                <Text style={styles.heatLabel}>{h.label}</Text>
                <View style={styles.heatTrack}>
                  <ProgressBar value={h.avgScore} height={6} />
                </View>
                <Text style={styles.heatPct}>{Math.round(h.avgScore * 100)}%</Text>
              </View>
            ))}
          </Card>
        </FadeRise>

        {/* Goal forecasts */}
        <FadeRise order={4}>
          <SectionHeader title="Pace toward your targets" />
          {state.goals.length === 0 ? (
            <Text style={styles.empty}>No goals yet — create one to see a prediction.</Text>
          ) : (
            state.goals.map((g) => {
              const p = predictGoal(g);
              const pct = Math.round(p.percent * 100);
              const urgent = p.status === 'behind' || p.status === 'overdue';
              const good = p.status === 'ontrack' || p.status === 'done';
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
                    <ProgressBar value={p.percent} height={4} />
                  </View>
                  <Text style={styles.forecastLabelRow}>
                    <Text style={[styles.forecastPrompt, urgent && styles.forecastPromptUrgent]}>
                      {'> '}
                    </Text>
                    <Text
                      style={[
                        styles.forecastLabel,
                        urgent && styles.forecastLabelUrgent,
                        good && styles.forecastLabelGood,
                      ]}
                    >
                      {urgent ? '!' : ''}
                      {p.label}
                    </Text>
                  </Text>
                </Card>
              );
            })
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
  statRow: { flexDirection: 'row', marginTop: spacing.md, marginLeft: -spacing.xs },
  statRowSecond: { marginTop: spacing.sm },
  panel: { marginTop: spacing.md },
  empty: {
    fontFamily: fontFamily.sans,
    color: colors.textSecondary,
    fontSize: font.body,
    lineHeight: 22,
    marginTop: spacing.md,
  },
  heatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  heatLabel: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    color: colors.textMuted,
    width: 34,
  },
  heatTrack: { flex: 1, marginHorizontal: spacing.sm },
  heatPct: {
    fontFamily: fontFamily.mono,
    fontSize: font.monoSmall,
    color: colors.textPrimary,
    width: 42,
    textAlign: 'right',
  },
  forecast: { marginTop: spacing.md },
  forecastHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forecastTitle: {
    fontFamily: fontFamily.display,
    color: colors.textPrimary,
    fontSize: font.body,
    textTransform: 'uppercase',
    flex: 1,
    marginRight: spacing.sm,
  },
  forecastPct: {
    fontFamily: fontFamily.monoBold,
    color: colors.textPrimary,
    fontSize: font.body,
  },
  forecastTrack: { marginTop: spacing.sm },
  forecastLabelRow: { marginTop: spacing.sm },
  forecastPrompt: {
    fontFamily: fontFamily.mono,
    fontSize: font.small,
    color: colors.textMuted,
  },
  forecastPromptUrgent: { color: colors.red },
  forecastLabel: { fontFamily: fontFamily.sans, fontSize: font.small, color: colors.textSecondary },
  forecastLabelUrgent: { color: colors.textPrimary },
  forecastLabelGood: { color: colors.greenBright },
});
