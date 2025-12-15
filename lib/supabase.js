import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

const extra = Constants.expoConfig?.extra ?? {};
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase config missing: set EXPO_PUBLIC_SUPABASE_URL และ EXPO_PUBLIC_SUPABASE_ANON_KEY หรือกำหนดใน app.json extra');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// export URL for debug utilities
export const SUPABASE_URL = supabaseUrl;
