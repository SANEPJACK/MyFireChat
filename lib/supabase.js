import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('SUPA URL', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.warn('กรุณาตั้งค่า EXPO_PUBLIC_SUPABASE_URL และ EXPO_PUBLIC_SUPABASE_ANON_KEY ในไฟล์ .env');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// export URL for debug utilities
export const SUPABASE_URL = supabaseUrl;
