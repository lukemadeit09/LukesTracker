// GitHub-style activity grid. Columns = weeks, rows = weekdays.
// Each square fills with a grayscale step based on that day's score (0..1);
// today is ringed in the backdrop red. Columns cascade in on mount.

import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, AccessibilityInfo } from 'react-native';
import { colors, spacing, font, tracking, fontFamily } from '../theme';
import { dayKey, addDays, todayKey } from '../utils/dates';

const SQUARE = 14;
const GAP = 3;
const WEEKS = 18; // ~4 months of history
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const CASCADE_STEP_MS = 14;

// Map a 0..1 score to a grayscale fill step.
function colorForScore(score) {
  if (score <= 0) return colors.gray100;
  if (score < 0.34) return colors.gray400;
  if (score < 0.67) return colors.gray600;
  if (score < 1) return colors.gray700;
  return colors.white; // full day = pure white
}

export default function ContributionGrid({ scoreFor }) {
  const today = todayKey();
  const scrollRef = useRef(null);

  // Build columns of 7 days each, aligned so each column starts on Sunday.
  const weeks = useMemo(() => {
    const end = new Date();
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

  // Cascade: one shared driver; each column reads a staggered window of it.
  const cascade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    let cancelled = false;
    let anim = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        cascade.setValue(1);
        return;
      }
      anim = Animated.timing(cascade, {
        toValue: 1,
        duration: weeks.length * CASCADE_STEP_MS + 220,
        useNativeDriver: true,
      });
      anim.start();
    });
    return () => {
      cancelled = true;
      if (anim) anim.stop();
    };
  }, [cascade, weeks.length]);

  return (
    <View>
      <View style={styles.gridRow}>
        {/* Weekday row labels beside the grid. */}
        <View style={styles.weekdayCol}>
          {WEEKDAY_LABELS.map((l, i) => (
            <Text key={i} style={styles.weekdayLabel}>
              {l}
            </Text>
          ))}
        </View>

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
            {weeks.map((col, ci) => {
              // Each column fades in over its own slice of the shared driver.
              const from = ci / (weeks.length + 4);
              const to = Math.min(1, (ci + 4) / (weeks.length + 4));
              const colOpacity = cascade.interpolate({
                inputRange: [from, to],
                outputRange: [0, 1],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View key={ci} style={[styles.col, { opacity: colOpacity }]}>
                  {col.map((key) => {
                    const future = key > today;
                    const score = future ? 0 : scoreFor(key);
                    const fill = colorForScore(score);
                    const isToday = key === today;
                    return (
                      <View
                        key={key}
                        testID="grid-square"
                        style={[
                          styles.square,
                          { backgroundColor: future ? 'transparent' : fill },
                          isToday && styles.todayRing,
                        ]}
                      />
                    );
                  })}
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </View>

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
  gridRow: { flexDirection: 'row' },
  weekdayCol: { justifyContent: 'flex-start', marginRight: spacing.xs },
  weekdayLabel: {
    fontFamily: fontFamily.mono,
    fontSize: 9,
    color: colors.textMuted,
    height: SQUARE,
    marginBottom: GAP,
    textAlignVertical: 'center',
    lineHeight: SQUARE,
  },
  grid: { flexDirection: 'row' },
  col: { marginRight: GAP },
  square: {
    width: SQUARE,
    height: SQUARE,
    borderRadius: 2,
    marginBottom: GAP,
  },
  // Today's ring matches Home's blood-red backdrop art.
  todayRing: { borderWidth: 1.5, borderColor: colors.red },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  legendText: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginHorizontal: 2,
  },
});
