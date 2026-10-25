import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export type BiometricSupport = {
  available: boolean;
  /** Human label for buttons, e.g. "Face ID" or "Fingerprint". */
  label: string;
  /** Why it's unavailable, suitable for showing to the user. */
  reason?: string;
};

export async function getBiometricSupport(): Promise<BiometricSupport> {
  if (Platform.OS === 'web') {
    return { available: false, label: 'Biometrics', reason: 'Biometrics are only available in the mobile app.' };
  }
  try {
    const [hasHardware, enrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    const label = types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
      ? Platform.OS === 'ios' ? 'Face ID' : 'Face unlock'
      : types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ? Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint'
        : 'Biometrics';

    if (!hasHardware) {
      return { available: false, label, reason: "This device doesn't support biometrics." };
    }
    if (!enrolled) {
      return { available: false, label, reason: `Set up ${label} in your phone settings first.` };
    }
    return { available: true, label };
  } catch {
    return { available: false, label: 'Biometrics', reason: 'Biometrics are not available right now.' };
  }
}

/** Shows the system prompt. Resolves true only on a successful match. */
export async function authenticate(promptMessage: string): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      // Allow the device PIN as a fallback, as banking apps do
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
