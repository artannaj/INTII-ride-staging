import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'carpool.auth.token';
const USER_KEY = 'carpool.auth.user';
// Separate copy of the session that survives sign-out, unlocked by biometrics
const BIO_TOKEN_KEY = 'carpool.bio.token';
const BIO_USER_KEY = 'carpool.bio.user';
const BIO_PAY_KEY = 'carpool.pref.bioPay';

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

export async function getBiometricSession(): Promise<{ token: string; userJson: string } | null> {
  const [token, userJson] = await Promise.all([getItem(BIO_TOKEN_KEY), getItem(BIO_USER_KEY)]);
  return token && userJson ? { token, userJson } : null;
}

export async function setBiometricSession(session: { token: string; userJson: string } | null): Promise<void> {
  await Promise.all([
    setItem(BIO_TOKEN_KEY, session?.token ?? null),
    setItem(BIO_USER_KEY, session?.userJson ?? null),
  ]);
}

export async function getBiometricPayEnabled(): Promise<boolean> {
  return (await getItem(BIO_PAY_KEY)) === '1';
}

export async function setBiometricPayEnabled(enabled: boolean): Promise<void> {
  await setItem(BIO_PAY_KEY, enabled ? '1' : null);
}
