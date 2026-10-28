import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Button, Check, Choice, colors, H2, P, Screen } from '../../components/ui';
import { intendedUse } from '../../lib/content';
import { buildShareHtml, formatDay } from '../../lib/report';
import { addDays, toDay, weekStats } from '../../lib/schedule';
import { useApp } from '../../lib/state';

const PERIODS = [1, 2, 3, 0] as const; // weeks; 0 = everything

// The patient chooses what goes in the PDF and sends it themselves through the phone's share menu.
export default function Share() {
  const { s, settings, routine, sessions } = useApp();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(3);
  const [includePain, setIncludePain] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [removed, setRemoved] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const today = toDay(new Date());
  const inPeriod = useMemo(
    () => sessions.filter((x) => period === 0 || x.day > addDays(today, -7 * period)),
    [sessions, period, today],
  );
  const chosen = inPeriod.filter((x) => !removed.has(x.id));

  const share = async () => {
    setBusy(true);
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert(s.shareUnavailable);
        return;
      }
      const html = buildShareHtml({
        lang: settings.lang,
        country: settings.country,
        routine: routine?.routine ?? null,
        sessions: chosen,
        weeks: routine ? weekStats(routine.startedOn, routine.routine.days, chosen, today) : [],
        includePain,
        includeNotes,
        createdOn: today,
      });
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: s.shareTitle });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View style={{ borderWidth: 1.5, borderColor: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: 12, padding: 12, marginBottom: 8 }}>
        <Text style={{ fontWeight: '700', color: colors.ink, fontSize: 15 }}>{intendedUse.shareNotice[settings.lang]}</Text>
      </View>
      <P muted>{s.shareHint}</P>

      <H2>{s.period}</H2>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PERIODS.map((p) => (
          <View key={p} style={{ flexBasis: '47%' }}>
            <Choice title={p ? s.lastWeeks(p) : s.allTime} selected={period === p} onPress={() => setPeriod(p)} />
          </View>
        ))}
      </View>

      <Check label={s.includePain} value={includePain} onChange={setIncludePain} />
      <Check label={s.includeNotes} value={includeNotes} onChange={setIncludeNotes} />

      <H2>{s.sessionsIncluded}</H2>
      {inPeriod.length ? inPeriod.map((x) => {
        const on = !removed.has(x.id);
        return (
          <Pressable key={x.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
            onPress={() => setRemoved((r) => { const n = new Set(r); if (on) n.add(x.id); else n.delete(x.id); return n; })}
            style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, opacity: on ? 1 : 0.4 }}>
            <Text style={{ flex: 1, color: colors.ink, textDecorationLine: on ? 'none' : 'line-through' }}>
              {formatDay(x.day, settings.lang)}
              {includePain && x.pain != null ? ` · ${x.pain}/10` : ''}
              {includeNotes && x.note ? ` · ${x.note}` : ''}
            </Text>
            <Text style={{ color: on ? colors.brand : colors.muted }}>{on ? '✓' : '✕'}</Text>
          </Pressable>
        );
      }) : <P muted>{s.noSessionsYet}</P>}

      <Button title={s.createPdf} disabled={busy} onPress={share} />
    </Screen>
  );
}
