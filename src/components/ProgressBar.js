// Thin progress bar that animates its fill to the current value on mount
// and whenever the value changes. `tone` colors the fill (default white).

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, AccessibilityInfo } from 'react-native';
import { colors, radius } from '../theme';

export default function ProgressBar({ value, height = 6, tone = colors.white }) {
  const clamped = Math.min(1, Math.max(0, value || 0));
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let anim = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        t.setValue(clamped);
        return;
      }
      anim = Animated.timing(t, {
        toValue: clamped,
        duration: 500,
        useNativeDriver: false, // width animation
      });
      anim.start();
    });
    return () => {
      cancelled = true;
      if (anim) anim.stop();
    };
  }, [clamped, t]);

  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: tone,
            borderRadius: height / 2,
            width: t.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.gray100,
    overflow: 'hidden',
  },
  fill: { height: '100%' },
});
