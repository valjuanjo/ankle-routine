import { Alert, Pressable, Text, View } from 'react-native';
import { Card, colors, H2, P, Screen } from '../../components/ui';
import { formatDay } from '../../lib/report';
import { calendarDays, painTrend, parseDay, toDay, weekStats } from '../../lib/schedule';
import { useApp } from '../../lib/state';

// Calendar of completed sessions, week-by-week completion and pain trend.
export default function Progress() {
  const { s, settings, routine, sessions, removeSession } = useApp();
  const today = toDay(new Date());
  const doneDays = new Set(sessions.map((x) => x.day));
  const planned = routine?.routine.days ?? [];
  const weeks = routine ? weekStats(routine.startedOn, planned, sessions, today) : [];
  const trend = painTrend(sessions).slice(-14);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {s.days.map((d) => (
          <Text key={d} style={{ width: `${100 / 7}%`, textAlign: 'center', color: colors.muted, fontSize: 12, marginBottom: 4 }}>{d}</Text>
        ))}
        {calendarDays(today, 5).map((d) => {
          const done = doneDays.has(d);
          const isPlanned = !!routine && d >= routine.startedOn && planned.includes(parseDay(d).getDay());
          return (
            <View key={d} style={{ width: `${100 / 7}%`, padding: 2 }}>
              <View accessibilityLabel={`${formatDay(d, settings.lang)}${done ? ' ✓' : ''}`}
                style={{ paddingVertical: 8, borderRadius: 8, alignItems: 'center', opacity: d > today ? 0.35 : 1,
                  backgroundColor: done ? colors.brand : '#fff', borderWidth: 1.5,
                  borderColor: d === today ? colors.ink : isPlanned ? colors.brand : colors.line }}>
                <Text style={{ color: done ? '#fff' : colors.ink, fontWeight: done ? '700' : '400' }}>{parseDay(d).getDate()}</Text>
              </View>
            </View>
          );
        })}
      </View>

      <H2>{s.weekByWeek}</H2>
      {weeks.length ? weeks.map((w) => (
        <View key={w.week} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ width: 90, color: colors.ink }}>{s.week} {w.week}</Text>
          <View style={{ flex: 1, height: 14, backgroundColor: colors.brandSoft, borderRadius: 7, overflow: 'hidden' }}>
            <View style={{ width: `${w.planned ? Math.min(100, (100 * w.done) / w.planned) : 0}%`, height: '100%', backgroundColor: colors.brand }} />
          </View>
          <Text style={{ width: 56, textAlign: 'right', color: colors.muted }}>{w.done}/{w.planned}</Text>
        </View>
      )) : <P muted>{s.noSessionsYet}</P>}

      <H2>{s.painTrend}</H2>
      {trend.length ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 110, gap: 4 }}>
          {trend.map((p, i) => (
            <View key={i} style={{ flex: 1, maxWidth: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, color: colors.muted }}>{p.pain}</Text>
              <View style={{ width: '100%', height: Math.max(2, p.pain * 8), backgroundColor: colors.brand, borderRadius: 3 }} />
            </View>
          ))}
        </View>
      ) : <P muted>{s.noPainYet}</P>}

      <H2>{s.history}</H2>
      {sessions.length ? sessions.map((x) => (
        <Pressable key={x.id} onLongPress={() => Alert.alert(s.deleteSession, formatDay(x.day, settings.lang), [
          { text: s.cancel, style: 'cancel' },
          { text: s.delete, style: 'destructive', onPress: () => removeSession(x.id) },
        ])}>
          <Card>
            <Text style={{ fontWeight: '600', color: colors.ink }}>{formatDay(x.day, settings.lang)}{x.pain != null ? ` · ${s.pdfPain}: ${x.pain}` : ''}</Text>
            {x.note ? <Text style={{ color: colors.muted, marginTop: 4 }}>{x.note}</Text> : null}
          </Card>
        </Pressable>
      )) : <P muted>{s.noSessionsYet}</P>}
    </Screen>
  );
}
