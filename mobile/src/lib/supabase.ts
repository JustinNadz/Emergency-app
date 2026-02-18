// Supabase client configuration - Direct database access (no backend needed)

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import { SUPABASE_CONFIG } from '../config/app.config';

// Use config values
const SUPABASE_URL = SUPABASE_CONFIG.url;
const SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;

// Create Supabase client with AsyncStorage for persistence
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Database types matching Supabase schema
export interface SupabaseCity {
    id: number;
    name: string;
    region: string;
    province: string;
    latitude: number;
    longitude: number;
    boundary_geojson: any;
    created_at: string;
}

export interface SupabaseResponder {
    id: number;
    city_id: number;
    type: string;
    name: string;
    phone: string;
    latitude: number;
    longitude: number;
    is_available: boolean;
    created_at: string;
}

export interface SupabaseIncident {
    id: number;
    latitude: number;
    longitude: number;
    city_id: number | null;
    status: string;
    reported_at: string;
    resolved_at: string | null;
    responders_notified: number[] | null;
}

export default supabase;
