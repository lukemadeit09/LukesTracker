// Minimal bar chart made from plain views — no native chart dependency.
// `data` is an array of { label, value } where value is 0..1.
// Optional `averageValue` (0..1) overlays a dashed reference line.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { colors, spacing, font, fontFamily, tracking, weight } from '../theme';

export default function BarChart({ data, height = 120, averageValue }) {
  const avgY = typeof averageValue === 'number' ? (1 - Math.min(1, Math.max(0, averageValue))) * height : null;

  return (
    <View>
      <View style={[styles.chart, { height }]}>
        {avgY !== null && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width="100%" height={height}>
              <Line
                x1="0"
                y1={avgY}
                x2="100%"
                y2={avgY}
                stroke={colors.gray400}
                strokeWidth={1}
                strokeDasharray="2,3"
              />
            </Svg>
          </View>
        )}
        {data.map((d, i) => (
          <View key={i} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(2, Math.round(d.value * 100))}%`,
                    backgroundColor: d.value > 0 ? colors.white : colors.gray200,
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
  bar: { width: '100%', borderRadius: 1 },
  labels: { flexDirection: 'row', marginTop: spacing.xs },
  label: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    fontWeight: weight.semibold,
    letterSpacing: tracking.label,
    color: colors.textMuted,
  },
});
