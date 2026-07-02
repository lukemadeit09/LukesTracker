// A single tickable daily task row — a hairline-bottom list item meant to
// live inside a single outlined Card, not its own bordered box.

import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, spacing, font, border, fontFamily } from '../theme';

export default function Checkbox({ label, checked, onToggle, onLongPress }) {
  return (
    <Pressable
      onPress={onToggle}
      onLongPress={onLongPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
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
    borderBottomWidth: border.hairline,
    borderBottomColor: colors.border,
    minHeight: 48,
  },
  pressed: { opacity: 0.6 },
  box: {
    width: 22,
    height: 22,
    borderWidth: border.thick,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  boxChecked: {
    backgroundColor: colors.white,
    borderColor: colors.white,
  },
  check: { color: colors.black, fontSize: 15, fontWeight: '800' },
  label: { color: colors.textPrimary, fontSize: font.body, flex: 1, fontFamily: fontFamily.sans },
  labelChecked: { color: colors.textMuted, textDecorationLine: 'line-through' },
});
