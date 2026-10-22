import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AssessmentProvider, useAssessment } from '../state/AssessmentContext';
import { AuthProvider, useAuth } from '../state/AuthContext';
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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Session />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
