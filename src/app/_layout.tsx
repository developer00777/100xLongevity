import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect } from 'react';
import { Platform, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LayoutSwitch } from '../components/ui';
import { AssessmentProvider, useAssessment } from '../state/AssessmentContext';
import { AuthProvider, useAuth } from '../state/AuthContext';
import { LayoutModeProvider, PHONE_WIDTH, useLayoutMode } from '../state/LayoutMode';
import { useTheme } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate() {
  const { ready } = useAssessment();
  const { user } = useAuth();
  const t = useTheme();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);
  if (!ready) return null;
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ contentStyle: { backgroundColor: t.bg } }}>
        <Stack.Protected guard={!!user}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen
            name="account"
            options={{
              title: 'Account',
              presentation: 'modal',
              headerStyle: { backgroundColor: t.bg },
              headerTintColor: t.ink,
              headerShadowVisible: false,
              headerLeft: () => null,
              headerRight: () => (
                <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: t.accent }}>Done</Text>
                </Pressable>
              ),
            }}
          />
        </Stack.Protected>
        {/* Signed out, the first available screen is sign-in. */}
        <Stack.Protected guard={!user}>
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

function Session() {
  const { ready, user } = useAuth();
  if (!ready) return null;
  // Remounts on sign-in / sign-out so each account loads its own saved answers.
  return (
    <AssessmentProvider key={user?.email ?? ''} owner={user?.email ?? null}>
      <Gate />
    </AssessmentProvider>
  );
}

// On web, wide screens show the phone layout in a centered column unless the viewer picks the web layout.
function PhoneFrame({ children }: { children: ReactNode }) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const { mode, canSwitch } = useLayoutMode();
  if (Platform.OS !== 'web') return <>{children}</>;
  const framed = mode === 'mobile' && width > PHONE_WIDTH;
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: framed ? t.surface2 : t.bg }}>
      <View
        style={[
          { flex: 1, width: '100%', maxWidth: framed ? PHONE_WIDTH : undefined, overflow: 'hidden', backgroundColor: t.bg },
          framed && { borderLeftWidth: 1, borderRightWidth: 1, borderColor: t.line, boxShadow: '0 0 32px rgba(0, 0, 0, 0.12)' },
        ]}
      >
        {children}
      </View>
      {/* In the web layout the switch sits in the header instead. */}
      {framed && canSwitch ? <View style={{ position: 'absolute', top: 16, right: 16 }}><LayoutSwitch /></View> : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LayoutModeProvider>
        <PhoneFrame>
          <AuthProvider>
            <Session />
          </AuthProvider>
        </PhoneFrame>
      </LayoutModeProvider>
    </SafeAreaProvider>
  );
}
