/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // New properties for register component
    destructive: '#ef4444',        // Red color for error banners
    accent: '#0a7ea4',             // Same as tint for consistency
    card: '#f9fafb',               // Light gray background for input containers
    border: '#e5e7eb',             // Light gray for borders
    textSecondary: '#6b7280',      // Gray for secondary text/placeholders
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // New properties for register component
    destructive: '#dc2626',        // Darker red for error banners
    accent: '#3b82f6',             // Blue accent for dark mode
    card: '#1f2937',               // Dark gray background for input containers
    border: '#374151',             // Dark gray for borders
    textSecondary: '#9ca3af',      // Light gray for secondary text/placeholders
  },
};