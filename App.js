// App root: dark themed safe area, app state, and a simple bottom-tab nav
// between Home, Goals, Stats and Settings.

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from './src/context/AppContext';
import DashboardScreen from './src/screens/DashboardScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import StatsScreen from './src/screens/StatsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { colors, spacing, font } from './src/theme';

const TABS = [
  { key: 'home', label: 'Home', icon: '◆', screen: DashboardScreen },
  { key: 'goals', label: 'Goals', icon: '◎', screen: GoalsScreen },
  { key: 'stats', label: 'Stats', icon: '▤', screen: StatsScreen },
  { key: 'settings', label: 'Settings', icon: '⚙', screen: SettingsScreen },
];

function Root() {
  const { ready } = useApp();
  const [active, setActive] = useState('home');

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accent} size="large" />
        <Text style={styles.loadingText}>Loading your progress…</Text>
      </View>
    );
  }

  const ActiveScreen = TABS.find((t) => t.key === active).screen;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <ActiveScreen />
      </View>

      {/* Bottom tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t) => {
          const focused = t.key === active;
          return (
            <Pressable key={t.key} style={styles.tab} onPress={() => setActive(t.key)}>
              <Text style={[styles.tabIcon, focused && styles.tabActive]}>{t.icon}</Text>
              <Text style={[styles.tabLabel, focused && styles.tabActive]}>{t.label}</Text>
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
      <SafeAreaView style={styles.safe}>
        <StatusBar style="light" />
        <Root />
      </SafeAreaView>
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
  loadingText: { color: colors.muted, marginTop: 12 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.secondary + '55',
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIcon: { color: colors.muted, fontSize: 18 },
  tabLabel: { color: colors.muted, fontSize: font.tiny, marginTop: 2 },
  tabActive: { color: colors.accent },
});
