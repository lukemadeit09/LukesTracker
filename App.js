// App root: black themed safe area, app state, and a text-first bottom-tab
// nav between Home, Goals, Stats and Settings.

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import DashboardScreen from './src/screens/DashboardScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors, spacing, font, weight, tracking, fontFamily, border } from './src/theme';

const TABS = [
  { key: 'home', index: '01', label: 'Home', screen: DashboardScreen },
  { key: 'goals', index: '02', label: 'Goals', screen: GoalsScreen },
  { key: 'stats', index: '03', label: 'Stats', screen: StatsScreen },
  { key: 'settings', index: '04', label: 'Settings', screen: SettingsScreen },
];

function LoadingMark() {
  const pulse = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.5, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.2, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View style={[styles.loadingMark, { opacity: pulse }]} />
  );
}

function Root() {
  const { ready } = useApp();
  const [active, setActive] = useState('home');
  const insets = useSafeAreaInsets();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <LoadingMark />
        <ActivityIndicator color={colors.white} size="large" />
        <Text style={styles.loadingText}>Loading your progress…</Text>
      </View>
    );
  }

  const ActiveScreen = TABS.find((t) => t.key === active).screen;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={{ flex: 1 }}>
        <ActiveScreen />
      </View>

      {/* Bottom tab bar — sits flush at the physical bottom of the screen. */}
      <View style={[styles.tabBar, { paddingBottom: spacing.sm + insets.bottom }]}>
        {TABS.map((t) => {
          const focused = t.key === active;
          return (
            <Pressable key={t.key} style={styles.tab} onPress={() => setActive(t.key)}>
              <Text style={[styles.tabIndex, focused && styles.tabIndexActive]}>{t.index}</Text>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{t.label}</Text>
              <View style={[styles.tabUnderline, focused && styles.tabUnderlineActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SafeAreaProvider>
        <View style={styles.safe}>
          <StatusBar style="light" />
          <Root />
        </View>
      </SafeAreaProvider>
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: border.thin,
    borderColor: colors.white,
    marginBottom: spacing.md,
  },
  loadingText: { color: colors.textMuted, marginTop: spacing.sm, fontSize: font.small },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: border.thin,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xs },
  tabIndex: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    color: colors.gray500,
  },
  tabIndexActive: { color: colors.white },
  tabLabel: {
    fontSize: font.small,
    fontWeight: weight.semibold,
    color: colors.gray500,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  tabLabelActive: { color: colors.white },
  tabUnderline: {
    height: 2,
    width: 24,
    marginTop: spacing.xs,
    backgroundColor: 'transparent',
  },
  tabUnderlineActive: { backgroundColor: colors.white },
});
