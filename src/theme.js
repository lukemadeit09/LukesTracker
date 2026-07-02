// Lukes Tracker — central theme, v3: terminal / Swiss / techno-brutalist.
// Pure black canvas, white type, grayscale structure. Three accent colors
// exist but carry MEANING and are rationed — max two visible per screen:
//   blue  = activity / active      red = urgent / behind
//   green = done (dark fills; bright green only for small success text)

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

  // Meaning accents — use sparingly, never decoratively.
  blue: '#2b4bff',   // activity / active
  red: '#6e1423',    // urgent / behind / overdue
  green: '#0f3d28',  // done (fills, borders)
  greenBright: '#4ade80', // small "on track" / success text ONLY
  purple: '#3d1a5c', // settings icon tiles only (appearance)

  // Semantic aliases.
  background: '#000000',
  surface: 'rgba(13,13,13,0.93)', // card surface floating over background art
  surfaceSolid: '#0d0d0d',        // same tone, opaque (inputs, dock pills)
  surfaceRaised: '#141414',       // celebration panel fill
  dock: '#111111',                // floating tab dock
  border: '#232323',
  borderStrong: '#3A3A3A',
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#8A8A8A',
  textDisabled: '#5C5C5C',
  art: '#5C5C5C',
};

// Loaded in App.js via @expo-google-fonts. Weight is baked into the family
// name — do NOT combine these with fontWeight (Android would drop the family).
export const fontFamily = {
  display: 'SpaceGrotesk_700Bold',   // huge uppercase headings
  displayMed: 'SpaceGrotesk_500Medium',
  sans: 'SpaceGrotesk_400Regular',   // body copy
  mono: 'SpaceMono_400Regular',      // ALL numbers, dates, labels, captions
  monoBold: 'SpaceMono_700Bold',
};

export const font = {
  display: 42,
  h1: 32,
  h2: 20,
  body: 15,
  small: 13,
  tiny: 11,
  monoStat: 26,
  monoSmall: 12,
};

export const tracking = {
  display: -1,
  h1: -0.5,
  h2: 0,
  body: 0,
  label: 1.6, // "// 01 TODAY" captions — wide, terminal feel
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
  sm: 4,
  md: 8,
  lg: 12, // grouped settings section cards
  dock: 28, // floating tab dock + its active pill
  pill: 999,
};

export const border = {
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  thick: 1.5,
};

// Kept for legacy styles not yet migrated to the baked-weight families.
export const weight = {
  display: '700',
  h1: '700',
  h2: '700',
  body: '400',
  semibold: '600',
  bold: '700',
};

export default { colors, fontFamily, font, tracking, spacing, radius, border, weight };
