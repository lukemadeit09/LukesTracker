// Hairline-outlined block on black — replaces the old filled surface card
// used throughout the app.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius, border } from '../theme';

export default function Card({ children, style, emphasized }) {
  return (
    <View style={[styles.card, emphasized && styles.emphasized, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderWidth: border.thin,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  emphasized: {
    borderColor: colors.borderStrong,
  },
});
