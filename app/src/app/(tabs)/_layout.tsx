import { Tabs } from 'expo-router/tabs';
import { Text, type ColorValue } from 'react-native';
import { colors } from '../../components/ui';
import { useApp } from '../../lib/state';

const icon = (glyph: string) => ({ color }: { color: ColorValue }) => <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;

export default function TabsLayout() {
  const { s } = useApp();
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colors.brand, headerTintColor: colors.ink, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="today" options={{ title: s.tabToday, tabBarIcon: icon('●') }} />
      <Tabs.Screen name="progress" options={{ title: s.tabProgress, tabBarIcon: icon('▦') }} />
      <Tabs.Screen name="share" options={{ title: s.tabShare, tabBarIcon: icon('↗') }} />
      <Tabs.Screen name="safety" options={{ title: s.tabSafety, tabBarIcon: icon('!') }} />
      <Tabs.Screen name="settings" options={{ title: s.tabSettings, tabBarIcon: icon('≡') }} />
    </Tabs>
  );
}
