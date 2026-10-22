import { Platform, useColorScheme } from 'react-native';

const light = {
  bg: '#F3F6F5', surface: '#FFFFFF', surface2: '#EAF0EE', ink: '#13201C', muted: '#5C6B66', line: '#D8E1DD',
  accent: '#0E6B5C', accentInk: '#FFFFFF',
  tiers: ['#0B5E55', '#1E8475', '#4FA596', '#7AAE55', '#D3A132', '#C0553F'],
  onTier: '#FFFFFF',
  warnBg: '#FCF1E4', warnInk: '#7A4210', alertBg: '#FBE7E3', alertInk: '#8A2A17',
  // Soft card shadow, after the 21st.dev "SeaGreen Minimal" theme (14px blur, -2px spread, 10% opacity).
  shadow: '0 4px 14px -2px rgba(20, 34, 30, 0.08)',
};
const dark: typeof light = {
  bg: '#0E1513', surface: '#16201D', surface2: '#1D2926', ink: '#E4EDEA', muted: '#92A39D', line: '#2A3733',
  accent: '#4DBFA7', accentInk: '#06120F',
  tiers: ['#2FA48F', '#45B6A1', '#74C7B5', '#9DCB78', '#E6BD5B', '#E37F66'],
  onTier: '#0B1311',
  warnBg: '#33261A', warnInk: '#F2C890', alertBg: '#3A1E19', alertInk: '#F6B3A4',
  shadow: '0 4px 14px -2px rgba(0, 0, 0, 0.35)',
};
export type Theme = typeof light;

export function useTheme(): Theme {
  return useColorScheme() === 'dark' ? dark : light;
}

export const mono = { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontVariant: ['tabular-nums' as const] };
