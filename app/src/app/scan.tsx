import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, Text, TextInput, View } from 'react-native';
import { RoutineItems } from '../components/RoutineItems';
import { Button, colors, H2, Notice, P, Screen } from '../components/ui';
import { exercises } from '../lib/content';
import { daysText, describeRoutine, intendedUseFor } from '../lib/format';
import { formatDay } from '../lib/report';
import { decodeRoutine, type Routine } from '../lib/routineCode';
import { goToToday } from '../lib/nav';
import { useApp } from '../lib/state';

const KNOWN = new Set(exercises.map((e) => e.id));

// Loads a routine from a QR code shown by the physio or coach. The code itself holds the routine.
export default function Scan() {
  const { s, settings, routine: current, loadRoutine } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<Routine | null>(null);
  const [error, setError] = useState(false);
  const [pasted, setPasted] = useState('');
  const lastCode = useRef('');

  const tryCode = (code: string) => {
    if (code === lastCode.current) return;
    lastCode.current = code;
    try {
      setScanned(decodeRoutine(code, KNOWN));
      setError(false);
    } catch {
      setError(true);
    }
  };

  if (scanned) {
    const info = describeRoutine(scanned, settings.lang, s);
    return (
      <Screen>
        <H2>{info.title}{info.stage ? ` · ${info.stage}` : ''}</H2>
        <P muted>
          {daysText(scanned.days, s)}
          {scanned.by ? ` · ${s.setBy} ${scanned.by}` : ''}
          {scanned.setOn ? ` ${s.setOn} ${formatDay(scanned.setOn, settings.lang)}` : ''}
        </P>
        <Notice>{intendedUseFor(scanned, settings.lang)}</Notice>
        {scanned.note ? <P>“{scanned.note}”</P> : null}
        <RoutineItems items={scanned.items} linked={false} />
        {current ? <Notice>{s.replaceRoutine}</Notice> : null}
        <Button title={s.next} onPress={async () => {
          await loadRoutine(scanned);
          goToToday();
        }} />
        <Button kind="secondary" title={s.cancel} onPress={() => { setScanned(null); lastCode.current = ''; }} />
      </Screen>
    );
  }

  return (
    <Screen>
      <P muted>{s.scanHint}</P>
      {Platform.OS !== 'web' && permission?.granted ? (
        <View style={{ aspectRatio: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: '#000' }}>
          <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => tryCode(data)} />
        </View>
      ) : Platform.OS !== 'web' ? (
        <View>
          <P>{s.cameraNeeded}</P>
          <Button title={s.allowCamera} onPress={requestPermission} />
        </View>
      ) : null}
      {error ? <Text style={{ color: colors.danger, marginTop: 12, fontSize: 15 }}>{s.badCode}</Text> : null}
      <H2>{s.pasteCode}</H2>
      <TextInput value={pasted} onChangeText={setPasted} placeholder="ANK1.…" autoCapitalize="none" autoCorrect={false}
        style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 10, padding: 12, backgroundColor: '#fff', fontSize: 15 }} />
      <Button kind="secondary" title={s.useCode} disabled={!pasted.trim()} onPress={() => { lastCode.current = ''; tryCode(pasted); }} />
      <Button kind="secondary" title={s.back} onPress={() => router.back()} />
    </Screen>
  );
}
