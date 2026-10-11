import { Platform } from 'react-native';

/**
 * Spring Boot API base URL.
 * - iOS Simulator: localhost works
 * - Android Emulator: 10.0.2.2 maps to host machine
 * - Physical device: set EXPO_PUBLIC_API_URL to your computer's LAN IP
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  Platform.select({
    android: 'http://10.0.2.2:8080',
    ios: 'http://localhost:8080',
    default: 'http://localhost:8080',
  })!;
