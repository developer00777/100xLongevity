import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api, apiConfigured } from '../../api';
import { Chip, H1, Small } from '../../components/ui';
import { askContext } from '../../engine/engine';
import { useAssessment } from '../../state/AssessmentContext';
import { useAuth } from '../../state/AuthContext';
import { useTheme } from '../../theme';

type Msg = { role: 'user' | 'assistant'; content: string; error?: boolean };

const SUGGESTED = [
  'Why am I at this tier and not the next one?',
  'Explain my main bottleneck',
  'Which missing markers would change my tier most?',
  'How is my metabolic domain scored?',
  'What should I eat?',
];

export default function Ask() {
  const t = useTheme();
  const { A, state, askConsent, setAskConsent } = useAssessment();
  const { token, expire } = useAuth();
  const [pending, setPending] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const ctl = useRef<AbortController | null>(null);
  const scroll = useRef<ScrollView>(null);
  const configured = apiConfigured;

  async function ask(q: string, consented = false) {
    q = q.trim();
    if (!q || busy) return;
    if (!askConsent && !consented) { setPending(q); return; }
    // Leave failed exchanges out of the history: the error and the question it answered.
    const history = msgs.filter((m, i) => !m.error && !msgs[i + 1]?.error).slice(-10);
    const next: Msg[] = [...msgs, { role: 'user', content: q }];
    setMsgs(next); setInput(''); setBusy(true);
    ctl.current = new AbortController();
    try {
      const context = askContext(A, state);
      const res = await api<{ answer: string }>('/api/ask', {
        body: { context, messages: [...history.map(({ role, content }) => ({ role, content })), { role: 'user', content: q }] },
        token,
        signal: ctl.current.signal,
      });
      if (res.status === 401) { expire(); return; }
      if (!res.ok || !res.data.answer) throw new Error(res.status === 429 ? 'Too many questions right now. Wait a moment and ask again.' : 'The answer could not be loaded. Check your connection and ask again.');
      setMsgs([...next, { role: 'assistant', content: res.data.answer }]);
    } catch (e: unknown) {
      const aborted = e instanceof Error && e.name === 'AbortError';
      if (!aborted) setMsgs([...next, { role: 'assistant', content: e instanceof Error ? e.message : 'Something went wrong. Ask again.', error: true }]);
    } finally {
      setBusy(false); ctl.current = null;
      setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 50);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={100}>
      <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 20 }} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
        <View style={{ gap: 2 }}>
          <H1>Ask a question</H1>
          <Small>Answers use your current results and the 100X matrix. Not a doctor and not medical advice.</Small>
        </View>
        {!configured && (
          <View style={{ backgroundColor: t.warnBg, borderRadius: 12, padding: 12 }}>
            <Text style={{ color: t.warnInk }}>Ask isn't connected yet. Set apiUrl in app.json to your deployed server.</Text>
          </View>
        )}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} keyboardShouldPersistTaps="handled">
          {SUGGESTED.map((q) => <Chip key={q} label={q} onPress={() => ask(q)} />)}
        </ScrollView>
        {pending !== null && (
          <View style={{ backgroundColor: t.surface, borderColor: t.accent, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: t.ink }}>Allow answers from Claude?</Text>
            <Text style={{ fontSize: 15, lineHeight: 22, color: t.ink }}>To answer, your question and your assessment results (the markers you entered and your tiers) are sent through the 100x Longevity server and OpenRouter to Anthropic's Claude AI service. Your name and contact details are not sent. Nothing is shared unless you allow it.</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable accessibilityRole="button" onPress={() => setPending(null)} style={{ flex: 1, minHeight: 46, borderRadius: 12, borderWidth: 1, borderColor: t.line, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '800', color: t.ink }}>Not now</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={() => { const q = pending; setAskConsent(true); setPending(null); ask(q, true); }} style={{ flex: 1, minHeight: 46, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontWeight: '800', color: t.accentInk }}>Allow</Text></Pressable>
            </View>
          </View>
        )}
        {msgs.length === 0 && <Small style={{ textAlign: 'center', marginTop: 24 }}>Tap a question above or type your own.</Small>}
        {msgs.map((m, k) => (
          <View key={k} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
            backgroundColor: m.error ? t.warnBg : m.role === 'user' ? t.accent : t.surface, borderWidth: m.role === 'assistant' && !m.error ? 1 : 0, borderColor: t.line,
          }}>
            <Text selectable style={{ fontSize: 15, lineHeight: 22, color: m.error ? t.warnInk : m.role === 'user' ? t.accentInk : t.ink }}>{m.content}</Text>
          </View>
        ))}
        {busy && <Text style={{ color: t.muted, fontStyle: 'italic' }}>Thinking…</Text>}
      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 8, padding: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: t.line, backgroundColor: t.surface, alignItems: 'flex-end' }}>
        <TextInput
          accessibilityLabel="Your question"
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your tier, a marker or your program…"
          placeholderTextColor={t.muted}
          multiline
          style={{ flex: 1, minHeight: 44, maxHeight: 120, fontSize: 16, color: t.ink, paddingHorizontal: 10, paddingVertical: 10 }}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => (busy ? ctl.current?.abort() : ask(input))}
          style={{ height: 44, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: busy ? t.surface2 : t.accent }}
        >
          <Text style={{ fontWeight: '800', fontSize: 15, color: busy ? t.ink : t.accentInk }}>{busy ? 'Stop' : 'Ask'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
