import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Body, Bullets, Button, Card } from '../components/ui';
import { useAssessment } from '../state/AssessmentContext';
import { useTheme } from '../theme';

export default function Welcome() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { acknowledge } = useAssessment();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: 20, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24, gap: 18 }}>
      <Text style={{ fontSize: 40, fontWeight: '800', color: t.accent, letterSpacing: -1 }}>100X</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color: t.ink, letterSpacing: -0.5, marginTop: -12 }}>Longevity Assessment</Text>
      <Body muted>Estimate your Health Tier from your own test results, see your biggest bottlenecks and get your 100x Longevity program.</Body>
      <Card style={{ gap: 10 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: t.ink }}>Before you start</Text>
        <Bullets items={[
          'This app gives a benchmark-based estimate. It is not a medical device and does not diagnose, treat or prevent any disease.',
          'Do not start, stop or change medication based on your results. Talk to a qualified healthcare professional about any result outside the optimal range.',
          'If you have chest pain, fainting, severe shortness of breath or other urgent symptoms, seek medical care now.',
          'Your answers stay on this device. The optional Ask tab sends your question and results to Anthropic\'s Claude AI (through OpenRouter) only after you allow it.',
        ]} />
      </Card>
      <View style={{ gap: 10 }}>
        <Button title="I understand — start" onPress={() => { acknowledge(); router.replace('/'); }} />
      </View>
    </ScrollView>
  );
}
