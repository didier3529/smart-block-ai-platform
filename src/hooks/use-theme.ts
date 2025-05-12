import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface UseThemeReturn {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
  systemTheme: ThemeMode;
  mounted: boolean;
  toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const { theme, setTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  const isLight = theme === 'light' || (theme === 'system' && systemTheme === 'light');
  const isSystem = theme === 'system';

  const toggleTheme = () => {
    if (isDark) {
      setTheme('light');
    } else {
      setTheme('dark');
    }
  };

  return {
    theme: theme as ThemeMode,
    setTheme: setTheme as (theme: ThemeMode) => void,
    isDark,
    isLight,
    isSystem,
    systemTheme: systemTheme as ThemeMode,
    mounted,
    toggleTheme,
  };
} 