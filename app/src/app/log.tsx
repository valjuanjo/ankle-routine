import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, colors, P, SafetyCard, Screen } from '../components/ui';
import { useApp } from '../lib/state';

// Mark a session done, with optional pain 0–10 and a note. The safety checklist is on every log screen.
export default function Log() {
  const { s, logSession } = useApp();
  const [pain, setPain] = useState<number | null>(null);
  const [note, setNote] = useState('');
  return (
    <Screen>
      <P>{s.painNow}</P>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {Array.from({ length: 11 }, (_, i) => (
          <Pressable key={i} accessibilityRole="radio" accessibilityState={{ selected: pain === i }} accessibilityLabel={`${i}`}
            onPress={() => setPain(pain === i ? null : i)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center',
              borderColor: pain === i ? colors.brand : colors.line, backgroundColor: pain === i ? colors.brand : '#fff' }}>
            <Text style={{ color: pain === i ? '#fff' : colors.ink, fontWeight: '600' }}>{i}</Text>
          </Pressable>
        ))}
      </View>
      <P style={{ marginTop: 16 }}>{s.noteOptional}</P>
      <TextInput value={note} onChangeText={setNote} placeholder={s.notePlaceholder} multiline maxLength={500}
        style={{ minHeight: 80, borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 12, backgroundColor: '#fff', fontSize: 15, textAlignVertical: 'top' }} />
      <SafetyCard />
      <Button title={s.save} onPress={async () => {
        await logSession(pain, note.trim() || null);
        router.back();
      }} />
    </Screen>
  );
}
