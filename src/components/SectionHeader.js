// Section break: an uppercase display title where a section needs a name,
// or plain whitespace where it doesn't. (The numbered "// 01" mono captions
// were retired — whitespace and card structure carry the hierarchy now.)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, font, tracking, fontFamily, spacing } from '../theme';

export default function SectionHeader({ title }) {
  if (!title) return <View style={styles.spacer} />;
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  spacer: { marginTop: spacing.xl },
  wrap: { marginTop: spacing.xl },
  title: {
    fontFamily: fontFamily.display,
    fontSize: font.h2,
    letterSpacing: tracking.h2,
    textTransform: 'uppercase',
    color: colors.textPrimary,
  },
});
