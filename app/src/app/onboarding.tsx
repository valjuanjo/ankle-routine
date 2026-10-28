import { router } from 'expo-router';
import { useState } from 'react';
import { Button, Check, Choice, H1, P, SafetyCard, Screen, StandardNotice } from '../components/ui';
import { useApp } from '../lib/state';

// Language and country → consent → fixed safety checklist. Nothing is sent anywhere.
export default function Onboarding() {
  const { s, settings, update } = useApp();
  const [step, setStep] = useState<'lang' | 'consent' | 'safety'>('lang');
  const [consent, setConsent] = useState([false, false, false]);
  const [safetyOk, setSafetyOk] = useState(false);

  if (step === 'lang') {
    return (
      <Screen edges={['top', 'bottom']}>
        <H1>{s.appName}</H1>
        <P>{s.chooseLang}</P>
        <Choice title="Español" selected={settings.lang === 'es'} onPress={() => update({ lang: 'es' })} />
        <Choice title="English" selected={settings.lang === 'en'} onPress={() => update({ lang: 'en' })} />
        <P style={{ marginTop: 20 }}>{s.whereAreYou}</P>
        <Choice title={s.countryPE} selected={settings.country === 'PE'} onPress={() => update({ country: 'PE' })} />
        <Choice title={s.countryUS} selected={settings.country === 'US'} onPress={() => update({ country: 'US' })} />
        <Button title={s.next} onPress={() => setStep('consent')} />
      </Screen>
    );
  }

  if (step === 'consent') {
    const labels = [s.consentNotDiagnosis, s.consentNoMonitoring, s.consentSharing];
    return (
      <Screen edges={['top', 'bottom']}>
        <H1>{s.beforeYouStart}</H1>
        <StandardNotice />
        {labels.map((label, i) => (
          <Check key={label} label={label} value={consent[i]} onChange={(v) => setConsent((c) => c.map((x, j) => (j === i ? v : x)))} />
        ))}
        <Button title={s.agree} disabled={!consent.every(Boolean)} onPress={async () => {
          await update({ consentAt: new Date().toISOString() });
          setStep('safety');
        }} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <H1>{s.safetyTitle}</H1>
      <SafetyCard />
      <Check label={s.safetyNoneApply} value={safetyOk} onChange={setSafetyOk} />
      <Button title={s.next} disabled={!safetyOk} onPress={async () => {
        await update({ onboarded: true });
        router.replace('/start');
      }} />
    </Screen>
  );
}
