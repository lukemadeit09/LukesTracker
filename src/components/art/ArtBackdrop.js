// Full-screen engraved-riso background art. Sits behind everything at very
// low opacity with a slow "breathe" loop. Purely decorative — content cards
// render on near-opaque surfaces above it, so it never touches legibility.

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, AccessibilityInfo } from 'react-native';

const ART = {
  flammarion: require('../../../assets/art/flammarion.png'),
  flammarionBlue: require('../../../assets/art/flammarion-blue.png'),
  piranesi: require('../../../assets/art/piranesi.png'),
  moon: require('../../../assets/art/moon.png'),
  dore: require('../../../assets/art/dore.png'),
};

const BREATHE_MS = 7000;

export default function ArtBackdrop({ source, min = 0.08, max = 0.12 }) {
  const opacity = useRef(new Animated.Value(min)).current;

  useEffect(() => {
    let loop;
    let cancelled = false;
    // Respect reduce-motion: hold a static opacity instead of animating.
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (cancelled) return;
      if (reduced) {
        opacity.setValue((min + max) / 2);
        return;
      }
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: max, duration: BREATHE_MS, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: min, duration: BREATHE_MS, useNativeDriver: true }),
        ])
      );
      loop.start();
    });
    return () => {
      cancelled = true;
      if (loop) loop.stop();
    };
  }, [opacity, min, max]);

  return (
    <Animated.Image
      source={ART[source]}
      style={[StyleSheet.absoluteFill, styles.img, { opacity }]}
      resizeMode="cover"
      importantForAccessibility="no"
      accessibilityElementsHidden
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  img: { width: '100%', height: '100%' },
});
