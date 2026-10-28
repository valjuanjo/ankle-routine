import { Stack, useLocalSearchParams } from 'expo-router';
import { Linking, Text, View } from 'react-native';
import { Button, colors, H1, H2, P, Screen } from '../../components/ui';
import { exerciseById } from '../../lib/content';
import { useApp } from '../../lib/state';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, settings } = useApp();
  const ex = exerciseById[id];
  if (!ex) return null;
  const l = settings.lang;
  return (
    <Screen>
      <Stack.Screen options={{ title: ex.name[l] }} />
      <H1>{ex.name[l]}</H1>
      {ex.video ? (
        <Button kind="secondary" title="▶ Video" onPress={() => Linking.openURL(ex.video!)} />
      ) : (
        <View style={{ aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
          <Text style={{ color: colors.brand }}>{s.videoSoon}</Text>
        </View>
      )}
      <P>{ex.instructions[l]}</P>
      <H2>{s.commonMistakes}</H2>
      {ex.mistakes[l].map((m) => <P key={m}>• {m}</P>)}
    </Screen>
  );
}
