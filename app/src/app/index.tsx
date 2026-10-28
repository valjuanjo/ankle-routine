import { Redirect } from 'expo-router';
import { useApp } from '../lib/state';

export default function Index() {
  const { settings, routine } = useApp();
  if (!settings.onboarded) return <Redirect href="/onboarding" />;
  if (!routine) return <Redirect href="/start" />;
  return <Redirect href="/today" />;
}
