import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';

// JS mirror of the Reusables CSS variables in global.css, for places classes cannot reach.
export const THEME = {
  light: {
    background: 'hsl(48 23.8% 95.9%)',
    foreground: 'hsl(30 16.7% 4.7%)',
    card: 'hsl(60 23.1% 97.5%)',
    cardForeground: 'hsl(30 16.7% 4.7%)',
    popover: 'hsl(60 23.1% 97.5%)',
    popoverForeground: 'hsl(30 16.7% 4.7%)',
    primary: 'hsl(18 81.4% 51.6%)',
    primaryForeground: 'hsl(60 23.1% 97.5%)',
    secondary: 'hsl(48 27.8% 92.9%)',
    secondaryForeground: 'hsl(34 16.3% 8.4%)',
    muted: 'hsl(48 27.8% 92.9%)',
    mutedForeground: 'hsl(32 11% 30.4%)',
    accent: 'hsl(47 21.9% 87.5%)',
    accentForeground: 'hsl(30 16.7% 4.7%)',
    destructive: 'hsl(0 60.2% 47.3%)',
    border: 'hsl(47 21.9% 87.5%)',
    input: 'hsl(46 17.9% 81.4%)',
    ring: 'hsl(18 100% 73.1%)',
    radius: '0.75rem',
    chart1: 'hsl(18 81.4% 51.6%)',
    chart2: 'hsl(90 54.4% 31%)',
    chart3: 'hsl(208 57% 42%)',
    chart4: 'hsl(35 86.9% 41.8%)',
    chart5: 'hsl(23 60.7% 23.9%)',
  },
  dark: {
    background: 'hsl(30 13% 9%)',
    foreground: 'hsl(42 61.9% 95.9%)',
    card: 'hsl(33 15.9% 13.5%)',
    cardForeground: 'hsl(42 61.9% 95.9%)',
    popover: 'hsl(33 15.9% 13.5%)',
    popoverForeground: 'hsl(42 61.9% 95.9%)',
    primary: 'hsl(18 100% 67.6%)',
    primaryForeground: 'hsl(30 16.7% 4.7%)',
    secondary: 'hsl(34 16.3% 16.9%)',
    secondaryForeground: 'hsl(40 33.3% 91.2%)',
    muted: 'hsl(34 16.3% 16.9%)',
    mutedForeground: 'hsl(38 12.1% 61.2%)',
    accent: 'hsl(35 16.2% 20.6%)',
    accentForeground: 'hsl(42 61.9% 95.9%)',
    destructive: 'hsl(0 69.6% 60%)',
    border: 'hsl(33 13.8% 25.5%)',
    input: 'hsl(33 13.9% 31%)',
    ring: 'hsl(18 69.7% 49.2%)',
    radius: '0.75rem',
    chart1: 'hsl(18 100% 67.6%)',
    chart2: 'hsl(86 36.5% 54.9%)',
    chart3: 'hsl(210 55.7% 63.7%)',
    chart4: 'hsl(36 78.8% 57.5%)',
    chart5: 'hsl(22 53.8% 63.5%)',
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};

// Hex mirror of tailwind.config.js colors for icon `color` props, which cannot take class names.
export const ICON_COLOR = {
  ink: '#0E0C0A', // ink-900
  inkMuted: '#564E45', // ink-500
  inkFaint: '#A89F90', // ink-300
  paper: '#FBF7EE', // light text on filled buttons
  persimmon: '#E85A1F', // persimmon-500, icons and large accents only
  persimmonStrong: '#A1370C', // persimmon-700
  sageStrong: '#2C4413', // sage-700
  cinnamon: '#623418', // cinnamon-500
  danger: '#C13030', // semantic-danger
  warningStrong: '#8F5A0A', // semantic-warning-700
} as const;

// react-native-keyboard-controller toolbar colors; the app ships light-only, so both modes match.
const KEYBOARD_TOOLBAR_LIGHT = {
  primary: '#C8460F',
  disabled: '#A89F90',
  background: '#F2F0E8',
  ripple: '#E6E3D8',
};
export const KEYBOARD_TOOLBAR_THEME = {
  light: KEYBOARD_TOOLBAR_LIGHT,
  dark: KEYBOARD_TOOLBAR_LIGHT,
};
