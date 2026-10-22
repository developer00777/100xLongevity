import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, Tabs } from 'expo-router';
import { ColorValue, Pressable, Text } from 'react-native';
import { TIERS } from '../../engine/engine';
import { useAssessment } from '../../state/AssessmentContext';
import { mono, useTheme } from '../../theme';

function TierChip() {
  const t = useTheme();
  const { A } = useAssessment();
  const has = A.tier != null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={has ? `Your tier is ${TIERS[A.tier!]}. Open results` : 'No tier yet. Open results'}
      onPress={() => router.navigate('/results')}
      style={{ marginRight: 14, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: has ? t.tiers[A.tier!] : t.surface2 }}
    >
      <Text style={[mono, { fontWeight: '700', fontSize: 13, color: has ? t.onTier : t.muted }]}>{has ? `${TIERS[A.tier!]} ›` : 'No tier yet'}</Text>
    </Pressable>
  );
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icon = (name: IconName) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color as string} size={size} />;

export default function TabsLayout() {
  const t = useTheme();
  const { acknowledged } = useAssessment();
  if (!acknowledged) return <Redirect href="/welcome" />;
  return (
    <Tabs
      screenOptions={{
        headerTitle: () => <Text style={{ fontSize: 19, fontWeight: '800', color: t.ink }}><Text style={{ color: t.accent }}>100X</Text> Longevity</Text>,
        headerTitleAlign: 'left',
        headerRight: () => <TierChip />,
        headerStyle: { backgroundColor: t.bg },
        headerShadowVisible: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.surface, borderTopColor: t.line },
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        sceneStyle: { backgroundColor: t.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Intake', tabBarIcon: icon('clipboard-outline') }} />
      <Tabs.Screen name="results" options={{ title: 'Results', tabBarIcon: icon('stats-chart-outline') }} />
      <Tabs.Screen name="matrix" options={{ title: 'Matrix', tabBarIcon: icon('grid-outline') }} />
      <Tabs.Screen name="ask" options={{ title: 'Ask', tabBarIcon: icon('chatbubble-ellipses-outline') }} />
      <Tabs.Screen name="rules" options={{ title: 'Rules', tabBarIcon: icon('document-text-outline') }} />
    </Tabs>
  );
}
