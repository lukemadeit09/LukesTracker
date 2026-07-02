// A single tickable daily task row.

import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, spacing, radius, font } from '../theme';

export default function Checkbox({ label, checked, onToggle, onLongPress }) {
  return (
    <Pressable
      onPress={onToggle}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked && <Text style={styles.check}>✓</Text>}
      </View>
      <Text style={[styles.label, checked && styles.labelChecked]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
  },
  pressed: { opacity: 0.7 },
  box: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  boxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  check: { color: colors.text, fontSize: 16, fontWeight: '800' },
  label: { color: colors.text, fontSize: font.body, flex: 1 },
  labelChecked: { color: colors.muted, textDecorationLine: 'line-through' },
});
