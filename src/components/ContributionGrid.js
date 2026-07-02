// GitHub-style activity grid. Columns = weeks, rows = weekdays.
// Each square fills with the accent color based on that day's score (0..1).

import React, { useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, radius, font } from '../theme';
import { dayKey, addDays, todayKey } from '../utils/dates';

const SQUARE = 14;
const GAP = 3;
const WEEKS = 18; // ~4 months of history

// Map a 0..1 score to a fill color. Empty days stay a dim slate;
// busier days glow brighter orange.
function colorForScore(score) {
  if (score <= 0) return colors.secondary + '55'; // faint slate
  if (score < 0.34) return colors.accent + '55';
  if (score < 0.67) return colors.accent + '99';
  if (score < 1) return colors.accent + 'cc';
  return colors.accent; // full day
}

export default function ContributionGrid({ scoreFor }) {
  const today = todayKey();
  const scrollRef = useRef(null);

  // Build columns of 7 days each, aligned so each column starts on Sunday.
  const weeks = useMemo(() => {
    const end = new Date();
    // Walk back to the Sunday on/just before the start of our window.
    const start = addDays(end, -(WEEKS * 7 - 1));
    start.setDate(start.getDate() - start.getDay()); // back up to Sunday

    const cols = [];
    let cursor = new Date(start);
    for (let w = 0; w < WEEKS + 1; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        col.push(dayKey(cursor));
        cursor = addDays(cursor, 1);
      }
      cols.push(col);
    }
    return cols;
  }, []);

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        testID="activity-grid-scroll"
        // Snap to the most recent weeks once the content is measured.
        // NOTE: do not replace this with a static `contentOffset` — an
        // out-of-range offset (content width isn't known up front) gets
        // applied unclamped when the screen remounts on a tab switch,
        // parking the viewport past the content so the grid looks empty.
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >
        <View style={styles.grid}>
          {weeks.map((col, ci) => (
            <View key={ci} style={styles.col}>
              {col.map((key) => {
                const future = key > today;
                const score = future ? 0 : scoreFor(key);
                return (
                  <View
                    key={key}
                    testID="grid-square"
                    style={[
                      styles.square,
                      {
                        backgroundColor: future
                          ? 'transparent'
                          : colorForScore(score),
                      },
                      key === today && styles.todayRing,
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Less</Text>
        {[0, 0.33, 0.66, 1].map((s, i) => (
          <View
            key={i}
            style={[styles.legendBox, { backgroundColor: colorForScore(s) }]}
          />
        ))}
        <Text style={styles.legendText}>More</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row' },
  col: { marginRight: GAP },
  square: {
    width: SQUARE,
    height: SQUARE,
    borderRadius: 3,
    marginBottom: GAP,
  },
  todayRing: { borderWidth: 1.5, borderColor: colors.text },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  legendText: { color: colors.muted, fontSize: font.tiny, marginHorizontal: spacing.xs },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginHorizontal: 2,
  },
});
