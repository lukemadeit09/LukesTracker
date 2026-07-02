// Goals art: concentric orbits closing in on a target dot. Used large
// (cropped, top-right of the masthead) and small (centered, symmetric,
// in the empty state) via the `variant` prop.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../../theme';

const HEADER_RADII = [18, 36, 56, 80, 108];
const HEADER_CENTER = { x: 200, y: 40 };

const EMPTY_RADII = [16, 32, 52];
const EMPTY_OPACITIES = [0.5, 0.3, 0.15];
const EMPTY_CENTER = { x: 60, y: 60 };

export default function Orbits({ style, variant = 'header' }) {
  const isEmpty = variant === 'empty';
  const radii = isEmpty ? EMPTY_RADII : HEADER_RADII;
  const center = isEmpty ? EMPTY_CENTER : HEADER_CENTER;
  const viewBox = isEmpty ? '0 0 120 120' : '0 0 240 240';

  return (
    <View
      style={[styles.wrap, isEmpty && styles.wrapEmpty, style]}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width="100%" height="100%" viewBox={viewBox}>
        {radii.map((r, i) => (
          <Circle
            key={r}
            cx={center.x}
            cy={center.y}
            r={r}
            stroke={colors.art}
            strokeWidth={1}
            fill="none"
            opacity={isEmpty ? EMPTY_OPACITIES[i] : 0.45 - i * 0.08}
          />
        ))}
        <Circle cx={center.x} cy={center.y} r={3} fill={colors.white} opacity={0.8} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 180,
    height: 180,
    zIndex: -1,
  },
  wrapEmpty: {
    position: 'relative',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    alignSelf: 'center',
  },
});
