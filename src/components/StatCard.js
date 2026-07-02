// Compact stat tile used in the dashboard's overview row.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, radius, font } from '../theme';

export default function StatCard({ value, label, accent }) {
  return (
    <View style={styles.card}>
      <Text style={[styles.value, accent && { color: colors.accent }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
  },
  value: { color: colors.text, fontSize: font.h2, fontWeight: '800' },
  label: { color: colors.muted, fontSize: font.tiny, marginTop: 2, textAlign: 'center' },
});
