import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const tokenCache = {
  async getToken(key: string) {
    try {
      if (Platform.OS === 'web') {
        return typeof window !== 'undefined' ? localStorage.getItem(key) : null;
      }
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') localStorage.setItem(key, value);
        return;
      }
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
  async clearToken(key: string) {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') localStorage.removeItem(key);
        return;
      }
      return SecureStore.deleteItemAsync(key);
    } catch (err) {
      return;
    }
  },
};
