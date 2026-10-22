import { ScrollView, Text, View } from 'react-native';
import { Card, H1, Pill, Small } from '../../components/ui';
import { AGEB, DOMAINS, MARKERS, NOT_BENCHMARKED, TIERS } from '../../engine/engine';
import { useAssessment } from '../../state/AssessmentContext';
import { mono, useTheme } from '../../theme';

export default function Matrix() {
  const t = useTheme();
  const { A, state } = useAssessment();
  const p = A.p;
  const ok = !!p.sex && p.age != null;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
      <View style={{ gap: 2 }}>
        <H1>Your matrix</H1>
        <Small>{ok ? `${p.sex === 'M' ? 'Male' : 'Female'} · age bracket ${AGEB[p.b!]}` : 'Set age and sex in Intake to see fitness and body brackets'}</Small>
      </View>
      {DOMAINS.map((d) => {
        const dom = A.doms.find((x) => x.id === d.id);
        return (
          <Card key={d.id} style={{ padding: 0 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingBottom: 8 }}>
              <Text accessibilityRole="header" style={{ fontSize: 17, fontWeight: '800', color: t.ink }}>{d.name}</Text>
              <Pill i={dom?.i ?? null} />
            </View>
            {MARKERS.filter((m) => m.d === d.id).map((m) => {
              const needs = (m.d === 'fitness' || m.d === 'body') && !ok;
              const sc = A.scored.find((x) => x.m.id === m.id);
              const un = A.unscored.find((x) => x.m.id === m.id);
              const r = needs ? null : m.ranges({ ...p, sex: p.sex ?? 'M', b: p.b ?? 0 });
              return (
                <View key={m.id} style={{ borderTopWidth: 1, borderTopColor: t.line, padding: 14, gap: 9 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: t.ink }}>{m.label}{m.unit ? <Text style={{ fontWeight: '400', fontSize: 12, color: t.muted }}> {m.unit}</Text> : null}</Text>
                    <Text style={[mono, { color: t.ink, fontSize: 14 }]}>{sc ? sc.display : '—'}</Text>
                    {sc ? <Pill i={sc.i} /> : <Pill i={null} text={un ? 'Not scored' : 'Missing'} />}
                  </View>
                  {r ? (
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {[4, 3, 2, 1, 0].map((i) => {
                        const on = sc?.i === i;
                        return (
                          <View key={i} style={{ flex: 1, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 2, alignItems: 'center', backgroundColor: on ? t.tiers[i] : t.surface2 }}>
                            <Text style={[mono, { fontSize: 9.5, fontWeight: '700', color: on ? t.onTier : t.muted }]}>{TIERS[i]}</Text>
                            <Text style={[mono, { fontSize: 11, textAlign: 'center', color: on ? t.onTier : t.ink }]}>{r[i]}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : <Small>Enter age and sex to see your bracket.</Small>}
                </View>
              );
            })}
          </Card>
        );
      })}
      <Card style={{ padding: 0 }}>
        <Text style={{ fontSize: 17, fontWeight: '800', color: t.ink, padding: 14, paddingBottom: 8 }}>Lifestyle</Text>
        {NOT_BENCHMARKED.map((x) => (
          <View key={x.id} style={{ borderTopWidth: 1, borderTopColor: t.line, padding: 14, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: t.ink }}>{x.label}</Text>
              <Text style={[mono, { color: t.ink }]}>{String(state[x.id] || '—')}</Text>
            </View>
            <Small>Not benchmarked in uploaded documents.</Small>
          </View>
        ))}
      </Card>
      <Small>Each strip shows the cut-off for 70X → 100X (≤ lower is better, ≥ higher is better). Your tier is filled. Fitness is age- and sex-adjusted; other ranges apply at every age. Resting HR and HRV are scored under Sleep/Recovery.</Small>
    </ScrollView>
  );
}
