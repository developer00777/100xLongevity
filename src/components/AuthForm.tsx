import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../state/AuthContext';
import { useTheme } from '../theme';
import { Body, Button, Card, Notice, Small } from './ui';

// Shared by the sign-in and sign-up screens.
export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn, signUp, notice } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const signingUp = mode === 'sign-up';

  async function submit() {
    if (busy) return;
    setBusy(true); setError(null);
    const err = await (signingUp ? signUp : signIn)(email, password);
    // On success the router guard switches to the app; this screen unmounts.
    if (err) { setError(err); setBusy(false); }
  }

  const input = { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: t.line, backgroundColor: t.bg, paddingHorizontal: 12, fontSize: 17, color: t.ink };
  const label = { fontSize: 13, fontWeight: '700' as const, color: t.muted, marginBottom: 6 };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: t.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24, gap: 18, width: '100%', maxWidth: 460, alignSelf: 'center' }}>
        <View>
          <Text style={{ fontSize: 40, fontWeight: '800', color: t.accent, letterSpacing: -1 }}>100X</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: t.ink, letterSpacing: -0.5, marginTop: -4 }}>{signingUp ? 'Create your account' : 'Sign in'}</Text>
        </View>
        <Body muted>{signingUp ? 'Use your email and a password. Your assessment answers stay on this device; your account holds only your email and a secure password hash.' : 'Sign in to continue your 100x Longevity Assessment.'}</Body>
        {notice && !error ? <Notice>{notice}</Notice> : null}
        <Card style={{ gap: 14 }}>
          <View>
            <Text style={label}>Email</Text>
            <TextInput
              accessibilityLabel="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType={signingUp ? 'username' : 'emailAddress'}
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              placeholder="you@example.com"
              placeholderTextColor={t.muted}
              style={input}
            />
          </View>
          <View>
            <Text style={label}>Password</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput
                ref={passwordRef}
                accessibilityLabel="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!show}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={signingUp ? 'new-password' : 'current-password'}
                textContentType={signingUp ? 'newPassword' : 'password'}
                returnKeyType="go"
                onSubmitEditing={submit}
                style={[input, { flex: 1, minWidth: 0 }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={show ? 'Hide password' : 'Show password'}
                onPress={() => setShow(!show)}
                style={{ minWidth: 64, borderRadius: 12, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface2 }}
              >
                <Text style={{ fontWeight: '800', color: t.ink }}>{show ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
            {signingUp ? <Small style={{ marginTop: 4 }}>At least 8 characters.</Small> : null}
          </View>
          {error ? <Notice kind="alert">{error}</Notice> : null}
          <Button title={busy ? (signingUp ? 'Creating account…' : 'Signing in…') : signingUp ? 'Create account' : 'Sign in'} onPress={submit} disabled={busy} />
        </Card>
        <Pressable accessibilityRole="link" onPress={() => router.replace(signingUp ? '/sign-in' : '/sign-up')} style={{ alignSelf: 'center', padding: 6 }}>
          <Text style={{ color: t.muted, fontSize: 15 }}>
            {signingUp ? 'Already have an account? ' : 'New here? '}
            <Text style={{ color: t.accent, fontWeight: '800' }}>{signingUp ? 'Sign in' : 'Create an account'}</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
