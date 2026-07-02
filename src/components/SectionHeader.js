// Numbered mono caption + huge display title, used at the top of every
// screen section: "// 01 TODAY" over "HABITS".

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, tracking, fontFamily, spacing } from '../theme';

export default function SectionHeader({ index, label, title }) {
  const num = String(index).padStart(2, '0');
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>
        {'// '}
        {num}
        {' '}
        {label}
      </Text>
      {title ? <Text style={styles.title}>{title}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl },
  caption: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  title: {
    fontFamily: fontFamily.display,
    fontSize: font.h2,
    letterSpacing: tracking.h2,
    textTransform: 'uppercase',
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
});
