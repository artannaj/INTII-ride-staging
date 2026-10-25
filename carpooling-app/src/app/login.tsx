import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Eye, EyeOff, Fingerprint, Settings } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { useAuth } from '@/context/auth';
import { ApiError } from '@/lib/api';
import { getBiometricSupport, type BiometricSupport } from '@/lib/biometrics';

/* ---------- Design tokens ---------- */
const PAGE_BG = '#EFEFEF';
const INPUT_BG = '#C4C4C4';
const INPUT_PLACEHOLDER = '#6B6B6B';
const TEXT_DARK = '#111111';
const TEXT_MUTED = '#5A5A5A';
const RED = '#D0342B';

export default function LoginScreen() {
  const { signIn, signInWithBiometrics, biometricLoginEnabled, biometricEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bioSupport, setBioSupport] = useState<BiometricSupport | null>(null);
  const [bioLoading, setBioLoading] = useState(false);

  useEffect(() => {
    void getBiometricSupport().then(setBioSupport);
  }, []);

  async function onBiometricLogin() {
    setError(null);
    if (!bioSupport?.available) {
      setError(bioSupport?.reason ?? 'Biometrics are not available on this device.');
      return;
    }
    if (!biometricLoginEnabled) {
      setError(`Log in with your password once, then turn on ${bioSupport.label} login in Settings.`);
      return;
    }
    setBioLoading(true);
    try {
      await signInWithBiometrics();
      router.replace('/(app)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Biometric login failed.');
    } finally {
      setBioLoading(false);
    }
  }

  async function onSubmit() {
    setError(null);

    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
      router.replace('/(app)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>

            {/* Brand row */}
            <View style={styles.brandRow}>
              <BrandMark />
              <View style={styles.brandSpacer} />
              <Pressable style={styles.cog} hitSlop={8}>
                <Settings size={22} color="#4A4A4A" strokeWidth={2} />
              </Pressable>
            </View>

            {/* Heading */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Sign in with your INTI email to continue
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <View>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@student.newinti.edu.my"
                  placeholderTextColor={INPUT_PLACEHOLDER}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  style={styles.input}
                />
              </View>

              <View>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Your Password"
                    placeholderTextColor={INPUT_PLACEHOLDER}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    onSubmitEditing={onSubmit}
                    returnKeyType="go"
                    style={[styles.input, styles.passwordInput]}
                  />
                  <Pressable
                    onPress={() => setShowPassword((v) => !v)}
                    style={styles.eye}>
                    {showPassword ? (
                      <EyeOff size={20} color="#3A3A3A" strokeWidth={2.2} />
                    ) : (
                      <Eye size={20} color="#3A3A3A" strokeWidth={2.2} />
                    )}
                  </Pressable>
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                onPress={() => router.push('/forgot')}
                style={styles.forgotWrap}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>

              {/* Login */}
              <Pressable
                onPress={onSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.loginBtn,
                  pressed && styles.loginBtnPressed,
                  loading && { opacity: 0.6 },
                ]}>
                <Text style={styles.loginText}>
                  {loading ? 'Logging in…' : 'Login'}
                </Text>
              </Pressable>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.or}>or</Text>
                <View style={styles.line} />
              </View>

              {/* SSO + Biometrics */}
              <Pressable style={styles.outlineBtn}>
                <Text style={styles.outlineText}>Continue with INTI SSO</Text>
              </Pressable>
              <Pressable
                style={[styles.outlineBtn, styles.bioBtn, bioLoading && { opacity: 0.6 }]}
                onPress={onBiometricLogin}
                disabled={bioLoading}>
                <Fingerprint size={18} color={TEXT_DARK} strokeWidth={2.2} />
                <Text style={styles.outlineText}>
                  {bioLoading ? 'Checking…' : `Use ${bioSupport?.label ?? 'biometrics'}`}
                </Text>
              </Pressable>
              {biometricLoginEnabled && biometricEmail ? (
                <Text style={styles.bioHint}>Signs in as {biometricEmail}</Text>
              ) : null}
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>New here? </Text>
              <Link href="/signup" style={styles.link}>
                Create an account
              </Link>
            </View>

            {/* Bottom illustration */}
            <View style={styles.spacer} />
            <BottomIllustration />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function BottomIllustration() {
  return (
    <View style={styles.illustration} pointerEvents="none">
      <View style={[styles.tree, { left: '4%', bottom: 40 }]}>
        <View style={[styles.treeCanopy, { backgroundColor: '#D77A8A', width: 60, height: 60, borderRadius: 30 }]} />
        <View style={[styles.treeTrunk, { left: 27 }]} />
      </View>
      <View style={[styles.tree, { left: '62%', bottom: 55 }]}>
        <View style={[styles.treeCanopy, { backgroundColor: '#B8651F', width: 46, height: 46, borderRadius: 23 }]} />
        <View style={[styles.treeTrunk, { left: 20 }]} />
      </View>
      <View style={[styles.tree, { left: '82%', bottom: 40 }]}>
        <View style={[styles.treeCanopy, { backgroundColor: '#D06B2C', width: 54, height: 54, borderRadius: 27 }]} />
        <View style={[styles.treeTrunk, { left: 24 }]} />
      </View>
      <View style={styles.hill} />
    </View>
  );
}

const styles = StyleSheet.create({
  bioBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  bioHint: {
    textAlign: 'center',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: -4,
  },
  safe: { flex: 1, backgroundColor: PAGE_BG },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 0,
  },
  inner: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    flexGrow: 1,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandSpacer: { flex: 1 },
  cog: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBDBDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { marginTop: 44, gap: 4 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1.2,
    color: TEXT_DARK,
  },
  subtitle: {
    fontSize: 13,
    color: TEXT_MUTED,
    fontWeight: '500',
  },
  form: { marginTop: 24, gap: 16 },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  input: {
    backgroundColor: INPUT_BG,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 14,
    color: '#2A2A2A',
    fontWeight: '500',
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 50 },
  eye: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  error: {
    fontSize: 12,
    fontWeight: '500',
    color: RED,
    marginTop: -4,
  },
  forgotWrap: { alignItems: 'flex-end', marginTop: -4 },
  forgot: {
    fontSize: 14,
    fontWeight: '700',
    color: RED,
  },
  loginBtn: {
    backgroundColor: RED,
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  loginBtnPressed: { opacity: 0.9 },
  loginText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  line: { flex: 1, height: 1, backgroundColor: '#CFCFCF' },
  or: { fontSize: 12, color: '#6B6B6B', fontWeight: '500' },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DADADA',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  outlineText: {
    color: RED,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: { fontSize: 14, color: '#3A3A3A' },
  link: { fontSize: 14, fontWeight: '700', color: RED },
  spacer: { flex: 1, minHeight: 20 },
  illustration: {
    height: 220,
    width: '120%',
    marginLeft: '-10%',
    marginTop: 16,
  },
  tree: { position: 'absolute', alignItems: 'center' },
  treeCanopy: { marginBottom: -4 },
  treeTrunk: {
    width: 6,
    height: 30,
    backgroundColor: '#2A1A12',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  hill: {
    position: 'absolute',
    bottom: -80,
    left: '-20%',
    right: '-20%',
    height: 200,
    backgroundColor: RED,
    borderTopLeftRadius: 400,
    borderTopRightRadius: 400,
  },
});