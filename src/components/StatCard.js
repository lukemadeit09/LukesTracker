// Hairline-outlined stat tile. Value is always mono; label is a small
// uppercase tracked caption in sans (labels are structural, not data).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, font, weight, tracking, fontFamily, border } from '../theme';

export default function StatCard({ value, label, delta, emphasized }) {
  return (
    <View
      style={[styles.card, emphasized && styles.emphasized]}
      accessibilityLabel={`${label}, ${value}`}
    >
      <Text style={[styles.value, emphasized && styles.valueEmphasized]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
      {delta ? <Text style={styles.delta}>{delta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderWidth: border.thin,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    marginLeft: -border.thin,
  },
  emphasized: {
    borderColor: colors.borderStrong,
  },
  value: {
    fontFamily: fontFamily.mono,
    fontSize: font.monoStat,
    fontWeight: weight.bold,
    color: colors.textPrimary,
  },
  valueEmphasized: {
    fontSize: font.monoStat + 4,
  },
  label: {
    fontSize: font.tiny,
    fontWeight: weight.semibold,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  delta: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    color: colors.textMuted,
    marginTop: 2,
  },
});
