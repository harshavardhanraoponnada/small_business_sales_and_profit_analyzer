/**
 * Modern Design System
 * Consistent design tokens for colors, spacing, typography, shadows, and more
 * Inspired by Theprofit.ai and modern SaaS applications
 */

export const colors = {
  // Primary Blues (Main action colors)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Primary blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e', // Main success
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#145231',
  },

  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main warning
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error/Danger Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main error
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Neutrals (Grays)
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Light Mode Specific
  light: {
    bg: {
      primary: '#ffffff',     // Main background
      secondary: '#f8fafc',   // Secondary background
      tertiary: '#f1f5f9',    // Tertiary background
    },
    surface: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      tertiary: '#94a3b8',
      disabled: '#cbd5e1',
    },
    border: {
      primary: '#e2e8f0',
      secondary: '#cbd5e1',
    },
    divider: '#e2e8f0',
  },

  // Dark Mode Specific
  dark: {
    bg: {
      primary: '#0f172a',
      secondary: '#1e293b',
      tertiary: '#334155',
    },
    surface: {
      primary: '#1e293b',
      secondary: '#334155',
      tertiary: '#475569',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
      disabled: '#64748b',
    },
    border: {
      primary: '#334155',
      secondary: '#475569',
    },
    divider: '#334155',
  },
};

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '2.5rem', // 40px
  '3xl': '3rem',   // 48px
  '4xl': '4rem',   // 64px
};

export const typography = {
  fontFamily: {
    base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Monaco', 'Courier New', monospace",
  },

  fontSize: {
    xs: { size: '0.75rem', lineHeight: '1rem' },      // 12px
    sm: { size: '0.875rem', lineHeight: '1.25rem' },  // 14px
    base: { size: '1rem', lineHeight: '1.5rem' },     // 16px
    lg: { size: '1.125rem', lineHeight: '1.75rem' },  // 18px
    xl: { size: '1.25rem', lineHeight: '1.75rem' },   // 20px
    '2xl': { size: '1.5rem', lineHeight: '2rem' },    // 24px
    '3xl': { size: '1.875rem', lineHeight: '2.25rem' },// 30px
    '4xl': { size: '2.25rem', lineHeight: '2.5rem' }, // 36px
    '5xl': { size: '3rem', lineHeight: '1' },         // 48px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Pre-defined styles for common text patterns
  styles: {
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: '2.5rem',
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 700,
      lineHeight: '2.25rem',
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: '2rem',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: '1.75rem',
    },
    body: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: '1.5rem',
    },
    bodySmall: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.25rem',
    },
    label: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: '1.25rem',
      letterSpacing: '0.005em',
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 500,
      lineHeight: '1rem',
    },
  },
};

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05), 0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
};

export const borderRadius = {
  none: '0',
  xs: '0.25rem',   // 4px
  sm: '0.375rem', // 6px
  md: '0.5rem',   // 8px
  lg: '0.75rem',  // 12px
  xl: '1rem',     // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem',   // 32px
  full: '9999px',
};

export const transitions = {
  fast: 'all 0.15s ease-in-out',
  base: 'all 0.2s ease-in-out',
  slow: 'all 0.3s ease-in-out',
};

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * Get theme colors based on mode
 * @param {string} mode - 'light' or 'dark'
 * @returns {object} Theme colors for the specified mode
 */
export const getTheme = (mode = 'light') => {
  const isLight = mode === 'light';
  return {
    bg: isLight ? colors.light.bg : colors.dark.bg,
    surface: isLight ? colors.light.surface : colors.dark.surface,
    text: isLight ? colors.light.text : colors.dark.text,
    border: isLight ? colors.light.border : colors.dark.border,
    divider: isLight ? colors.light.divider : colors.dark.divider,
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    neutral: colors.neutral,
  };
};

/**
 * Common component style presets
 */
export const componentStyles = {
  // Button styles
  button: {
    base: {
      fontWeight: 600,
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      padding: '0.625rem 1rem',
      borderRadius: borderRadius.md,
      border: 'none',
      cursor: 'pointer',
      transition: transitions.base,
      display: 'inline-flex',
      alignItems: 'center',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    sizes: {
      sm: {
        padding: `${spacing.xs} ${spacing.sm}`,
        fontSize: '0.75rem',
      },
      md: {
        padding: `${spacing.sm} ${spacing.md}`,
        fontSize: '0.875rem',
      },
      lg: {
        padding: `${spacing.md} ${spacing.lg}`,
        fontSize: '1rem',
      },
    },
    variants: {
      primary: {
        background: colors.primary[500],
        color: colors.neutral[0],
        '&:hover': {
          background: colors.primary[600],
          boxShadow: shadows.md,
        },
        '&:active': {
          background: colors.primary[700],
        },
        '&:disabled': {
          background: colors.neutral[300],
          cursor: 'not-allowed',
          opacity: 0.6,
        },
      },
      secondary: {
        background: colors.neutral[100],
        color: colors.neutral[900],
        border: `1px solid ${colors.neutral[300]}`,
        '&:hover': {
          background: colors.neutral[200],
        },
        '&:active': {
          background: colors.neutral[300],
        },
      },
      ghost: {
        background: 'transparent',
        color: colors.primary[500],
        '&:hover': {
          background: colors.primary[50],
        },
      },
      danger: {
        background: colors.error[500],
        color: colors.neutral[0],
        '&:hover': {
          background: colors.error[600],
        },
      },
    },
  },

  // Input styles
  input: {
    base: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      padding: `${spacing.sm} ${spacing.md}`,
      borderRadius: borderRadius.md,
      border: `1px solid ${colors.neutral[300]}`,
      fontFamily: typography.fontFamily.base,
      transition: transitions.base,
      width: '100%',
    },
    focus: {
      borderColor: colors.primary[500],
      outline: 'none',
      boxShadow: `0 0 0 3px ${colors.primary[50]}`,
    },
    error: {
      borderColor: colors.error[500],
      boxShadow: `0 0 0 3px ${colors.error[50]}`,
    },
  },

  // Card styles
  card: {
    base: {
      background: colors.neutral[0],
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.neutral[200]}`,
      padding: spacing.lg,
      boxShadow: shadows.sm,
      transition: transitions.base,
    },
    hover: {
      boxShadow: shadows.md,
    },
    elevated: {
      boxShadow: shadows.lg,
    },
  },

  // Badge styles
  badge: {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: spacing.xs,
      padding: `${spacing.xs} ${spacing.sm}`,
      borderRadius: borderRadius.full,
      fontSize: '0.75rem',
      fontWeight: 600,
    },
    variants: {
      primary: {
        background: colors.primary[100],
        color: colors.primary[700],
      },
      success: {
        background: colors.success[100],
        color: colors.success[700],
      },
      warning: {
        background: colors.warning[100],
        color: colors.warning[700],
      },
      error: {
        background: colors.error[100],
        color: colors.error[700],
      },
      neutral: {
        background: colors.neutral[100],
        color: colors.neutral[700],
      },
    },
  },
};

export default {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  transitions,
  breakpoints,
  componentStyles,
  getTheme,
};
