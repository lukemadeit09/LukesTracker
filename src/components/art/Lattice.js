// Stats art: an irregular grid suggesting data, sitting behind the masthead.
// Deterministic hand-picked coordinates — not a runtime-random graph-paper
// pattern, and not a literal chart (that job belongs to BarChart below it).

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { colors } from '../../theme';

const XS = [0, 22, 38, 70, 96, 150, 178, 220, 240];
const YS = [0, 30, 55, 100, 130, 160];
const DOT_INDICES = [
  [2, 3],
  [5, 1],
  [7, 4],
];

export default function Lattice({ style }) {
  return (
    <View
      style={[styles.wrap, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox="0 0 240 160" opacity={0.15}>
        {XS.map((x) => (
          <Line
            key={`v-${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={160}
            stroke={colors.art}
            strokeWidth={0.75}
          />
        ))}
        {YS.map((y) => (
          <Line
            key={`h-${y}`}
            x1={0}
            y1={y}
            x2={240}
            y2={y}
            stroke={colors.art}
            strokeWidth={0.75}
          />
        ))}
        {DOT_INDICES.map(([xi, yi]) => (
          <Circle
            key={`dot-${xi}-${yi}`}
            cx={XS[xi]}
            cy={YS[yi]}
            r={2}
            fill={colors.white}
            opacity={0.6}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 140,
    zIndex: -1,
  },
});
