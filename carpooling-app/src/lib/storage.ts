import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'carpool.auth.token';
const USER_KEY = 'carpool.auth.user';

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string | null): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch {
      // ignore
    }
    return;
  }

  if (value === null) {
    await SecureStore.deleteItemAsync(key);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

export async function getStoredToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function setStoredToken(token: string | null): Promise<void> {
  await setItem(TOKEN_KEY, token);
}

export async function getStoredUserJson(): Promise<string | null> {
  return getItem(USER_KEY);
}

export async function setStoredUserJson(userJson: string | null): Promise<void> {
  await setItem(USER_KEY, userJson);
}
