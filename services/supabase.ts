import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://wfywpthtciinkxxnjsoz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_q_6kTTeFcBsoDCtKf6aL2A_90bvt139';

const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return null;
    try {
      const val = await AsyncStorage.getItem(key);
      return val !== null ? val : (memoryStore[key] ?? null);
    } catch {
      return memoryStore[key] ?? null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    memoryStore[key] = value;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return;
    delete memoryStore[key];
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: safeStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
