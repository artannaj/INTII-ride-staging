/**
 * INTI Carpool design tokens — pristine light mode, red accent.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Brand = {
  primary: '#E30611',
  primaryPressed: '#C0050E',
  primarySoft: '#FDEBEC',
  primaryText: '#9F2F2D',
} as const;

export const Colors = {
  light: {
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    textMuted: '#9A9A9A',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    border: '#EAEAEA',
    primary: Brand.primary,
    primaryPressed: Brand.primaryPressed,
    primarySoft: Brand.primarySoft,
    danger: '#E30611',
    success: '#1F7A4D',
    // legacy keys used by leftover template components
    backgroundElement: '#F3F3F3',
    backgroundSelected: '#E8E8E8',
  },
  dark: {
    // App is light-mode only; dark tokens mirror light for safety
    text: '#1A1A1A',
    textSecondary: '#6B6B6B',
    textMuted: '#9A9A9A',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    border: '#EAEAEA',
    primary: Brand.primary,
    primaryPressed: Brand.primaryPressed,
    primarySoft: Brand.primarySoft,
    danger: '#E30611',
    success: '#1F7A4D',
    backgroundElement: '#F3F3F3',
    backgroundSelected: '#E8E8E8',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'PlusJakartaSans_400Regular',
    sansMedium: 'PlusJakartaSans_500Medium',
    sansSemiBold: 'PlusJakartaSans_600SemiBold',
    sansBold: 'PlusJakartaSans_700Bold',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'PlusJakartaSans_400Regular',
    sansMedium: 'PlusJakartaSans_500Medium',
    sansSemiBold: 'PlusJakartaSans_600SemiBold',
    sansBold: 'PlusJakartaSans_700Bold',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    sansMedium: 'var(--font-display)',
    sansSemiBold: 'var(--font-display)',
    sansBold: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
})!;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 480;
