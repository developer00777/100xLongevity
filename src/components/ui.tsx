import Ionicons from '@expo/vector-icons/Ionicons';
import { ReactNode } from 'react';
import { Alert, Platform, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { TIERS, TierIndex } from '../engine/engine';
import { LayoutMode, useLayoutMode } from '../state/LayoutMode';
import { mono, useTheme } from '../theme';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ backgroundColor: t.surface, borderColor: t.line, borderWidth: 1, borderRadius: 16, padding: 16, boxShadow: t.shadow }, style]}>{children}</View>;
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

// Alert.alert is a no-op on web, so the web build uses the browser's confirm dialog.
export function confirmDestructive(title: string, message: string, action: string, onConfirm: () => void) {
  if (Platform.OS === 'web') { if (window.confirm(`${title}\n\n${message}`)) onConfirm(); return; }
  Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel' }, { text: action, style: 'destructive', onPress: onConfirm }]);
}

// The signed-in account's first letter in a circle; the header shows it as the way into the account screen.
export function Avatar({ email, size = 32 }: { email: string; size?: number }) {
  const t = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.45, fontWeight: '800', color: t.accentInk }}>{(email.trim()[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}

// Web only, on wide screens: switches between the phone layout and the full-width layout.
export function LayoutSwitch() {
  const t = useTheme();
  const { mode, setMode, canSwitch } = useLayoutMode();
  if (!canSwitch) return null;
  const opts: [LayoutMode, React.ComponentProps<typeof Ionicons>['name'], string][] = [['mobile', 'phone-portrait-outline', 'Mobile'], ['web', 'desktop-outline', 'Web']];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Layout" style={{ flexDirection: 'row', padding: 3, borderRadius: 999, backgroundColor: t.surface2, borderWidth: 1, borderColor: t.line }}>
      {opts.map(([m, icon, label]) => {
        const on = mode === m;
        return (
          <Pressable
            key={m}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => setMode(m)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: on ? t.surface : 'transparent', boxShadow: on ? t.shadow : undefined }}
          >
            <Ionicons name={icon} size={15} color={on ? t.accent : t.muted} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: on ? t.ink : t.muted }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// App wordmark: "100X" on an accent tile, then "Longevity".
export function Brand() {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <View style={{ backgroundColor: t.accent, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 }}>
        <Text style={{ fontSize: 14, fontWeight: '900', color: t.accentInk, letterSpacing: -0.3 }}>100X</Text>
      </View>
      <Text style={{ fontSize: 17, fontWeight: '800', color: t.ink, letterSpacing: -0.3 }}>Longevity</Text>
    </View>
  );
}

export const DISCLAIMER = 'The Health Tier is a benchmark-based scorecard estimate built on the 100X Longevity Benchmark Matrix. It is not a diagnosis and not medical advice. Do not start, stop or change medication based on this assessment.';

export const s = StyleSheet.create({
  screen: { padding: 16, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
