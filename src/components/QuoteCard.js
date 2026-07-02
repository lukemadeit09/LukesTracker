// Quote of the day: mono caption, display-font quote, dim mono author.
// Rotates daily via quotes.dailyQuote — no network involved.

import React from 'react';
import { Text, StyleSheet } from 'react-native';
import Card from './Card';
import { colors, spacing, font, tracking, fontFamily } from '../theme';
import { dailyQuote } from '../utils/quotes';
import { todayKey } from '../utils/dates';

export default function QuoteCard({ index }) {
  const q = dailyQuote(todayKey());
  const num = index != null ? `${String(index).padStart(2, '0')} ` : '';
  return (
    <Card style={styles.card}>
      <Text style={styles.caption}>{`// ${num}QUOTE OF THE DAY`}</Text>
      <Text style={styles.quote}>“{q.text}”</Text>
      <Text style={styles.author}>— {q.author}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md },
  caption: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    color: colors.textMuted,
  },
  quote: {
    fontFamily: fontFamily.displayMed,
    fontSize: font.h2 - 2,
    lineHeight: 26,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  author: {
    fontFamily: fontFamily.mono,
    fontSize: font.monoSmall,
    color: colors.textDisabled,
    marginTop: spacing.sm,
  },
});
