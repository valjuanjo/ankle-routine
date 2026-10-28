import { router } from 'expo-router';
import { useState } from 'react';
import { RoutineItems } from '../components/RoutineItems';
import { Button, Check, Choice, H2, Notice, P, Screen } from '../components/ui';
import { intendedUse, programs } from '../lib/content';
import { daysText, routineFromStage } from '../lib/format';
import { goToToday } from '../lib/nav';
import { useApp } from '../lib/state';

export default function Programs() {
  const { s, settings, routine: current, loadRoutine } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const program = programs.find((p) => p.id === selected);
  const first = program?.stages[0];

  return (
    <Screen>
      <Notice>{intendedUse.modes.general[settings.lang]}</Notice>
      {programs.map((p) => (
        <Choice key={p.id} title={p.name[settings.lang]} sub={p.for[settings.lang]} selected={p.id === selected}
          onPress={() => { setSelected(p.id); setConfirmed(false); }} />
      ))}
      {program && first ? (
        <>
          <H2>{first.name[settings.lang]}</H2>
          <P muted>{daysText(first.days, s)}</P>
          <RoutineItems items={first.items} linked={false} />
          <Notice>{s.moveOnWhen}: {first.moveOnWhen[settings.lang]}</Notice>
          {program.requiresConfirmation ? <Check label={s.confirmGeneral} value={confirmed} onChange={setConfirmed} /> : null}
          {current ? <Notice>{s.replaceRoutine}</Notice> : null}
          <Button title={s.startProgram} disabled={!!program.requiresConfirmation && !confirmed} onPress={async () => {
            await loadRoutine(routineFromStage(program.id, first));
            goToToday();
          }} />
        </>
      ) : null}
    </Screen>
  );
}
