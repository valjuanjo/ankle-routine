import { Redirect, router } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { RoutineItems } from '../../components/RoutineItems';
import { Button, Card, colors, H1, Notice, P, Screen } from '../../components/ui';
import { daysText, describeRoutine, intendedUseFor, routineFromStage } from '../../lib/format';
import { isPlannedDay, toDay, weekStats } from '../../lib/schedule';
import { useApp } from '../../lib/state';

export default function Today() {
  const { s, settings, routine, sessions, loadRoutine } = useApp();
  if (!routine) return <Redirect href="/start" />;
  const r = routine.routine;
  const info = describeRoutine(r, settings.lang, s);
  const today = toDay(new Date());
  const doneToday = sessions.some((x) => x.day === today);
  const week = weekStats(routine.startedOn, r.days, sessions, today).at(-1);

  const nextStage = () => {
    const next = info.nextStage;
    if (!next || !r.programId) return;
    Alert.alert(s.nextStage, s.nextStageConfirm, [
      { text: s.cancel, style: 'cancel' },
      { text: s.next, onPress: () => loadRoutine(routineFromStage(r.programId!, next)) },
    ]);
  };

  return (
    <Screen>
      <H1>{info.title}</H1>
      <P muted>{info.stage ? `${s.stage}: ${info.stage} · ` : ''}{daysText(r.days, s)}</P>
      <Notice>{intendedUseFor(r, settings.lang)}</Notice>
      {r.note ? <P>“{r.note}”</P> : null}
      <Card style={{ backgroundColor: doneToday ? colors.brandSoft : colors.card }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.ink }}>
          {doneToday ? `✓ ${s.doneToday}` : isPlannedDay(r.days, today) ? s.plannedToday : s.notPlannedToday}
        </Text>
        {week ? <Text style={{ color: colors.muted, marginTop: 4 }}>{s.thisWeek}: {week.done} {s.of} {week.planned} {s.sessionsDone}</Text> : null}
      </Card>
      <RoutineItems items={r.items} />
      <Button title={s.logSession} onPress={() => router.push('/log')} />
      {info.moveOnWhen ? (
        <View style={{ marginTop: 12 }}>
          <Notice>{s.moveOnWhen}: {info.moveOnWhen}</Notice>
          {info.nextStage ? <Button kind="secondary" title={s.nextStage} onPress={nextStage} /> : null}
        </View>
      ) : null}
    </Screen>
  );
}
