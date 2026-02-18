// App configuration constants
export const APP_CONFIG = {
    name: 'Emergency Responder',
    version: '1.0.0',
    environment: __DEV__ ? 'development' : 'production',
} as const;

// Supabase Configuration - Direct connection (no backend needed)
export const SUPABASE_CONFIG = {
    url: 'https://zplufqaruudndefumefj.supabase.co',
    anonKey: 'sb_publishable_eulHy2sGKNs-TvSlDyHvtA_1CfsX1Vn',
} as const;

// API Configuration (for offline queue retries)
export const API_CONFIG = {
    timeout: 30000,
    retries: 3,
} as const;

// Location Configuration
export const LOCATION_CONFIG = {
    accuracy: {
        HIGH: 1,
        BALANCED: 2,
        LOW: 3,
    },
    updateInterval: 5000, // ms
    distanceFilter: 10, // meters
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
    name: 'emergency_responder.db',
    version: 1,
} as const;

// Emergency Configuration
export const EMERGENCY_CONFIG = {
    maxNearbyResponders: 5,
    searchRadiusKm: 50,
    callTimeout: 3000,
    smsEnabled: true,
} as const;
