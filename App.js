// App root: loads fonts, provides state + safe area, renders the active
// screen behind a floating rounded dock tab bar.

import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { AppProvider, useApp } from './src/context/AppContext';
import DashboardScreen from './src/screens/DashboardScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors, spacing, font, tracking, fontFamily, radius } from './src/theme';

const TABS = [
  { key: 'home', label: 'Home', screen: DashboardScreen },
  { key: 'goals', label: 'Goals', screen: GoalsScreen },
  { key: 'stats', label: 'Stats', screen: StatsScreen },
  { key: 'settings', label: 'Settings', screen: SettingsScreen },
];

function Root() {
  const { ready } = useApp();
  const [active, setActive] = useState('home');
  const insets = useSafeAreaInsets();

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.white} size="large" />
        <Text style={styles.loadingText}>{'// LOADING YOUR PROGRESS'}</Text>
      </View>
    );
  }

  const ActiveScreen = TABS.find((t) => t.key === active).screen;

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      <View style={{ flex: 1 }}>
        <ActiveScreen />
      </View>

      {/* Floating dock */}
      <View style={[styles.dockWrap, { bottom: Math.max(insets.bottom, spacing.sm) + spacing.sm }]}>
        <View style={styles.dock}>
          {TABS.map((t) => {
            const focused = t.key === active;
            return (
              <Pressable
                key={t.key}
                style={[styles.dockTab, focused && styles.dockTabActive]}
                onPress={() => setActive(t.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
              >
                <Text style={[styles.dockLabel, focused && styles.dockLabelActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  if (!fontsLoaded) {
    // Keep the black screen rather than flashing unstyled text.
    return <View style={styles.safe} />;
  }

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
  loadingText: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  dockWrap: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },
  dock: {
    flexDirection: 'row',
    backgroundColor: colors.dock,
    borderRadius: radius.dock,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xs,
  },
  dockTab: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.dock - spacing.xs,
  },
  dockTabActive: {
    backgroundColor: colors.white,
  },
  dockLabel: {
    fontFamily: fontFamily.mono,
    fontSize: font.tiny,
    letterSpacing: tracking.label,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  dockLabelActive: {
    fontFamily: fontFamily.monoBold,
    color: colors.black,
  },
});
