// Minimal bar chart made from plain views — no native chart dependency.
// `data` is an array of { label, value } where value is 0..1.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, font } from '../theme';

export default function BarChart({ data, height = 120 }) {
  return (
    <View>
      <View style={[styles.chart, { height }]}>
        {data.map((d, i) => (
          <View key={i} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(2, Math.round(d.value * 100))}%`,
                    backgroundColor: d.value > 0 ? colors.accent : colors.secondary + '66',
                  },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text key={i} style={styles.label} numberOfLines={1}>
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  barTrack: { width: '60%', height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4 },
  labels: { flexDirection: 'row', marginTop: spacing.xs },
  label: { flex: 1, textAlign: 'center', color: colors.muted, fontSize: font.tiny },
});
