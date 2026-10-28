import { router } from 'expo-router';
import { Choice, Screen } from '../components/ui';
import { useApp } from '../lib/state';

export default function Start() {
  const { s } = useApp();
  return (
    <Screen>
      <Choice title={s.modePrescribed} sub={s.modePrescribedSub} onPress={() => router.push('/scan')} />
      <Choice title={s.modeGeneral} sub={s.modeGeneralSub} onPress={() => router.push('/programs')} />
      <Choice title={s.modeTeam} sub={s.modeTeamSub} onPress={() => router.push('/team')} />
    </Screen>
  );
}
