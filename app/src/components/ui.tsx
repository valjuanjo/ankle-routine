import type { ReactNode } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { intendedUse, safety } from '../lib/content';
import { useApp } from '../lib/state';

export const colors = {
  ink: '#1d2433',
  muted: '#5b6577',
  brand: '#0f4c5c',
  brandSoft: '#e6f0f2',
  danger: '#b42318',
  dangerSoft: '#fff5f4',
  line: '#d5dbe1',
  bg: '#f6f7f9',
  card: '#ffffff',
};

export function Screen({ children, edges = ['bottom'] }: { children: ReactNode; edges?: ('top' | 'bottom')[] }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={edges}>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function H1({ children }: { children: ReactNode }) {
  return <Text style={st.h1}>{children}</Text>;
}
export function H2({ children }: { children: ReactNode }) {
  return <Text style={st.h2}>{children}</Text>;
}
export function P({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: object }) {
  return <Text style={[st.p, muted && { color: colors.muted }, style]}>{children}</Text>;
}

export function Button({ title, onPress, disabled, kind = 'primary', style }: {
  title: string; onPress: () => void; disabled?: boolean; kind?: 'primary' | 'secondary' | 'danger'; style?: ViewStyle;
}) {
  const bg = kind === 'primary' ? colors.brand : kind === 'danger' ? colors.dangerSoft : colors.brandSoft;
  const fg = kind === 'primary' ? '#fff' : kind === 'danger' ? colors.danger : colors.brand;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} onPress={onPress} disabled={disabled}
      style={({ pressed }) => [st.btn, { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 }, style]}>
      <Text style={[st.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Choice({ title, sub, selected, onPress }: { title: string; sub?: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
      style={[st.choice, selected && { borderColor: colors.brand, backgroundColor: colors.brandSoft }]}>
      <Text style={st.choiceTitle}>{title}</Text>
      {sub ? <Text style={st.choiceSub}>{sub}</Text> : null}
    </Pressable>
  );
}

export function Check({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={st.checkRow}>
      <View style={[st.box, value && { backgroundColor: colors.brand, borderColor: colors.brand }]}>
        {value ? <Text style={{ color: '#fff', fontWeight: '700' }}>✓</Text> : null}
      </View>
      <Text style={[st.p, { flex: 1, marginBottom: 0 }]}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[st.card, style]}>{children}</View>;
}

export function Notice({ children }: { children: ReactNode }) {
  return <Text style={st.notice}>{children}</Text>;
}

/** The fixed safety checklist with tappable emergency numbers. Same for everyone (guiding rule 5). */
export function SafetyCard() {
  const { settings } = useApp();
  const list = safety[settings.lang];
  return (
    <View style={st.safety} accessibilityRole="summary">
      <Text style={st.safetyTitle}>{list.title}</Text>
      {list.items.map((i) => (
        <Text key={i} style={st.safetyItem}>• {i}</Text>
      ))}
      <Text style={[st.p, { fontWeight: '700', marginTop: 8 }]}>{list.action}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
        {list.emergency[settings.country].map((n) => (
          <Pressable key={n.number} accessibilityRole="link" onPress={() => Linking.openURL(`tel:${n.number}`)} style={st.call}>
            <Text style={{ color: colors.danger, fontWeight: '700' }}>{n.label} {n.number}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function StandardNotice() {
  const { settings } = useApp();
  return <Notice>{intendedUse.notice[settings.lang]}</Notice>;
}

export const st = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: '700', color: colors.ink, marginBottom: 12 },
  h2: { fontSize: 18, fontWeight: '700', color: colors.brand, marginTop: 20, marginBottom: 8 },
  p: { fontSize: 16, lineHeight: 22, color: colors.ink, marginBottom: 8 },
  btn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  btnText: { fontSize: 16, fontWeight: '600' },
  choice: { borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.card, borderRadius: 12, padding: 14, marginTop: 10 },
  choiceTitle: { fontSize: 16, fontWeight: '600', color: colors.ink },
  choiceSub: { fontSize: 14, color: colors.muted, marginTop: 4 },
  checkRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 10 },
  box: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  card: { backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.line, padding: 14, marginTop: 10 },
  notice: { fontSize: 14, color: colors.muted, borderLeftWidth: 3, borderLeftColor: colors.line, paddingLeft: 10, marginVertical: 10 },
  safety: { borderWidth: 2, borderColor: colors.danger, backgroundColor: colors.dangerSoft, borderRadius: 14, padding: 14, marginVertical: 12 },
  safetyTitle: { fontSize: 17, fontWeight: '700', color: colors.danger, marginBottom: 6 },
  safetyItem: { fontSize: 15, lineHeight: 21, color: colors.ink, marginBottom: 3 },
  call: { borderWidth: 1.5, borderColor: colors.danger, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff' },
});
