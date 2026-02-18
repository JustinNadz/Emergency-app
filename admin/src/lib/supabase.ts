// Supabase client for admin dashboard

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zplufqaruudndefumefj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwbHVmcWFydXVkbmRlZnVtZWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk0NDA5NDksImV4cCI6MjA1NTAxNjk0OX0.sb_publishable_eulHy2sGKNs-TvSlDyHvtA_1CfsX1Vn';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
