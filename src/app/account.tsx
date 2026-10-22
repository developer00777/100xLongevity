import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ReactNode, useState } from 'react';
import { Linking, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Avatar, Button, Card, confirmDestructive, DISCLAIMER, Label, LayoutSwitch, Notice, Pill, Small } from '../components/ui';
import { TIERS } from '../engine/engine';
import { useAssessment } from '../state/AssessmentContext';
import { useAuth } from '../state/AuthContext';
import { useLayoutMode } from '../state/LayoutMode';
import { useTheme } from '../theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ paddingHorizontal: 4 }}><Label>{title}</Label></View>
      <Card style={{ padding: 0, overflow: 'hidden' }}>{children}</Card>
    </View>
  );
}

// One tappable line in a section; `right` replaces the chevron (e.g. a switch).
function Row({ icon, label, detail, onPress, danger, right, first }: {
  icon: IconName; label: string; detail?: string; onPress?: () => void; danger?: boolean; right?: ReactNode; first?: boolean;
}) {
  const t = useTheme();
  const color = danger ? t.alertInk : t.ink;
  return (
    <Pressable
      accessibilityRole={right ? undefined : 'button'}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingHorizontal: 16, paddingVertical: 12,
        borderTopWidth: first ? 0 : 1, borderTopColor: t.line, backgroundColor: pressed ? t.surface2 : 'transparent',
      })}
    >
      <View style={{ width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: danger ? t.alertBg : t.surface2 }}>
        <Ionicons name={icon} size={18} color={danger ? t.alertInk : t.accent} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15.5, fontWeight: '700', color }}>{label}</Text>
        {detail ? <Small>{detail}</Small> : null}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={t.muted} /> : null)}
    </Pressable>
  );
}

export default function Account() {
  const t = useTheme();
  const { A, isExample, loadExample, reset, askConsent, setAskConsent } = useAssessment();
  const { user, signOut, deleteAccount } = useAuth();
  const { canSwitch } = useLayoutMode();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const privacyUrl = (Constants.expoConfig?.extra?.privacyPolicyUrl as string) || '';
  const email = user?.email ?? '';

  async function onSignOut() {
    setBusy(true);
    // On success the router guard swaps to the sign-in screen and this screen unmounts.
    await signOut();
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 22, paddingBottom: 40, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
      <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
        <Avatar email={email} size={72} />
        <View style={{ alignItems: 'center', gap: 2 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: t.ink }} numberOfLines={1}>{email}</Text>
          <Small>Signed in</Small>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={A.tier != null ? `Your tier is ${TIERS[A.tier]}. Open results` : 'No tier yet. Open intake'}
          onPress={() => router.dismissTo(A.tier != null ? '/results' : '/')}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, borderRadius: 999, paddingLeft: 6, paddingRight: 12, paddingVertical: 6, backgroundColor: t.surface2, opacity: pressed ? 0.8 : 1 })}
        >
          <Pill i={A.tier} text={A.tier == null ? 'No tier yet' : undefined} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: t.ink }}>{A.program ?? 'Start your assessment'}</Text>
          <Ionicons name="chevron-forward" size={14} color={t.muted} />
        </Pressable>
        {isExample ? <Small>Showing the example client</Small> : null}
        <Button kind="secondary" title={busy ? 'Signing out…' : 'Sign out'} onPress={onSignOut} disabled={busy} style={{ alignSelf: 'stretch', marginTop: 6 }} />
      </Card>

      {canSwitch ? (
        <Section title="Display">
          <Row first icon="browsers-outline" label="Layout" detail="Phone-sized column or full-width web view." right={<LayoutSwitch />} />
        </Section>
      ) : null}

      <Section title="Privacy & AI">
        <Row
          first
          icon="sparkles-outline"
          label="Share with Claude in Ask"
          detail="Sends your question and results, never your email, to Anthropic's Claude through OpenRouter."
          right={<Switch accessibilityLabel="Share with Claude in Ask" value={askConsent} onValueChange={setAskConsent} trackColor={{ true: t.accent, false: t.line }} />}
        />
        {privacyUrl ? <Row icon="shield-checkmark-outline" label="Privacy policy" onPress={() => Linking.openURL(privacyUrl)} /> : null}
      </Section>

      <Section title="Your answers">
        <Row first icon="flask-outline" label="Load the example client" detail="Replaces your answers with sample data." onPress={() => { loadExample(); router.dismissTo('/results'); }} />
        <Row
          danger
          icon="trash-outline"
          label="Delete all my answers"
          detail="Stored only on this device."
          onPress={() => confirmDestructive('Delete all answers?', 'This clears every value you entered on this device.', 'Delete', reset)}
        />
      </Section>

      <Section title="Account">
        <Row
          first
          danger
          icon="person-remove-outline"
          label="Delete my account"
          detail="Permanently deletes your account and the answers saved for it here."
          onPress={() => confirmDestructive('Delete your account?', 'This permanently deletes your account and the answers saved for it on this device.', 'Delete account', async () => setError(await deleteAccount()))}
        />
      </Section>

      {error ? <Notice kind="alert">{error}</Notice> : null}

      <View style={{ gap: 6, paddingHorizontal: 4 }}>
        <Small>{DISCLAIMER}</Small>
        <Small>Version {Constants.expoConfig?.version ?? '1.0.0'}</Small>
      </View>
    </ScrollView>
  );
}
