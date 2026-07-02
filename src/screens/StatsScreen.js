// Statistics: completion trend over the last 2 weeks, headline numbers,
// and a pace forecast for every goal.

import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { colors, spacing, radius, font } from '../theme';
import { lastNDays } from '../utils/dates';
import { predictGoal, statusColor } from '../utils/predict';
import BarChart from '../components/BarChart';
import StatCard from '../components/StatCard';

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function StatsScreen() {
  const { state, dayScore, currentStreak } = useApp();

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

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.h1}>Statistics</Text>
      <Text style={styles.sub}>Your progress over time.</Text>

      <View style={styles.statRow}>
        <StatCard value={`${Math.round(avg * 100)}%`} label="14-day avg" accent />
        <StatCard value={perfectDays} label="Perfect days" />
        <StatCard value={totalTicks} label="Total check-ins" />
      </View>

      <Text style={styles.sectionTitle}>Last 14 days</Text>
      <View style={styles.panel}>
        {state.tasks.length === 0 ? (
          <Text style={styles.empty}>Add daily habits to start charting your activity.</Text>
        ) : (
          <BarChart data={chartData} />
        )}
      </View>

      <Text style={styles.sectionTitle}>Goal forecasts</Text>
      {state.goals.length === 0 ? (
        <Text style={styles.empty}>No goals yet — create one to see a prediction.</Text>
      ) : (
        state.goals.map((g) => {
          const p = predictGoal(g);
          return (
            <View key={g.id} style={styles.forecast}>
              <View style={styles.forecastHead}>
                <Text style={styles.forecastTitle} numberOfLines={1}>{g.title}</Text>
                <Text style={styles.forecastPct}>{Math.round(p.percent * 100)}%</Text>
              </View>
              <Text style={[styles.forecastLabel, { color: statusColor(p.status, colors) }]}>
                {p.label}
              </Text>
            </View>
          );
        })
      )}

      <View style={styles.streakBanner}>
        <Text style={styles.streakText}>🔥 Current streak: {currentStreak()} days</Text>
        <Text style={styles.streakSub}>Keep showing up. Don't break the chain.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  h1: { color: colors.text, fontSize: font.h1, fontWeight: '900', letterSpacing: 1 },
  sub: { color: colors.muted, fontSize: font.small, marginTop: 2, marginBottom: spacing.lg },
  statRow: { flexDirection: 'row', marginHorizontal: -spacing.xs, marginBottom: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: font.h2, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.sm },
  panel: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  empty: { color: colors.muted, fontSize: font.body, lineHeight: 22 },
  forecast: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  forecastHead: { flexDirection: 'row', justifyContent: 'space-between' },
  forecastTitle: { color: colors.text, fontSize: font.body, fontWeight: '700', flex: 1, marginRight: spacing.sm },
  forecastPct: { color: colors.muted, fontSize: font.body, fontWeight: '700' },
  forecastLabel: { fontSize: font.small, marginTop: spacing.xs, fontWeight: '600' },
  streakBanner: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent + '55',
  },
  streakText: { color: colors.accent, fontSize: font.h2, fontWeight: '800' },
  streakSub: { color: colors.muted, fontSize: font.small, marginTop: spacing.xs },
});
