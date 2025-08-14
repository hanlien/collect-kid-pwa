/**
 * Theme Configuration - Backyard Brandon
 * Centralized theme management with typed theme tokens
 */

export type ColorScale = {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
};

export type SemanticColorScale = {
  50: string;
  500: string;
  600: string;
  700: string;
};

export type ThemeColors = {
  primary: ColorScale;
  secondary: ColorScale;
  accent: ColorScale;
  success: SemanticColorScale;
  warning: SemanticColorScale;
  error: SemanticColorScale;
  info: SemanticColorScale;
  neutral: ColorScale & { 0: string };
};

export type SpacingScale = {
  0: string;
  px: string;
  '0.5': string;
  1: string;
  '1.5': string;
  2: string;
  '2.5': string;
  3: string;
  '3.5': string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
};

export type FontSizes = {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
};

export type Theme = {
  colors: ThemeColors;
  spacing: SpacingScale;
  fontSizes: FontSizes;
  borderRadius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  shadows: {
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    nature: string;
    paw: string;
    glow: string;
  };
  animations: {
    durations: {
      fast: string;
      medium: string;
      slow: string;
    };
    easings: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
      spring: string;
      bounce: string;
    };
  };
};

// Light theme (default)
export const lightTheme: Theme = {
  colors: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    secondary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    accent: {
      50: '#fff7ed',
      100: '#ffedd5',
      200: '#fed7aa',
      300: '#fdba74',
      400: '#fb923c',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
      800: '#9a3412',
      900: '#7c2d12',
      950: '#431407',
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    error: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    info: {
      50: '#eff6ff',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    neutral: {
      0: '#ffffff',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
  },
  spacing: {
    0: '0',
    px: '1px',
    '0.5': '0.125rem',
    1: '0.25rem',
    '1.5': '0.375rem',
    2: '0.5rem',
    '2.5': '0.625rem',
    3: '0.75rem',
    '3.5': '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    nature: '0 8px 32px rgba(22, 163, 74, 0.2)',
    paw: '0 4px 20px rgba(34, 197, 94, 0.3)',
    glow: '0 0 20px rgba(74, 222, 128, 0.5)',
  },
  animations: {
    durations: {
      fast: '150ms',
      medium: '300ms',
      slow: '500ms',
    },
    easings: {
      linear: 'linear',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
};

// Animal-themed component presets
export const animalTheme = {
  gradients: {
    nature: 'linear-gradient(135deg, var(--color-primary-400) 0%, var(--color-secondary-500) 50%, var(--color-accent-400) 100%)',
    forest: 'linear-gradient(to bottom, var(--color-primary-300), var(--color-primary-600))',
    sky: 'linear-gradient(to bottom, var(--color-secondary-200), var(--color-secondary-500))',
    sunset: 'linear-gradient(45deg, var(--color-accent-400), var(--color-warning-500))',
    discovery: 'linear-gradient(135deg, var(--color-accent-200) 0%, var(--color-primary-300) 100%)',
  },
  patterns: {
    pawPrint: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="rgba(34,197,94,0.1)"%3E%3Ccircle cx="20" cy="20" r="3"/%3E%3Ccircle cx="16" cy="16" r="2"/%3E%3Ccircle cx="24" cy="16" r="2"/%3E%3Ccircle cx="20" cy="12" r="2"/%3E%3C/g%3E%3C/svg%3E")',
    leaf: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M30 30c5-5 15-5 15 5s-5 15-15 10c-5-2.5-5-7.5 0-15z" fill="rgba(34,197,94,0.08)"/%3E%3C/svg%3E")',
  },
  components: {
    button: {
      nature: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-paw hover:shadow-nature',
      discovery: 'bg-gradient-to-r from-accent-500 to-warning-500 text-white shadow-glow',
      forest: 'bg-gradient-to-b from-primary-400 to-primary-600 text-white shadow-lg',
    },
    card: {
      nature: 'bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200 shadow-nature',
      discovery: 'bg-gradient-to-br from-accent-50 to-warning-50 border-accent-200 shadow-candy',
      glass: 'bg-white/80 backdrop-blur-sm border-white/20 shadow-xl',
    },
  },
};

// Theme utilities
export const getThemeValue = (path: string, theme: Theme = lightTheme): string => {
  const keys = path.split('.');
  let value: any = theme;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '';
};

export const createThemeCSS = (theme: Theme): string => {
  return `
    :root {
      /* Colors */
      ${Object.entries(theme.colors.primary).map(([key, value]) => `--color-primary-${key}: ${value};`).join('\n      ')}
      ${Object.entries(theme.colors.secondary).map(([key, value]) => `--color-secondary-${key}: ${value};`).join('\n      ')}
      ${Object.entries(theme.colors.accent).map(([key, value]) => `--color-accent-${key}: ${value};`).join('\n      ')}
      
      /* Spacing */
      ${Object.entries(theme.spacing).map(([key, value]) => `--space-${key}: ${value};`).join('\n      ')}
      
      /* Typography */
      ${Object.entries(theme.fontSizes).map(([key, value]) => `--font-size-${key}: ${value};`).join('\n      ')}
      
      /* Shadows */
      ${Object.entries(theme.shadows).map(([key, value]) => `--shadow-${key}: ${value};`).join('\n      ')}
    }
  `;
};
