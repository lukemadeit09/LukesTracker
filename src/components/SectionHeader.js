// Numbered mono caption + sentence-case title, used at the top of every
// screen section: "> #1  TODAY" / "Your habits".

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, weight, tracking, fontFamily, spacing } from '../theme';

export default function SectionHeader({ index, label, title }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>
        {'> #'}
        {index}
        {'  '}
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
    fontWeight: weight.semibold,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  title: {
    fontSize: font.h2,
    fontWeight: weight.h2,
    letterSpacing: tracking.h2,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
});
