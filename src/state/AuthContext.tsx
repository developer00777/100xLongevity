import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import { removeAssessment } from './AssessmentContext';
import { clearSession, loadSession, saveSession } from './session';

type User = { email: string };
type Ctx = {
  ready: boolean;
  user: User | null;
  token: string | null;
  notice: string | null;
  // Each returns an error message to show, or null on success.
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
  signOut: () => Promise<void>;
  // The server rejected the session (expired or revoked): drop it and ask the user to sign in again.
  expire: () => void;
};

const AuthContext = createContext<Ctx | null>(null);

const MESSAGES: Record<string, string> = {
  invalid_email: 'Enter a valid email address.',
  weak_password: 'Use at least 8 characters for your password.',
  email_taken: 'An account with this email already exists. Sign in instead.',
  invalid_credentials: "That email and password don't match. Check them and try again.",
  too_many_attempts: 'Too many sign-in attempts. Wait 15 minutes and try again.',
  network: "Can't reach the server. Check your connection and try again.",
  not_configured: "Sign-in isn't set up yet. Set apiUrl in app.json to your deployed server.",
};
const message = (error?: string) => MESSAGES[error ?? ''] ?? 'Something went wrong. Try again.';

export const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<{ token: string; email: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    loadSession()
      .then(async (s) => {
        if (!s) return;
        setSession(s);
        // Offline is fine: keep the saved session. Only a 401 means it is no longer valid.
        const me = await api('/api/auth/me', { token: s.token });
        if (me.status === 401) { await clearSession(); setSession(null); }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  async function start(path: string, email: string, password: string) {
    if (!isEmail(email)) return message('invalid_email');
    if (path.endsWith('signup') && password.length < 8) return message('weak_password');
    const res = await api<{ token: string; user: User }>(path, { body: { email: email.trim(), password } });
    if (!res.ok || !res.data.token || !res.data.user) return message(res.data.error);
    const s = { token: res.data.token, email: res.data.user.email };
    await saveSession(s);
    setNotice(null);
    setSession(s);
    return null;
  }

  async function end() {
    await clearSession();
    setSession(null);
  }

  const value: Ctx = {
    ready,
    user: session ? { email: session.email } : null,
    token: session?.token ?? null,
    notice,
    signIn: (email, password) => start('/api/auth/login', email, password),
    signUp: (email, password) => start('/api/auth/signup', email, password),
    signOut: async () => {
      if (session) await api('/api/auth/logout', { method: 'POST', token: session.token });
      await end();
    },
    deleteAccount: async () => {
      if (!session) return null;
      const res = await api('/api/auth/account', { method: 'DELETE', token: session.token });
      if (!res.ok) return message(res.data.error);
      await end();
      await removeAssessment(session.email);
      setNotice('Your account was deleted.');
      return null;
    },
    expire: () => { setNotice('Your session ended. Sign in again.'); end(); },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
