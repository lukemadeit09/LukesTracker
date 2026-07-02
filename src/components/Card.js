// Content card: near-opaque dark surface floating over the background art,
// with a hairline border. Art must never interfere with content — this
// surface is what guarantees it.

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
    backgroundColor: colors.surface, // rgba(13,13,13,0.93)
    borderWidth: border.thin,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  emphasized: {
    borderColor: colors.borderStrong,
  },
});
