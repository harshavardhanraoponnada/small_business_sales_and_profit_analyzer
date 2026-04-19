import { useContext } from 'react';
import type { ThemeContextType } from '@/app/ThemeContext';
import { ThemeContext } from '@/app/ThemeContext';

/**
 * Custom hook to use theme context safely
 * Provides dark mode toggle and theme colors
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
};
