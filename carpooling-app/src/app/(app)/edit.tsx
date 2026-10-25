import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Lock, Mail } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { AppHeader } from '@/components/app-header'; // <-- Use the perfect header
import {
    Avatar,
    Badge,
    Button,
    MenuRow,
    ScreenCTA,
    ScreenScroll,
    SectionGroup,
} from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError, getProfile, updateProfile } from '@/lib/api';

export default function EditProfileScreen() {
  const { user, token } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [faculty, setFaculty] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Load existing profile */
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    getProfile(token)
      .then((profile) => {
        setFullName(profile.fullName || '');
        setPhone(profile.phone || '');
        setFaculty(profile.faculty || '');
        setBio(profile.bio || '');
      })
      .catch((err) => {
        if (err instanceof ApiError) setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function onSave() {
    setError(null);

    if (!fullName.trim()) {
      setError('Full name cannot be empty.');
      return;
    }

    if (!token) return;
    setSaving(true);
    try {
      await updateProfile(token, {
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        faculty: faculty.trim() || undefined,
        bio: bio.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  const displayName = fullName || user?.username || 'User';

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <AppHeader title="Profile" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenScroll>
          {/* Avatar + change photo */}
          <View style={styles.avatarWrap}>
            <Avatar name={displayName} size={96} />
            <Pressable style={styles.changeWrap} onPress={() => {}}>
              <Text style={styles.changeText}>Change photo</Text>
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.formCard}>
            <Field label="Full name" value={fullName} onChangeText={setFullName} placeholder="As on your matric card" />
            <Field label="Phone" value={phone} onChangeText={setPhone} placeholder="+60 12-345 6789" keyboardType="phone-pad" />
            <Field label="Faculty" value={faculty} onChangeText={setFaculty} placeholder="School of Computing" />
            <Field label="About you" value={bio} onChangeText={setBio} placeholder="A short intro" multiline />
          </View>

          {/* Verified info */}
          <SectionGroup title="Verified">
            <MenuRow
              Icon={Mail}
              title="INTI email"
              subtitle={user?.email || ''}
              onPress={() => {}}
              right={<Badge label="✔ Verified" variant="success" />}
            />
            <MenuRow
              Icon={Lock}
              title="Matric number"
              subtitle="I25033887"
              onPress={() => {}}
              right={<Lock size={14} color="#D1D5DB" strokeWidth={2.5} />}
              last
            />
          </SectionGroup>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScreenScroll>

        <ScreenCTA>
          <Button label="Save changes" onPress={onSave} loading={saving} />
        </ScreenCTA>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ------------ Sub-component ------------ */

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
}: FieldProps) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },

  avatarWrap: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 8,
  },
  changeWrap: {
    paddingVertical: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },

  formCard: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    padding: 14,
    gap: 12,
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
    paddingVertical: 12,
    fontSize: 13,
    color: Colors.light.text,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  error: {
    fontSize: 12,
    color: Colors.light.primary,
    textAlign: 'center',
  },
});