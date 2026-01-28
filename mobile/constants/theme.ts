/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#d4af37'; // Gold
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#523c2b', // Dark Brown
    textSecondary: '#7a5d4e',
    background: '#fdf6f0', // Cream
    tint: tintColorLight,
    icon: '#d4af37',
    tabIconDefault: '#7a5d4e',
    tabIconSelected: tintColorLight,
    card: '#ffffff',
    border: '#e5e7eb',
    error: '#ef4444',
    success: '#10b981',
    gold: '#d4af37',
    goldDark: '#b89627',
    cream: '#fdf6f0',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#242424',
    border: '#333333',
    error: '#ef4444',
    success: '#10b981',
    gold: '#d4af37',
    goldDark: '#b89627',
    cream: '#1a1a1a',
  },
};

export const Fonts = {
  Playfair: {
    Regular: 'PlayfairDisplay_400Regular',
    Bold: 'PlayfairDisplay_700Bold',
  },
  Cormorant: {
    Regular: 'CormorantGaramond_400Regular',
    Bold: 'CormorantGaramond_700Bold',
  },
};
