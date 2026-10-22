import * as SecureStore from 'expo-secure-store';

// Phones keep the session token in the Keychain / Keystore.
const KEY = 'longevity100x.session';

export type StoredSession = { token: string; email: string };

export async function loadSession(): Promise<StoredSession | null> {
  const raw = await SecureStore.getItemAsync(KEY);
  return raw ? JSON.parse(raw) : null;
}
export const saveSession = (s: StoredSession) => SecureStore.setItemAsync(KEY, JSON.stringify(s));
export const clearSession = () => SecureStore.deleteItemAsync(KEY);
