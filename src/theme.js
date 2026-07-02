// Lukes Tracker — central theme: "Hermes" black & white.
// Black is the canvas, not a color. Every visual element is a shade of
// white/gray — hierarchy comes from size, weight, position and contrast.

import { Platform, StyleSheet } from 'react-native';

export const colors = {
  black: '#000000',
  gray50: '#0A0A0A',
  gray100: '#141414',
  gray200: '#232323',
  gray300: '#3A3A3A',
  gray400: '#5C5C5C',
  gray500: '#8A8A8A',
  gray600: '#B3B3B3',
  gray700: '#E0E0E0',
  white: '#FFFFFF',

  // Semantic aliases — components should prefer these over raw grayXXX where possible.
  background: '#000000',
  surface: '#0A0A0A', // input fills, switch track "off"
  surfaceRaised: '#141414', // celebration panel fill only
  border: '#232323', // default hairline
  borderStrong: '#3A3A3A', // emphasized hairline
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#8A8A8A',
  textDisabled: '#5C5C5C',
  art: '#5C5C5C', // default SVG stroke color (opacity varies, see art components)
};

export const fontFamily = {
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'Menlo' }),
  // sans uses the OS default — do not set fontFamily for sans text, only fontWeight.
};

export const font = {
  display: 40,
  h1: 34,
  h2: 22,
  body: 15,
  small: 13,
  tiny: 11,
  monoStat: 28,
  monoSmall: 13,
};

export const weight = {
  display: '800',
  h1: '800',
  h2: '700',
  body: '400',
  semibold: '600',
  bold: '700',
};

export const tracking = {
  display: -0.5,
  h1: -0.5,
  h2: -0.2,
  body: 0,
  label: 1.5, // uppercase section labels / numbered captions — wide tracking, terminal feel
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 28,
  xl: 40,
  xxl: 64,
};

export const radius = {
  none: 0,
  sm: 2,
  md: 4,
  pill: 999,
};

export const border = {
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  thick: 1.5,
};

export default { colors, fontFamily, font, weight, tracking, spacing, radius, border };
