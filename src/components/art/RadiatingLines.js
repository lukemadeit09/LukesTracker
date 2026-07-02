// Home hero art: a sparse burst of thin lines radiating from a point near
// the top-right corner, cropped by the screen edge — suggests momentum
// without being literal. Deterministic (seeded by index), no runtime
// randomness, so it renders identically every time.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { colors } from '../../theme';

const ORIGIN = { x: 170, y: 20 };
const COUNT = 14;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

export default function RadiatingLines({ style }) {
  const lines = Array.from({ length: COUNT }, (_, i) => {
    const angle = 160 + (i / 13) * 100;
    const length = 60 + ((i * 37) % 90);
    const rad = toRad(angle);
    const x2 = ORIGIN.x + Math.cos(rad) * length;
    const y2 = ORIGIN.y + Math.sin(rad) * length;
    const opacity = Math.min(0.5, Math.max(0.08, 0.5 - Math.abs(i - 6.5) * 0.06));
    return { key: i, x2, y2, opacity };
  });

  return (
    <View
      style={[styles.wrap, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        {lines.map((l) => (
          <Line
            key={l.key}
            x1={ORIGIN.x}
            y1={ORIGIN.y}
            x2={l.x2}
            y2={l.y2}
            stroke={colors.art}
            strokeWidth={1}
            opacity={l.opacity}
          />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: -20,
    right: -40,
    width: 220,
    height: 220,
    zIndex: -1,
  },
});
