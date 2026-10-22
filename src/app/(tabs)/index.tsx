import { router } from 'expo-router';
import { useRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Body, Button, Card, Chip, Small } from '../../components/ui';
import { Field, SECTIONS } from '../../engine/form';
import { useAssessment } from '../../state/AssessmentContext';
import { mono, useTheme } from '../../theme';

function FieldView({ f }: { f: Field }) {
  const t = useTheme();
  const { state, setField } = useAssessment();
  const value = state[f.id];

  const label = <Text style={{ fontSize: 13, fontWeight: '700', color: t.muted, marginBottom: 6 }}>{f.label}</Text>;
  const width = f.full || f.kind === 'switch' || f.kind === 'choice' ? '100%' : '47.5%';

  if (f.kind === 'switch') {
    return (
      <View style={{ width, flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: t.alertBg, borderRadius: 12, padding: 12 }}>
        <Text style={{ flex: 1, color: t.alertInk, fontSize: 14, lineHeight: 20 }}>{f.label}</Text>
        <Switch value={!!value} onValueChange={(v) => setField(f.id, v)} accessibilityLabel={f.label} />
      </View>
    );
  }
  if (f.kind === 'choice') {
    return (
      <View style={{ width }}>
        {label}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {f.options.map(([v, l]) => <Chip key={v} label={l} active={value === v} onPress={() => setField(f.id, value === v ? '' : v)} />)}
        </View>
      </View>
    );
  }
  const unitKey = f.id + '_u';
  const units = f.kind === 'number' ? f.units : undefined;
  const unit = (state[unitKey] as string) || units?.[0][0];
  return (
    <View style={{ width }}>
      {label}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <TextInput
          accessibilityLabel={f.label}
          value={typeof value === 'string' ? value : ''}
          onChangeText={(v) => setField(f.id, v)}
          keyboardType={f.kind === 'text' ? 'numbers-and-punctuation' : f.kind === 'number' && f.integer ? 'number-pad' : 'decimal-pad'}
          placeholder="—"
          placeholderTextColor={t.muted}
          returnKeyType="done"
          style={[mono, { flex: 1, minWidth: 0, width: '100%', minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.bg, paddingHorizontal: 12, fontSize: 17, color: t.ink }]}
        />
        {units && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Unit ${unit}. Tap to switch`}
            onPress={() => { const i = units.findIndex((u) => u[0] === unit); setField(unitKey, units[(i + 1) % units.length][0]); }}
            style={{ minWidth: 52, borderRadius: 12, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface2 }}
          >
            <Text style={{ fontWeight: '800', color: t.ink }}>{unit}</Text>
          </Pressable>
        )}
      </View>
      {'hint' in f && f.hint ? <Small style={{ marginTop: 4 }}>{f.hint}</Small> : null}
    </View>
  );
}

export default function Intake() {
  const t = useTheme();
  const { step, setStep, state, isExample, loadExample, reset } = useAssessment();
  const scroll = useRef<ScrollView>(null);
  const sec = SECTIONS[step];
  const last = step === SECTIONS.length - 1;
  const go = (n: number) => { setStep(Math.max(0, Math.min(SECTIONS.length - 1, n))); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const has = (i: number) => SECTIONS[i].fields.some((f) => f.kind !== 'switch' && String(state[f.id] ?? '').trim() !== '');
  const empty = Object.keys(state).length === 0;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 24 }}>
        {isExample && (
          <View style={{ backgroundColor: t.surface2, borderRadius: 12, padding: 12, gap: 6 }}>
            <Body>Example client loaded (55-year-old male). These are not your numbers.</Body>
            <Pressable onPress={reset} accessibilityRole="button"><Text style={{ color: t.accent, fontWeight: '800', fontSize: 15 }}>Start my own assessment</Text></Pressable>
          </View>
        )}
        {step === 0 && (
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: t.ink, letterSpacing: -0.4 }}>Welcome to the 100x Longevity Assessment.</Text>
            <Body muted>I'll estimate your Health Tier, assign your program and find your biggest bottlenecks. Start with the basics; your tier updates as you type.</Body>
            {empty && <Pressable onPress={loadExample} accessibilityRole="button" style={{ marginTop: 6 }}><Text style={{ color: t.accent, fontWeight: '800', fontSize: 15 }}>See an example client first</Text></Pressable>}
          </View>
        )}
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Small style={{ fontWeight: '700' }}>Step {step + 1} of {SECTIONS.length}</Small>
            <Small style={{ fontWeight: '700' }}>Skip anything you don't have</Small>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: t.surface2, overflow: 'hidden' }}>
            <View style={{ height: 6, width: `${((step + 1) / SECTIONS.length) * 100}%`, backgroundColor: t.accent }} />
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {SECTIONS.map((x, i) => <Chip key={x.id} label={x.short} active={i === step} dot={has(i)} onPress={() => go(i)} />)}
        </ScrollView>
        <Card style={{ gap: 14 }}>
          <View style={{ gap: 4 }}>
            <Text accessibilityRole="header" style={{ fontSize: 21, fontWeight: '800', color: t.ink }}>{sec.title}</Text>
            <Small>{sec.hint}</Small>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 }}>
            {sec.fields.map((f) => <FieldView key={f.id} f={f} />)}
          </View>
        </Card>
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: t.bg, borderTopWidth: 1, borderTopColor: t.line }}>
        <Button title="Back" kind="secondary" disabled={step === 0} onPress={() => go(step - 1)} style={{ flex: 1 }} />
        <Button title={last ? 'See my results' : 'Next'} onPress={() => (last ? router.navigate('/results') : go(step + 1))} style={{ flex: 2 }} />
      </View>
    </KeyboardAvoidingView>
  );
}
