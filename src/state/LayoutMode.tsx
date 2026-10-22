import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

// Web only: wide browsers can show the phone layout ('mobile', the default) or a full-width layout ('web').
export type LayoutMode = 'mobile' | 'web';

const KEY = '100x-layout-mode';
export const PHONE_WIDTH = 430;
// Below this width there is nothing to switch (and no room beside the phone column for the switch).
const WIDE = 900;

type Ctx = { mode: LayoutMode; setMode: (m: LayoutMode) => void; canSwitch: boolean; wide: boolean };
const LayoutModeContext = createContext<Ctx | null>(null);

export function LayoutModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<LayoutMode>('mobile');
  const { width } = useWindowDimensions();
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    AsyncStorage.getItem(KEY).then((v) => { if (v === 'web' || v === 'mobile') setModeState(v); }).catch(() => {});
  }, []);
  const canSwitch = Platform.OS === 'web' && width >= WIDE;
  const value: Ctx = {
    mode,
    canSwitch,
    wide: canSwitch && mode === 'web',
    setMode: (m) => { setModeState(m); AsyncStorage.setItem(KEY, m).catch(() => {}); },
  };
  return <LayoutModeContext.Provider value={value}>{children}</LayoutModeContext.Provider>;
}

export function useLayoutMode() {
  const c = useContext(LayoutModeContext);
  if (!c) throw new Error('useLayoutMode must be used inside LayoutModeProvider');
  return c;
}
