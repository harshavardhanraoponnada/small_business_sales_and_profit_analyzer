import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
} from 'react';

/**
 * Theme Context Type Definition
 */
export interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  toggleTheme: () => void;
  themeMode: 'light' | 'dark';
  theme: {
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    primary: string;
    danger: string;
    success: string;
  };
}

/**
 * Create Theme Context
 */
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: 'light' | 'dark';
}

/**
 * Theme Provider Component
 * Manages dark/light mode using Tailwind's class-based strategy
 * Persists preference to localStorage
 */
export const ThemeProvider: FC<ThemeProviderProps> = ({
  children,
  initialTheme = 'dark',
}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // First check localStorage
    const saved = localStorage.getItem('theme');
    if (saved) {
      return JSON.parse(saved);
    }

    // Then check system preference
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark;
    }

    // Default fallback
    return initialTheme === 'dark';
  });

  /**
   * Effect: Apply theme to DOM and localStorage
   */
  useEffect(() => {
    // Store preference
    localStorage.setItem('theme', JSON.stringify(isDarkMode));

    // Apply to HTML element for Tailwind dark mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Optional: Also set on body for backward compatibility
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  /**
   * Toggle theme function
   */
  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  /**
   * Context value
   */
  const value: ThemeContextType = {
    isDarkMode,
    toggleDarkMode,
    // Backward compatibility for legacy components still using toggleTheme.
    toggleTheme: toggleDarkMode,
    themeMode: isDarkMode ? 'dark' : 'light',
    theme: isDarkMode
      ? {
          background: 'bg-slate-950',
          surface: 'bg-slate-900',
          text: 'text-slate-100',
          textMuted: 'text-slate-400',
          border: 'border-slate-800',
          primary: 'text-primary-400',
          danger: 'text-red-400',
          success: 'text-emerald-400',
        }
      : {
          background: 'bg-white',
          surface: 'bg-slate-50',
          text: 'text-slate-900',
          textMuted: 'text-slate-600',
          border: 'border-slate-200',
          primary: 'text-primary-600',
          danger: 'text-red-600',
          success: 'text-emerald-600',
        },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Deprecated: useTheme is now in hooks/useTheme.ts
 * This is kept for backward compatibility
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export default ThemeContext;
