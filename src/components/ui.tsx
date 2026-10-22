import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { TIERS, TierIndex } from '../engine/engine';
import { mono, useTheme } from '../theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 16, padding: 16 }, style]}>{children}</View>;
}

export function H1({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text accessibilityRole="header" style={{ fontSize: 26, fontWeight: '800', color: t.ink, letterSpacing: -0.4 }}>{children}</Text>;
}
export function H2({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
      <Text accessibilityRole="header" style={{ fontSize: 17, fontWeight: '800', color: t.ink, flexShrink: 1 }}>{children}</Text>
      {right}
    </View>
  );
}
export function Body({ children, muted, style }: { children: ReactNode; muted?: boolean; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ fontSize: 15, lineHeight: 22, color: muted ? t.muted : t.ink }, style]}>{children}</Text>;
}
export function Small({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  const t = useTheme();
  return <Text style={[{ fontSize: 12.5, lineHeight: 18, color: t.muted }, style]}>{children}</Text>;
}
export function Label({ children }: { children: ReactNode }) {
  const t = useTheme();
  return <Text style={{ fontSize: 11, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: t.muted }}>{children}</Text>;
}

export function Pill({ i, text }: { i: TierIndex | null | undefined; text?: string }) {
  const t = useTheme();
  const none = i == null;
  return (
    <View style={{ backgroundColor: none ? t.surface2 : t.tiers[i!], borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 }}>
      <Text style={[mono, { fontSize: 12, fontWeight: '700', color: none ? t.muted : t.onTier }]}>{text ?? (none ? 'Missing' : TIERS[i!])}</Text>
    </View>
  );
}

export function Button({ title, onPress, kind = 'primary', disabled, style }: { title: string; onPress: () => void; kind?: 'primary' | 'secondary'; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [{
        minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16,
        backgroundColor: primary ? t.accent : t.surface, borderWidth: 1, borderColor: primary ? t.accent : t.line,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
      }, style]}
    >
      <Text style={{ fontSize: 16, fontWeight: '800', color: primary ? t.accentInk : t.ink }}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, active, onPress, dot }: { label: string; active?: boolean; onPress: () => void; dot?: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8,
        borderColor: active ? t.accent : t.line, backgroundColor: active ? t.surface2 : t.surface }}
    >
      {dot !== undefined && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot ? t.accent : t.line }} />}
      <Text style={{ fontSize: 14, fontWeight: '700', color: active ? t.ink : t.muted }}>{label}</Text>
    </Pressable>
  );
}

export function Notice({ children, kind = 'warn' }: { children: ReactNode; kind?: 'warn' | 'alert' }) {
  const t = useTheme();
  return (
    <View style={{ backgroundColor: kind === 'warn' ? t.warnBg : t.alertBg, borderRadius: 12, padding: 12 }}>
      <Text style={{ fontSize: 14, lineHeight: 20, color: kind === 'warn' ? t.warnInk : t.alertInk, fontWeight: kind === 'alert' ? '700' : '400' }}>{children}</Text>
    </View>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {items.map((x, k) => (
        <View key={k} style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={{ color: t.muted, fontSize: 15, lineHeight: 22 }}>•</Text>
          <View style={{ flex: 1 }}>{typeof x === 'string' ? <Body>{x}</Body> : x}</View>
        </View>
      ))}
    </View>
  );
}

export const DISCLAIMER = 'The Health Tier is a benchmark-based scorecard estimate built on the 100X Longevity Benchmark Matrix. It is not a diagnosis and not medical advice. Do not start, stop or change medication based on this assessment.';

export const s = StyleSheet.create({
  screen: { padding: 16, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
