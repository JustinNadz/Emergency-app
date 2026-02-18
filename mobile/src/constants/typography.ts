// Typography constants

export const FONT_SIZE = {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
} as const;

export const FONT_WEIGHT = {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
} as const;

export const LINE_HEIGHT = {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
} as const;
