// iOS-settings-style icon chip: 28px rounded square in a meaning color with
// a white Tabler-style outline glyph. The one sanctioned use of color as
// decoration — chips, not surfaces, so screens still read black & white.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

const STROKE = {
  stroke: '#ffffff',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
};

// Path data adapted from Tabler Icons (MIT) — bell, palette, database,
// alert-triangle — 24x24 grid, stroke-based.
const ICONS = {
  bell: (
    <>
      <Path {...STROKE} d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" />
      <Path {...STROKE} d="M9 17v1a3 3 0 0 0 6 0v-1" />
    </>
  ),
  palette: (
    <>
      <Path
        {...STROKE}
        d="M12 21a9 9 0 0 1 0 -18c4.97 0 9 3.582 9 8c0 1.06 -.474 2.078 -1.318 2.828c-.844 .75 -1.989 1.172 -3.182 1.172h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25"
      />
      <Circle cx="8.5" cy="10.5" r="1" fill="#ffffff" stroke="none" />
      <Circle cx="12.5" cy="7.5" r="1" fill="#ffffff" stroke="none" />
      <Circle cx="16.5" cy="10.5" r="1" fill="#ffffff" stroke="none" />
    </>
  ),
  database: (
    <>
      <Path {...STROKE} d="M12 3c-4.418 0 -8 1.343 -8 3s3.582 3 8 3s8 -1.343 8 -3s-3.582 -3 -8 -3" />
      <Path {...STROKE} d="M4 6v6a8 3 0 0 0 16 0v-6" />
      <Path {...STROKE} d="M4 12v6a8 3 0 0 0 16 0v-6" />
    </>
  ),
  alert: (
    <>
      <Path {...STROKE} d="M12 9v4" />
      <Path
        {...STROKE}
        d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.871l-8.106 -13.534a1.914 1.914 0 0 0 -3.274 0z"
      />
      <Path {...STROKE} d="M12 16h.01" />
    </>
  ),
};

export default function IconTile({ icon, color }) {
  return (
    <View
      style={[styles.tile, { backgroundColor: color }]}
      importantForAccessibility="no"
      accessibilityElementsHidden
    >
      <Svg width={17} height={17} viewBox="0 0 24 24">
        {ICONS[icon]}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
