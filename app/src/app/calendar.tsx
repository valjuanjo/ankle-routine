import { Redirect } from 'expo-router';
import { useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Card, Check, Choice, colors, H2, Notice, P, Screen } from '../components/ui';
import { addToDeviceCalendar, exportIcs, nativeCalendarAvailable, removeFromDeviceCalendar } from '../lib/calendar';
import { buildCalendarPlan, firstPlanDay, parseHHMM } from '../lib/calendarPlan';
import { daysText, describeRoutine } from '../lib/format';
import { formatDay } from '../lib/report';
import { useApp } from '../lib/state';

const WEEK_OPTIONS = [3, 6, 12];

// MVP: put the routine days into the patient's own calendar (or an .ics file for any calendar app).
export default function AddToCalendar() {
  const { s, settings, routine, update } = useApp();
  const [time, setTime] = useState(settings.reminderTime);
  const [weeks, setWeeks] = useState(routine?.routine.source === 'prescribed' ? 3 : 6);
  const [includeExercises, setIncludeExercises] = useState(true);
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const plan = useMemo(() => {
    if (!routine) return null;
    const { hour, minute } = parseHHMM(time);
    return buildCalendarPlan({
      routine: routine.routine,
      info: describeRoutine(routine.routine, settings.lang, s),
      lang: settings.lang,
      from: firstPlanDay(new Date(), `${hour}:${String(minute).padStart(2, '0')}`),
      weeks,
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      includeExercises,
    });
  }, [routine, settings.lang, s, time, weeks, includeExercises]);

  if (!routine || !plan) return <Redirect href="/start" />;
  const savedIds: string[] = settings.calendarEventIds ? JSON.parse(settings.calendarEventIds) : [];
  const addedForThisRoutine = savedIds.length > 0 && settings.calendarRoutineId === String(routine.id);
  const firstDay = plan.events.map((e) => e.firstDay).sort()[0];
  const timeText = `${String(plan.hour).padStart(2, '0')}:${String(plan.minute).padStart(2, '0')}`;

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setStatus(null);
    try { await task(); } finally { setBusy(false); }
  };

  const removeSaved = async () => {
    const { failed } = await removeFromDeviceCalendar(savedIds);
    await update({ calendarEventIds: '[]', calendarRoutineId: '' });
    return failed;
  };

  const addNative = () => run(async () => {
    if (savedIds.length) await removeSaved();
    const res = await addToDeviceCalendar(plan);
    if (res.ok) {
      await update({ calendarEventIds: JSON.stringify(res.eventIds), calendarRoutineId: String(routine.id), reminderTime: timeText });
      setStatus({ text: s.calendarAdded(res.eventIds.length) });
    } else {
      setStatus({ text: res.reason === 'denied' ? s.calendarDenied : res.reason === 'no_calendar' ? s.calendarNoWritable : s.calendarError, error: true });
    }
  });

  const remove = () => run(async () => {
    const failed = await removeSaved();
    setStatus({ text: failed ? s.calendarRemovePartly : s.calendarRemoved, error: failed > 0 });
  });

  const ics = () => run(() => exportIcs(plan, `routine-${routine.id}`, s.calendarTitle));

  return (
    <Screen>
      <P muted>{s.calendarIntro}</P>
      <Card>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>{plan.title}</Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          {daysText(routine.routine.days, s)} · {timeText} · {s.calendarDuration} {plan.durationMinutes} {s.minutes}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 2 }}>
          {s.calendarFirst}: {formatDay(firstDay, settings.lang)} · {s.calendarWeeks(weeks)}
        </Text>
        {includeExercises ? <Text style={{ color: colors.ink, marginTop: 8 }}>{plan.notes}</Text> : null}
      </Card>

      <H2>{s.calendarWhen}</H2>
      <TextInput value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" maxLength={5} accessibilityLabel={s.reminderTime}
        style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 10, width: 90, fontSize: 16, backgroundColor: '#fff' }} />

      <H2>{s.calendarFor}</H2>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {WEEK_OPTIONS.map((w) => (
          <View key={w} style={{ flex: 1 }}>
            <Choice title={s.calendarWeeks(w)} selected={weeks === w} onPress={() => setWeeks(w)} />
          </View>
        ))}
      </View>

      <Check label={s.calendarIncludeExercises} value={includeExercises} onChange={setIncludeExercises} />
      <Notice>{s.calendarPrivacy}</Notice>
      {addedForThisRoutine ? <Notice>{s.calendarAlreadyAdded}</Notice> : null}

      {nativeCalendarAvailable ? <Button title={s.calendarAddNative} disabled={busy} onPress={addNative} /> : null}
      <Button kind={nativeCalendarAvailable ? 'secondary' : 'primary'} title={s.calendarDownloadIcs} disabled={busy} onPress={ics} />
      <P muted style={{ marginTop: 6, fontSize: 14 }}>{s.calendarIcsHint}</P>
      {nativeCalendarAvailable && savedIds.length ? <Button kind="danger" title={s.calendarRemove} disabled={busy} onPress={remove} /> : null}

      {status ? (
        <Text accessibilityLiveRegion="polite" style={{ marginTop: 14, fontSize: 15, fontWeight: '600', color: status.error ? colors.danger : colors.brand }}>
          {status.text}
        </Text>
      ) : null}
    </Screen>
  );
}
