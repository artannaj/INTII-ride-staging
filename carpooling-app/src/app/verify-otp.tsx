import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ScreenCTA, ScreenScroll } from '@/components';
import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError } from '@/lib/api';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { verifySignupOtp, resendSignupOtp } = useAuth();

  const email = (params.email as string) || '';

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  function setDigit(idx: number, value: string) {
    const clean = value.replace(/\D/g, '');
    const next = [...digits];
    next[idx] = clean.slice(-1);
    setDigits(next);

    if (clean && idx < OTP_LENGTH - 1) {
      inputs.current[idx + 1]?.focus();
    }
  }

  function onBackspace(idx: number, key: string) {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function onVerify() {
    setError(null);

    const code = digits.join('');
    if (code.length !== OTP_LENGTH) {
      setError('Enter the 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      await verifySignupOtp({ email, otp: code });
      router.replace('/(app)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (seconds > 0) return;
    try {
      await resendSignupOtp(email);
      setSeconds(RESEND_SECONDS);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend code.');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Verify email" showBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenScroll>
          <View style={styles.header}>
            <Text style={styles.title}>Enter the code</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to{' '}
              <Text style={styles.email}>{email || 'your email'}</Text>
            </Text>
          </View>

          <View style={styles.otpRow}>
            {Array(OTP_LENGTH)
              .fill(0)
              .map((_, idx) => (
                <TextInput
                  key={idx}
                  ref={(el) => {
                    inputs.current[idx] = el;
                  }}
                  value={digits[idx]}
                  onChangeText={(v) => setDigit(idx, v)}
                  onKeyPress={({ nativeEvent }) => onBackspace(idx, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  style={[styles.otpBox, digits[idx] ? styles.otpBoxFilled : null]}
                  autoFocus={idx === 0}
                />
              ))}
          </View>

          <View style={styles.resendRow}>
            {seconds > 0 ? (
              <Text style={styles.resendText}>
                Resend code in{' '}
                <Text style={styles.resendTime}>
                  0:{String(seconds).padStart(2, '0')}
                </Text>
              </Text>
            ) : (
              <Pressable onPress={onResend}>
                <Text style={styles.resendLink}>Resend code</Text>
              </Pressable>
            )}
          </View>

          <Pressable onPress={() => router.replace('/signup')} style={styles.changeWrap}>
            <Text style={styles.change}>Change email</Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScreenScroll>

        <ScreenCTA>
          <Button label="Verify & continue" onPress={onVerify} loading={loading} />
        </ScreenCTA>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },
  header: { paddingTop: 12, gap: 6 },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },
  email: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 20,
  },
  otpBox: {
    flex: 1,
    height: 58,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: Colors.light.surface,
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
  },
  otpBoxFilled: {
    borderColor: Colors.light.primary,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 12.5,
    color: Colors.light.textSecondary,
  },
  resendTime: {
    fontWeight: '800',
    color: Colors.light.text,
  },
  resendLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  changeWrap: {
    alignItems: 'center',
    marginTop: 8,
  },
  change: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  error: {
    fontSize: 12,
    color: Colors.light.primary,
    textAlign: 'center',
    marginTop: 8,
  },
});