import { StatusBar } from 'expo-status-bar';
import {
    Download,
    Eye,
    FileText,
    Fingerprint,
    Flag,
    Info,
    Lock,
    MapPin,
    Phone,
    Shield,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    Badge,
    MenuRow,
    ScreenScroll,
    SectionGroup,
    Toggle,
} from '@/components';
import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import {
    ApiError,
    getSettings,
    updateSettings,
    type Settings
} from '@/lib/api';
import { getBiometricSupport, type BiometricSupport } from '@/lib/biometrics';

type NotifRow = {
  key: 'notifyRideUpdates' | 'notifyPayments' | 'notifyPromos' | 'notifyReminders';
  title: string;
};

const NOTIF_ROWS: NotifRow[] = [
  { key: 'notifyRideUpdates', title: 'Ride updates' },
  { key: 'notifyPayments', title: 'Payment alerts' },
  { key: 'notifyPromos', title: 'Promotions & offers' },
  { key: 'notifyReminders', title: 'Trip reminders' },
];

export default function SettingsScreen() {
  const { token, signOut, biometricLoginEnabled, enableBiometricLogin, disableBiometricLogin } = useAuth();
  const [bioSupport, setBioSupport] = useState<BiometricSupport | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [twoFactor, setTwoFactor] = useState(false);
  const [notifs, setNotifs] = useState({
    notifyRideUpdates: true,
    notifyPayments: true,
    notifyPromos: false,
    notifyReminders: true,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getSettings(token)
      .then((s) => {
        setSettings(s);
        setTwoFactor(s.twoFactorEnabled);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Could not load settings.')
      );
  }, [token]);

  useEffect(() => {
    void getBiometricSupport().then(setBioSupport);
  }, []);

  async function toggleBiometricLogin(value: boolean) {
    setError(null);
    if (!value) {
      await disableBiometricLogin();
      return;
    }
    if (!bioSupport?.available) {
      setError(bioSupport?.reason ?? 'Biometrics are not available on this device.');
      return;
    }
    const ok = await enableBiometricLogin();
    if (!ok) setError('Biometric check was cancelled, so biometric login stays off.');
  }

  async function toggleTwoFactor(value: boolean) {
    if (!token) return;
    setTwoFactor(value);
    try {
      await updateSettings(token, { twoFactorEnabled: value });
    } catch (err) {
      setTwoFactor(!value);
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    }
  }

  async function toggleNotif(key: NotifRow['key'], value: boolean) {
    if (!token) return;
    setNotifs((prev) => ({ ...prev, [key]: value }));
    try {
      // backend uses Preference schema; update both fields to keep them in sync
      const { updatePreferences } = await import('@/lib/api');
      await updatePreferences(token, { [key]: value });
    } catch (err) {
      setNotifs((prev) => ({ ...prev, [key]: !value }));
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    }
  }

  function confirmDelete() {
    // placeholder — wire up a modal later
    console.warn('Delete account tapped');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Settings" showBack />

      <ScreenScroll>
        {/* NOTIFICATIONS */}
        <SectionGroup title="Notifications">
          {NOTIF_ROWS.map((row, i) => (
            <View
              key={row.key}
              style={[styles.row, i < NOTIF_ROWS.length - 1 && styles.divider]}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Toggle
                value={notifs[row.key]}
                onChange={(v) => toggleNotif(row.key, v)}
              />
            </View>
          ))}
        </SectionGroup>

        {/* GENERAL */}
        <SectionGroup title="General">
          <MenuRow
            Icon={Flag}
            title="Language"
            onPress={() => {}}
            right={
              <Text style={styles.value}>{settings?.language ?? 'English'}</Text>
            }
          />
          <MenuRow
            Icon={MapPin}
            title="Location access"
            subtitle="While using the app"
            onPress={() => {}}
            last
          />
        </SectionGroup>

        {/* PRIVACY & SECURITY */}
        <SectionGroup title="Privacy & security">
          <MenuRow Icon={Lock} title="Change password" onPress={() => {}} />
          <MenuRow
            Icon={Fingerprint}
            title={`${bioSupport?.label ?? 'Biometric'} login`}
            subtitle={
              bioSupport && !bioSupport.available
                ? bioSupport.reason
                : 'Unlock the app without typing your password'
            }
            onPress={() => toggleBiometricLogin(!biometricLoginEnabled)}
            right={
              <Toggle value={biometricLoginEnabled} onChange={toggleBiometricLogin} />
            }
          />
          <MenuRow
            Icon={Shield}
            title="Two-step verification"
            onPress={() => toggleTwoFactor(!twoFactor)}
            right={
              <Badge
                label={twoFactor ? 'On' : 'Off'}
                variant={twoFactor ? 'success' : 'neutral'}
              />
            }
          />
          <MenuRow
            Icon={Phone}
            title="Logged-in devices"
            subtitle="2 devices"
            onPress={() => {}}
          />
          <MenuRow
            Icon={Download}
            title="Download my data"
            onPress={() => {}}
          />
          <MenuRow
            Icon={Eye}
            title="Privacy policy"
            onPress={() => {}}
          />
          <MenuRow
            Icon={FileText}
            title="Terms of use"
            onPress={() => {}}
            last
          />
        </SectionGroup>

        {/* ABOUT */}
        <SectionGroup title="About">
          <MenuRow
            Icon={Info}
            title="About INTI Ride"
            subtitle="Version 2.4.0"
            onPress={() => {}}
            last
          />
        </SectionGroup>

        {/* DELETE ACCOUNT */}
        <Pressable style={styles.deleteBtn} onPress={confirmDelete}>
          <Text style={styles.deleteText}>Delete account</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScreenScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  value: {
    fontSize: 12.5,
    color: Colors.light.textSecondary,
  },
  deleteBtn: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: '#F5C6C2',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  error: {
    fontSize: 12,
    color: Colors.light.primary,
    textAlign: 'center',
  },
});