import AsyncStorage from '@react-native-async-storage/async-storage';

// SecureStore has no web support, so the browser keeps the session token in localStorage.
const KEY = 'longevity100x.session';

export type StoredSession = { token: string; email: string };

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}
export const saveSession = (s: StoredSession) => AsyncStorage.setItem(KEY, JSON.stringify(s));
export const clearSession = () => AsyncStorage.removeItem(KEY);
