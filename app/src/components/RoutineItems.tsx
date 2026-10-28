import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { exerciseById, type RoutineItem } from '../lib/content';
import { doseText } from '../lib/format';
import { useApp } from '../lib/state';
import { colors, st } from './ui';

/** Exercise list for a routine. Tapping an exercise opens its instructions. */
export function RoutineItems({ items, linked = true }: { items: RoutineItem[]; linked?: boolean }) {
  const { s, settings } = useApp();
  return (
    <View>
      {items.map((it, i) => {
        const ex = exerciseById[it.ex];
        const body = (
          <View style={[st.card, { flexDirection: 'row', alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>{ex?.name[settings.lang] ?? it.ex}</Text>
              <Text style={{ fontSize: 14, color: colors.muted, marginTop: 2 }}>{doseText(it, s)}</Text>
            </View>
            {linked ? <Text style={{ fontSize: 22, color: colors.muted }}>›</Text> : null}
          </View>
        );
        return linked ? (
          <Pressable key={`${it.ex}-${i}`} accessibilityRole="button" onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: it.ex } })}>
            {body}
          </Pressable>
        ) : (
          <View key={`${it.ex}-${i}`}>{body}</View>
        );
      })}
    </View>
  );
}
