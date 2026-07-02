// Stat tile on a card surface. Value in Space Mono (terminal), label as a
// small tracked mono caption. `tone` may recolor the value when the number
// itself carries meaning (e.g. greenBright when everything is done).

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, font, tracking, fontFamily, border } from '../theme';

export default function StatCard({ value, label, delta, emphasized, tone }) {
  return (
    <View
      style={[styles.card, emphasized && styles.emphasized]}
      accessibilityLabel={`${label}, ${value}`}
    >
      <Text
        style={[
          styles.value,
          emphasized && styles.valueEmphasized,
          tone && { color: tone },
        ]}
      >
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
      {delta ? <Text style={styles.delta}>{delta}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: border.thin,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    marginLeft: spacing.xs,
  },
  emphasized: {
    borderColor: colors.white,
  },
  value: {
    fontFamily: fontFamily.monoBold,
    fontSize: font.monoStat,
    color: colors.textPrimary,
  },
  valueEmphasized: {
    fontSize: font.monoStat + 4,
  },
  label: {
    fontFamily: fontFamily.mono,
    fontSize: 9,
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
