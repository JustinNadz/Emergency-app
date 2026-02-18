// Color constants for the app

export const COLORS = {
    // Primary Colors (Emergency Red)
    primary: '#DC2626',
    primaryDark: '#B91C1C',
    primaryLight: '#EF4444',

    // Secondary Colors (Success Green)
    secondary: '#16A34A',
    secondaryDark: '#15803D',
    secondaryLight: '#22C55E',

    // Background Colors
    background: '#FFFFFF',
    backgroundDark: '#1a1a2e',
    surface: '#FFFFFF',
    surfaceDark: '#F9FAFB',

    // Text Colors
    text: '#1F2937',
    textLight: '#6B7280',
    textDark: '#111827',
    textWhite: '#FFFFFF',

    // Border Colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    // Status Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',

    // GPS Accuracy Colors
    accuracyExcellent: '#10B981',
    accuracyGood: '#22C55E',
    accuracyFair: '#F59E0B',
    accuracyPoor: '#EF4444',

    // Network Status Colors
    online: '#3B82F6',
    offline: '#9CA3AF',
    smsReady: '#F59E0B',
} as const;

export type ColorKey = keyof typeof COLORS;
