import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '../components/ui';
import { AppProvider, useApp } from '../lib/state';

function RootStack() {
  const { ready, s } = useApp();
  // Keep the splash-like blank screen until settings and the log are loaded from the phone.
  if (!ready) return null;
  return (
    <Stack screenOptions={{ headerTintColor: colors.brand, contentStyle: { backgroundColor: colors.bg }, headerBackTitle: s.back }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="start" options={{ title: s.howToStart }} />
      <Stack.Screen name="scan" options={{ title: s.scanTitle }} />
      <Stack.Screen name="programs" options={{ title: s.modeGeneral }} />
      <Stack.Screen name="team" options={{ title: s.modeTeam }} />
      <Stack.Screen name="log" options={{ title: s.logTitle, presentation: 'modal' }} />
      <Stack.Screen name="exercise/[id]" options={{ title: '' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="dark" />
        <RootStack />
      </AppProvider>
    </SafeAreaProvider>
  );
}
