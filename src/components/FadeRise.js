// Mount animation: fade in + rise. Give siblings increasing `order` for the
// staggered cascade. Fast and subtle; respects reduce-motion.

import React, { useEffect, useRef } from 'react';
import { Animated, AccessibilityInfo } from 'react-native';

const STEP_MS = 60; // stagger between siblings
const DUR_MS = 260;
const RISE_PX = 10;

export default function FadeRise({ order = 0, style, children }) {
  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    let anim = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        t.setValue(1);
        return;
      }
      anim = Animated.timing(t, {
        toValue: 1,
        duration: DUR_MS,
        delay: order * STEP_MS,
        useNativeDriver: true,
      });
      anim.start();
    });
    return () => {
      cancelled = true;
      // Stop any in-flight/delayed animation so its timer can't outlive us.
      if (anim) anim.stop();
    };
  }, [t, order]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: t,
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [RISE_PX, 0] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
