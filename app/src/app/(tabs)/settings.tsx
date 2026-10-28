import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Switch, Text, TextInput, View } from 'react-native';
import { Button, Choice, colors, H2, P, Screen } from '../../components/ui';
import { CONTENT_VERSION } from '../../lib/content';
import { parseTime } from '../../lib/reminders';
import { useApp } from '../../lib/state';

export default function Settings() {
  const { s, settings, update, applyReminders, resetAll } = useApp();
  const [time, setTime] = useState(settings.reminderTime);

  const setReminders = async (on: boolean, t: string) => {
    const { hour, minute } = parseTime(t);
    const normalized = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    setTime(normalized);
    if (!(await applyReminders(on, normalized))) Alert.alert(s.notificationsDenied);
  };

  return (
    <Screen>
      <H2>{s.language}</H2>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Choice title="Español" selected={settings.lang === 'es'} onPress={() => update({ lang: 'es' })} /></View>
        <View style={{ flex: 1 }}><Choice title="English" selected={settings.lang === 'en'} onPress={() => update({ lang: 'en' })} /></View>
      </View>
      <H2>{s.country}</H2>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}><Choice title={s.countryPE} selected={settings.country === 'PE'} onPress={() => update({ country: 'PE' })} /></View>
        <View style={{ flex: 1 }}><Choice title={s.countryUS} selected={settings.country === 'US'} onPress={() => update({ country: 'US' })} /></View>
      </View>

      <H2>{s.reminders}</H2>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 }}>
        <Text style={{ fontSize: 16, color: colors.ink, flex: 1 }}>{s.remindersOn}</Text>
        <Switch value={settings.remindersOn} onValueChange={(on) => setReminders(on, time)} />
      </View>
      {settings.remindersOn ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={{ fontSize: 16, color: colors.ink }}>{s.reminderTime}</Text>
          <TextInput value={time} onChangeText={setTime} onEndEditing={() => setReminders(true, time)} keyboardType="numbers-and-punctuation"
            maxLength={5} style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 10, width: 90, fontSize: 16, backgroundColor: '#fff' }} />
        </View>
      ) : null}

      <Button kind="secondary" title={s.addToCalendar} onPress={() => router.push('/calendar')} />
      <Button kind="secondary" title={s.changeRoutine} onPress={() => router.push('/start')} />

      <H2>{s.about}</H2>
      <P muted>{s.dataOnPhone}</P>
      <P muted>{s.contentVersion}: {CONTENT_VERSION}</P>
      <Button kind="danger" title={s.deleteAll} onPress={() => Alert.alert(s.deleteAll, s.deleteAllConfirm, [
        { text: s.cancel, style: 'cancel' },
        { text: s.delete, style: 'destructive', onPress: async () => { await resetAll(); router.replace('/onboarding'); } },
      ])} />
    </Screen>
  );
}
