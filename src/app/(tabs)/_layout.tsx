import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, Tabs } from 'expo-router';
import { ColorValue, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Avatar, Brand, LayoutSwitch } from '../../components/ui';
import { TIERS } from '../../engine/engine';
import { useAssessment } from '../../state/AssessmentContext';
import { useAuth } from '../../state/AuthContext';
import { useLayoutMode } from '../../state/LayoutMode';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
      style={{ borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: has ? t.tiers[A.tier!] : t.surface2 }}
    >
      <Text style={[mono, { fontWeight: '700', fontSize: 13, color: has ? t.onTier : t.muted }]}>{has ? `${TIERS[A.tier!]} ›` : 'No tier yet'}</Text>
    </Pressable>
  );
}

function HeaderRight() {
  const t = useTheme();
  const { user, signOut } = useAuth();
  const { wide } = useLayoutMode();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 }}>
      {wide ? <LayoutSwitch /> : null}
      <TierChip />
      <Pressable accessibilityRole="button" accessibilityLabel="Account and settings" onPress={() => router.navigate('/account')} hitSlop={6}>
        <Avatar email={user?.email ?? ''} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out"
        onPress={signOut}
        hitSlop={6}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 5, height: 32, paddingHorizontal: 10, justifyContent: 'center',
          borderRadius: 999, borderWidth: 1, borderColor: t.line, backgroundColor: pressed ? t.surface2 : t.surface })}
      >
        <Ionicons name="log-out-outline" size={16} color={t.alertInk} />
        <Text style={{ fontSize: 13, fontWeight: '800', color: t.alertInk }}>Log out</Text>
      </Pressable>
    </View>
  );
}

const SIDEBAR = 220;
const CONTENT = 960;

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icon = (name: IconName) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} color={color as string} size={size} />;

export default function TabsLayout() {
  const t = useTheme();
  const { acknowledged } = useAssessment();
  const { wide } = useLayoutMode();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  if (!acknowledged) return <Redirect href="/welcome" />;
  // Web layout: sidebar navigation, and screens kept to a readable width in the space beside it.
  const side = Math.max(0, (width - SIDEBAR - CONTENT) / 2);
  return (
    <Tabs
      screenOptions={{
        headerTitle: () => <Brand />,
        headerTitleAlign: 'left',
        headerRight: () => <HeaderRight />,
        headerStyle: wide ? { backgroundColor: t.bg } : { backgroundColor: t.surface, borderBottomWidth: 1, borderBottomColor: t.line },
        headerShadowVisible: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.muted,
        // The active tab sits on a soft pill.
        tabBarActiveBackgroundColor: t.surface2,
        tabBarItemStyle: { borderRadius: 12, marginHorizontal: wide ? 8 : 3, marginVertical: wide ? 2 : 0 },
        tabBarStyle: wide ? { backgroundColor: t.surface, borderRightColor: t.line, width: SIDEBAR, paddingTop: 12 } : { backgroundColor: t.surface, borderTopColor: t.line, height: 64 + insets.bottom, paddingTop: 6, paddingBottom: 8 + insets.bottom },
        tabBarLabelStyle: { fontWeight: '700', fontSize: wide ? 15 : 11 },
        ...(wide ? { tabBarPosition: 'left' as const, tabBarVariant: 'material' as const, tabBarLabelPosition: 'beside-icon' as const } : {}),
        sceneStyle: { backgroundColor: t.bg, paddingHorizontal: wide ? side : 0 },
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
