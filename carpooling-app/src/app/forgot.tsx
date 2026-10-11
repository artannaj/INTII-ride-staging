import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ScreenCTA, ScreenScroll } from '@/components';
import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { ApiError, forgotPassword, resetPassword, verifyResetOtp } from '@/lib/api';

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

type Step = 0 | 1 | 2; // 0=email, 1=code+new password, 2=success

export default function ForgotScreen() {
  const [step, setStep] = useState<Step>(0);

  // Email step
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Reset step
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (step !== 1) return;
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, seconds]);

  /* ---------------- STEP 0: send code ---------------- */

  async function sendCode() {
    setEmailError(null);

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setSendingEmail(true);
    try {
      await forgotPassword(email.trim());
      setStep(1);
      setSeconds(RESEND_SECONDS);
    } catch (err) {
      setEmailError(err instanceof ApiError ? err.message : 'Could not send reset code.');
    } finally {
      setSendingEmail(false);
    }
  }

  /* ---------------- STEP 1: verify + reset ---------------- */

  function setDigit(idx: number, value: string) {
    const clean = value.replace(/\D/g, '');
    const next = [...digits];
    next[idx] = clean.slice(-1);
    setDigits(next);
    if (clean && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  }

  function onBackspace(idx: number, key: string) {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function updatePassword() {
    setResetError(null);
    const code = digits.join('');

    if (code.length !== OTP_LENGTH) {
      setResetError('Enter the 6-digit code.');
      return;
    }
    if (newPassword.length < 8) {
      setResetError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }

    setResetting(true);
    try {
      // Verify the OTP first (backend does this again inside resetPassword, but
      // a separate verify call gives us a nicer error message if the code is wrong)
      await verifyResetOtp(email.trim(), code);
      await resetPassword(email.trim(), code, newPassword);
      setStep(2);
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : 'Could not reset password.');
    } finally {
      setResetting(false);
    }
  }

  async function resend() {
    if (seconds > 0) return;
    try {
      await forgotPassword(email.trim());
      setSeconds(RESEND_SECONDS);
      setResetError(null);
    } catch (err) {
      setResetError(err instanceof ApiError ? err.message : 'Could not resend code.');
    }
  }

  /* ---------------- RENDER ---------------- */

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Reset password" showBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {step === 0 && (
          <>
            <ScreenScroll>
              <View style={styles.header}>
                <Text style={styles.title}>Forgot password?</Text>
                <Text style={styles.subtitle}>
                  Enter your INTI email and we'll send a 6-digit reset code.
                </Text>
              </View>

              <View>
                <Text style={styles.label}>University email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="name@student.newinti.edu.my"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
              </View>

              {emailError ? <Text style={styles.error}>{emailError}</Text> : null}
            </ScreenScroll>
            <ScreenCTA>
              <Button label="Send reset code" onPress={sendCode} loading={sendingEmail} />
            </ScreenCTA>
          </>
        )}

        {step === 1 && (
          <>
            <ScreenScroll>
              <View style={styles.header}>
                <Text style={styles.title}>Check your inbox</Text>
                <Text style={styles.subtitle}>
                  We sent a code to <Text style={styles.email}>{email}</Text>
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

              <View>
                <Text style={styles.label}>New password</Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>

              <View>
                <Text style={styles.label}>Confirm password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Repeat password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                  style={styles.input}
                />
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
                  <Pressable onPress={resend}>
                    <Text style={styles.resendLink}>Resend code</Text>
                  </Pressable>
                )}
              </View>

              {resetError ? <Text style={styles.error}>{resetError}</Text> : null}
            </ScreenScroll>
            <ScreenCTA>
              <Button label="Update password" onPress={updatePassword} loading={resetting} />
            </ScreenCTA>
          </>
        )}

        {step === 2 && (
          <>
            <ScreenScroll>
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <Check size={32} color="#15803D" strokeWidth={3} />
                </View>
                <Text style={styles.successTitle}>Password updated</Text>
                <Text style={styles.successSub}>
                  You can now sign in with your new password.
                </Text>
              </View>
            </ScreenScroll>
            <ScreenCTA>
              <Button label="Back to login" onPress={() => router.replace('/login')} />
            </ScreenCTA>
          </>
        )}
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
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 13,
    color: Colors.light.text,
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 8,
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
    marginTop: 8,
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
  error: {
    fontSize: 12,
    color: Colors.light.primary,
    marginTop: 4,
  },
  successWrap: {
    paddingTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -1,
    color: Colors.light.text,
  },
  successSub: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});