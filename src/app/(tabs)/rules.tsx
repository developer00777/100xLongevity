import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Body, Bullets, Card, DISCLAIMER, H1, H2, Pill, Small } from '../../components/ui';
import { TierIndex } from '../../engine/engine';
import { useTheme } from '../../theme';

const RULES: [TierIndex, string, string][] = [
  [0, 'Most markers at 100X, no major weak domain', 'More than half the tests at 100X, and every area scores 95X or more'],
  [1, 'Most markers at 95X, several at 100X', 'More than half at 95X or better, at least 3 tests at 100X, and every area scores 90X or more'],
  [2, 'Most markers at 90X, no major bottlenecks', 'More than half at 90X or better, no test Below 70X, and every area scores 80X or more'],
  [3, 'Most markers at 80X, few weak markers', 'More than half at 80X or better, and no more than 3 tests at 70X or Below 70X'],
  [4, 'Most markers at 70X, some at 80X', 'More than half at 70X or better, and at least 1 test at 80X or better'],
  [5, 'Most markers below 70X, or multiple major bottlenecks', 'Does not meet 70X criteria'],
];
const PROGRAMS: [TierIndex, string, string][] = [
  [5, 'Foundation Program', '70X first, then 80X'],
  [4, 'Foundation Program', '80X'],
  [3, 'Optimization Program', '90X'],
  [2, 'Elite Program', '95X, then 100X'],
  [1, 'Elite Program', '100X'],
  [0, 'Ultra Program', 'Beyond 100X / 100x+ Longevity'],
];
const MEALS = [['Under 60 kg', '1500', '1500', '1700'], ['60–70 kg', '1700', '1500', '2000'], ['70–80 kg', '2000', '1700', '2500'], ['80–100 kg', '2500', '2000', '3000'], ['Over 100 kg', '3000', '2500', '3000']];

export default function Rules() {
  const t = useTheme();
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
      <View style={{ gap: 2 }}>
        <H1>How scoring works</H1>
        <Small>Tier rules, programs and meal plans used by the 100x Longevity assessment.</Small>
      </View>
      <Card style={{ gap: 12 }}>
        <H2>Final tier rules</H2>
        <Small>Checked from 100X down; the highest tier you qualify for is assigned. A single excellent marker never cancels a major bottleneck.</Small>
        {RULES.map(([i, pat, rule]) => (
          <View key={i} style={{ gap: 4, borderTopWidth: 1, borderTopColor: t.line, paddingTop: 10 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Pill i={i} /><Text style={{ flex: 1, fontWeight: '700', color: t.ink }}>{pat}</Text></View>
            <Small>{rule}</Small>
          </View>
        ))}
      </Card>
      <Card style={{ gap: 8 }}>
        <H2>Domain scoring</H2>
        <Bullets items={[
          'Each domain starts from the average of its marker tiers.',
          'Metabolic Health and Inflammation are bottleneck-sensitive: the domain can be at most one tier above its weakest marker.',
          'Any marker Below 70X caps its domain at 80X.',
          'Confidence is High with biomarkers plus fitness, body composition and sleep/recovery; Moderate with useful data but gaps; Low with only basics.',
        ]} />
      </Card>
      <Card style={{ gap: 10 }}>
        <H2>Program assignment</H2>
        {PROGRAMS.map(([i, prog, tgt]) => (
          <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: t.line, paddingTop: 10 }}>
            <Pill i={i} />
            <View style={{ flex: 1 }}><Text style={{ fontWeight: '700', color: t.ink }}>{prog}</Text><Small>Target: {tgt}</Small></View>
          </View>
        ))}
      </Card>
      <Card style={{ gap: 8 }}>
        <H2>Meal plan</H2>
        <View style={{ flexDirection: 'row' }}>
          {['Weight', 'Baseline', 'Fat loss', 'Gain'].map((h, k) => <Text key={h} style={{ flex: k ? 1 : 1.4, fontSize: 11, fontWeight: '800', color: t.muted, textTransform: 'uppercase' }}>{h}</Text>)}
        </View>
        {MEALS.map((r) => (
          <View key={r[0]} style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: t.line, paddingTop: 8 }}>
            {r.map((c, k) => <Text key={k} style={{ flex: k ? 1 : 1.4, color: t.ink, fontWeight: k ? '400' : '700' }}>{c}</Text>)}
          </View>
        ))}
        <Small>Body recomposition and maintenance use the baseline plan. Custom calories and macros are not calculated. Nutrition, training, supplement, sleep and fasting protocols are inside your assigned program in 100x Longevity.</Small>
      </Card>
      <Card style={{ gap: 12 }}>
        <H2>About</H2>
        <Body muted>{DISCLAIMER}</Body>
        <Body muted>Your answers are stored only on this device. Ranges marked as scorecard estimates are pending medical review.</Body>
        <Pressable onPress={() => router.navigate('/account')} accessibilityRole="button"><Text style={{ color: t.accent, fontWeight: '800' }}>Account, privacy & data settings ›</Text></Pressable>
      </Card>
    </ScrollView>
  );
}
