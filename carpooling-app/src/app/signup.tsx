import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { X } from 'lucide-react-native';
import { useState } from 'react';
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

const PAGE_BG = '#EFEFEF';
const INPUT_BG = '#C4C4C4';
const INPUT_PLACEHOLDER = '#6B6B6B';
const TEXT_DARK = '#111111';
const TEXT_MUTED = '#5A5A5A';
const RED = '#D0342B';

type Role = 'PASSENGER' | 'DRIVER';

export default function SignupScreen() {
  const { requestSignup } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('PASSENGER');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);

    if (!fullName.trim() || !email.trim() || !phone.trim() || !username.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (!/^\S+@(student\.)?(new)?inti\.edu\.my$/i.test(email.trim())) {
      setError('Use your INTI email (…@student.newinti.edu.my)');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (!agree) {
      setError('Please accept the community rules.');
      return;
    }

    setLoading(true);
    try {
      await requestSignup({
        email: email.trim(),
        username: username.trim(),
        password,
        phone: phone.trim(),
        role,
      });
      router.replace({
        pathname: '/verify-otp',
        params: { email: email.trim() },
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign up failed.');
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
              <BrandMark compact />
              <View style={styles.spacer} />
              <Pressable style={styles.close} onPress={() => router.replace('/login')}>
                <X size={18} color="#4A4A4A" strokeWidth={2.4} />
              </Pressable>
            </View>

            {/* Heading */}
            <View style={styles.header}>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>
                INTI emails only. Pick a role now — you can change it later.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="As on your matric card" />
              <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@student.newinti.edu.my" keyboardType="email-address" autoCapitalize="none" />
              <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="+60 12-345 6789" keyboardType="phone-pad" />
              <Field label="Username" value={username} onChangeText={setUsername} placeholder="Create a username" autoCapitalize="none" />
              <Field label="Password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry />

              {/* Role */}
              <View style={styles.roleSection}>
                <Text style={styles.label}>I am joining as</Text>
                <View style={styles.roleRow}>
                  <RoleCard active={role === 'PASSENGER'} onPress={() => setRole('PASSENGER')} title="Passenger" subtitle="Find rides to campus" />
                  <RoleCard active={role === 'DRIVER'} onPress={() => setRole('DRIVER')} title="Driver" subtitle="Offer seats on your trip" />
                </View>
              </View>

              {/* Agreement */}
              <Pressable onPress={() => setAgree((v) => !v)} style={styles.agreeRow}>
                <View style={[styles.checkbox, agree && styles.checkboxOn]}>
                  {agree ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.agreeText}>
                  I agree to the{' '}
                  <Text style={styles.agreeLink}>community rules</Text> and{' '}
                  <Text style={styles.agreeLink}>privacy policy</Text>.
                </Text>
              </Pressable>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                onPress={onSubmit}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitBtn,
                  pressed && { opacity: 0.9 },
                  loading && { opacity: 0.6 },
                ]}>
                <Text style={styles.submitText}>
                  {loading ? 'Creating account…' : 'Sign Up'}
                </Text>
              </Pressable>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/login" style={styles.link}>
                Log in
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences';
  secureTextEntry?: boolean;
};

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', autoCapitalize = 'sentences', secureTextEntry = false }: FieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={INPUT_PLACEHOLDER}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        secureTextEntry={secureTextEntry}
        style={styles.input}
      />
    </View>
  );
}

function RoleCard({ active, onPress, title, subtitle }: { active: boolean; onPress: () => void; title: string; subtitle: string }) {
  return (
    <Pressable onPress={onPress} style={[styles.roleCard, active && styles.roleCardActive]}>
      <Text style={[styles.roleTitle, active && styles.roleTitleActive]}>{title}</Text>
      <Text style={styles.roleSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PAGE_BG },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  inner: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    gap: 24,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  spacer: { flex: 1 },
  close: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBDBDB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: { gap: 4 },
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
  form: { gap: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A2A2A',
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
  roleSection: { marginTop: 4 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: '#D9DBDE',
    gap: 4,
  },
  roleCardActive: {
    backgroundColor: '#FBE5E5',
    borderColor: RED,
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2A2A2A',
  },
  roleTitleActive: { color: RED },
  roleSubtitle: {
    fontSize: 11,
    color: '#4A4A4A',
    lineHeight: 15,
  },
  agreeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#8A8A8A',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxOn: {
    backgroundColor: RED,
    borderColor: RED,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  agreeText: {
    flex: 1,
    fontSize: 13,
    color: '#2A2A2A',
    lineHeight: 19,
  },
  agreeLink: { color: RED, fontWeight: '700' },
  error: {
    fontSize: 12,
    fontWeight: '500',
    color: RED,
    marginTop: -4,
  },
  submitBtn: {
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
  submitText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: { fontSize: 14, color: '#3A3A3A' },
  link: { fontSize: 14, fontWeight: '700', color: RED },
});