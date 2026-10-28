import { router } from 'expo-router';
import { RoutineItems } from '../components/RoutineItems';
import { Button, H2, Notice, P, Screen } from '../components/ui';
import { intendedUse, teamWarmup } from '../lib/content';
import { daysText, routineFromTeamWarmup } from '../lib/format';
import { goToToday } from '../lib/nav';
import { useApp } from '../lib/state';

// Team mode in the IUP is local only: the coach's QR code or the standard warm-up.
// Coach-side aggregate counts need a backend and come in Phase 2.
export default function Team() {
  const { s, settings, routine: current, loadRoutine } = useApp();
  return (
    <Screen>
      <Notice>{intendedUse.modes.team[settings.lang]}</Notice>
      <Button title={s.modePrescribedSub} onPress={() => router.push('/scan')} />
      <H2>{teamWarmup.name[settings.lang]} · {teamWarmup.minutes} min</H2>
      <P muted>{teamWarmup.frequency[settings.lang]} · {daysText(teamWarmup.days, s)}</P>
      <RoutineItems items={teamWarmup.blocks.flatMap((b) => b.items)} linked={false} />
      {current ? <Notice>{s.replaceRoutine}</Notice> : null}
      <Button kind="secondary" title={s.useStandardWarmup} onPress={async () => {
        await loadRoutine(routineFromTeamWarmup());
        goToToday();
      }} />
    </Screen>
  );
}
