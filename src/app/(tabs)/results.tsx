import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Body, Bullets, Button, Card, DISCLAIMER, H2, Label, Notice, Pill, Small } from '../../components/ui';
import { accuracyNote, domainReason, EQUIV, explanation, joinList, markersUsed, mealReason, reportText, shareText, TIERS } from '../../engine/engine';
import { useAssessment } from '../../state/AssessmentContext';
import { mono, useTheme } from '../../theme';

const URGENT = 'If you have chest pain, fainting, severe shortness of breath, neurological symptoms or a dangerous lab or blood pressure reading, seek medical care promptly. This app cannot evaluate urgent symptoms.';

function Fact({ label, value }: { label: string; value: string }) {
  const t = useTheme();
  return (
    <View style={{ flexBasis: '47%', flexGrow: 1, backgroundColor: t.surface2, borderRadius: 12, padding: 12, gap: 2 }}>
      <Label>{label}</Label>
      <Text style={{ fontSize: 15, fontWeight: '800', color: t.ink }}>{value}</Text>
    </View>
  );
}

export default function Results() {
  const t = useTheme();
  const { A, state, loadExample } = useAssessment();
  const [copied, setCopied] = useState<'report' | 'share' | 'send' | null>(null);

  if (A.tier == null || !A.target) {
    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {A.urgent && <Notice kind="alert">{URGENT}</Notice>}
        <Card style={{ alignItems: 'center', gap: 8, paddingVertical: 28 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: t.ink }}>Your tier appears here</Text>
          <Body muted style={{ textAlign: 'center' }}>Enter your age, sex and at least one marker, such as waist circumference. Every extra marker raises the confidence.</Body>
          <Button title="Go to intake" onPress={() => router.navigate('/')} style={{ alignSelf: 'stretch', marginTop: 8 }} />
          <Pressable onPress={() => { loadExample(); }} accessibilityRole="button"><Text style={{ color: t.accent, fontWeight: '800', marginTop: 6 }}>Load an example client</Text></Pressable>
        </Card>
      </ScrollView>
    );
  }

  const tier = A.tier;
  const below = A.scored.filter((x) => x.i === 5);
  const notes = [...A.scored.filter((x) => x.note).map((x) => `${x.m.label}: ${x.note}`), ...A.unscored.map((x) => `${x.m.label}: ${x.why}`)];
  const copy = async (what: 'report' | 'share' | 'send', text: string) => { await Clipboard.setStringAsync(text); setCopied(what); setTimeout(() => setCopied(null), 1600); };
  // Browsers without a share sheet (most desktops) reject Share.share; copy the text instead.
  const share = (what: 'share' | 'send', message: string) => Share.share({ message }).catch((e: unknown) => {
    if (!(e instanceof Error && e.name === 'AbortError')) return copy(what, message);
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
      {A.urgent && <Notice kind="alert">{URGENT}</Notice>}

      <Card style={{ gap: 14 }}>
        <View>
          <Text style={{ fontSize: 76, lineHeight: 80, fontWeight: '800', letterSpacing: -3, color: t.tiers[tier] }}>{TIERS[tier]}</Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: t.muted }}>{EQUIV[tier]}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }} accessibilityLabel={`Tier ladder. Current ${TIERS[tier]}, target ${A.target.t}`}>
          {[5, 4, 3, 2, 1, 0].map((i) => {
            const cur = i === tier; const tgt = A.target!.i === i;
            return (
              <View key={i} style={{ flex: 1, borderRadius: 8, paddingVertical: 9, alignItems: 'center', backgroundColor: cur ? t.tiers[i] : t.surface2, borderWidth: 2, borderStyle: tgt ? 'dashed' : 'solid', borderColor: tgt ? t.ink : 'transparent' }}>
                <Text style={[mono, { fontSize: 11, fontWeight: '700', color: cur ? t.onTier : tgt ? t.ink : t.muted }]}>{i === 5 ? '<70X' : TIERS[i]}</Text>
              </View>
            );
          })}
        </View>
        <Small>Solid = current tier · dashed = next target</Small>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Fact label="Assigned program" value={A.program!} />
          <Fact label="Target tier" value={A.target.t} />
          <Fact label="Target equivalent" value={A.target.e} />
          <Fact label="Confidence" value={A.conf} />
        </View>
      </Card>

      <Card>
        <H2>Scorecard summary</H2>
        <View style={{ gap: 12 }}>
          {A.doms.map((d) => (
            <View key={d.id} style={{ gap: 4, borderTopWidth: 1, borderTopColor: t.line, paddingTop: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: t.ink }}>{d.name}</Text>
                <Pill i={d.i} />
              </View>
              <Small>{domainReason(d)}</Small>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <H2>What raises your score</H2>
        {A.raises.length ? <View style={{ gap: 8 }}>{A.raises.map((x) => <MarkerRow key={x.m.id} label={x.m.label} value={x.display} i={x.i} />)}</View> : <Body muted>No markers at 95X or better yet.</Body>}
      </Card>
      <Card>
        <H2>What lowers your score</H2>
        {A.lowers.length ? <View style={{ gap: 8 }}>{A.lowers.map((x) => <MarkerRow key={x.m.id} label={x.m.label} value={x.display} i={x.i} />)}</View> : <Body muted>No markers at 70X or below.</Body>}
      </Card>

      <Card style={{ gap: 8 }}>
        <Label>Main bottleneck</Label>
        <Text style={{ fontSize: 22, fontWeight: '800', color: t.ink }}>{A.bott?.text ?? '—'}</Text>
        {A.bott && A.bott.markers.length > 0 && <Small>Driven by {joinList(A.bott.markers)}.</Small>}
        <Body>{explanation(A)}</Body>
        {below.length > 0 && <Notice>{`${joinList(below.map((x) => x.m.label))}: this is not a diagnosis, but ${below.length === 1 ? 'this marker is' : 'these markers are'} outside the optimal benchmark range and should be reviewed with a qualified healthcare professional.`}</Notice>}
        {notes.map((n) => <Notice key={n}>{n}</Notice>)}
      </Card>

      <Card>
        <H2>Markers used</H2>
        <Bullets items={markersUsed(A)} />
      </Card>
      <Card style={{ gap: 8 }}>
        <H2>Accuracy</H2>
        <Body>{accuracyNote(A)}</Body>
        <Text style={{ fontWeight: '800', color: t.ink, marginTop: 4 }}>Optional data that would improve accuracy</Text>
        <Bullets items={A.suggest.length ? A.suggest : ['Nothing major missing.']} />
      </Card>

      <Card style={{ gap: 8 }}>
        <H2>Nutrition plan recommendation</H2>
        {A.meal ? (
          <>
            <Text style={{ fontSize: 40, fontWeight: '800', color: t.accent }}>{A.meal.kcal}<Text style={{ fontSize: 15, color: t.muted }}> calories</Text></Text>
            <Body>{mealReason(A, state)}{!state.goal ? ' Choose a goal in the basics to adjust the plan.' : ''}</Body>
            <Small>Official plans: 1500 · 1700 · 2000 · 2500 · 3000. Baseline by weight is {A.meal.base}; fat loss moves down one level, muscle gain up one.</Small>
          </>
        ) : <Body muted>Enter your weight to get your meal plan.</Body>}
      </Card>

      <Card style={{ gap: 12 }}>
        <H2>Next steps</H2>
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: '800', color: t.ink, fontSize: 15 }}>Option 1 · Share your result</Text>
          <Small>Post an introduction inside 100x Longevity. It creates accountability and lets members support your journey.</Small>
          <View style={{ backgroundColor: t.surface2, borderRadius: 12, padding: 12 }}><Body>{shareText(A)}</Body></View>
          <Button title={copied === 'share' ? 'Copied to clipboard' : 'Share my result'} onPress={() => share('share', shareText(A))} />
        </View>
        <View style={{ gap: 4 }}>
          <Text style={{ fontWeight: '800', color: t.ink, fontSize: 15 }}>Option 2 · Keep it private</Text>
          <Small>Open the {A.program} and complete Step 1 today. Take action rather than spend time analyzing.</Small>
        </View>
        <View style={{ gap: 6 }}>
          <Text style={{ fontWeight: '800', color: t.ink, fontSize: 15 }}>Option 3 · Send for review</Text>
          <Small>Send your Health Tier, Health equivalent, program, biggest bottleneck and any questions privately to the 100x Longevity team.</Small>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title={copied === 'report' ? 'Copied' : 'Copy assessment'} kind="secondary" onPress={() => copy('report', reportText(A, state))} style={{ flex: 1 }} />
            <Button title={copied === 'send' ? 'Copied' : 'Send…'} kind="secondary" onPress={() => share('send', reportText(A, state))} style={{ flex: 1 }} />
          </View>
        </View>
        <Body><Text style={{ fontWeight: '800' }}>Your next step: </Text>open the {A.program} inside 100x Longevity and complete the first action item today.</Body>
      </Card>
      <Small>{DISCLAIMER}</Small>
    </ScrollView>
  );
}

function MarkerRow({ label, value, i }: { label: string; value: string; i: 0 | 1 | 2 | 3 | 4 | 5 }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={{ flex: 1, fontSize: 15, color: t.ink }}>{label} <Text style={[mono, { color: t.muted, fontSize: 13 }]}>{value}</Text></Text>
      <Pill i={i} />
    </View>
  );
}
