import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string };
// The web build is served by the worker itself, so it calls the API on its own origin.
const base = extra.apiUrl ? extra.apiUrl.replace(/\/+$/, '') : Platform.OS === 'web' ? '' : null;

export const apiConfigured = base !== null;

export type ApiResult<T> = { ok: boolean; status: number; data: Partial<T> & { error?: string } };

// Status 0 means the server could not be reached (or no apiUrl is set). Aborts are rethrown.
export async function api<T>(path: string, opts: { method?: string; body?: unknown; token?: string | null; signal?: AbortSignal } = {}): Promise<ApiResult<T>> {
  const fail = (error: string): ApiResult<T> => ({ ok: false, status: 0, data: { error } as ApiResult<T>['data'] });
  if (base === null) return fail('not_configured');
  try {
    const res = await fetch(base + path, {
      method: opts.method ?? (opts.body === undefined ? 'GET' : 'POST'),
      headers: {
        ...(opts.body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      signal: opts.signal,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') throw e;
    return fail('network');
  }
}
