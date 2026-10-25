import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '@/components/app-header'; // <-- Use the perfect header
import { ScreenScroll, SectionGroup, Toggle } from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import {
    ApiError,
    getPreferences,
    updatePreferences,
    type Preference,
} from '@/lib/api';

type Row = {
  key: keyof Preference;
  title: string;
  subtitle: string;
};

const ROWS: Row[] = [
  { key: 'quietRide', title: 'Quiet ride', subtitle: 'I prefer little conversation' },
  { key: 'acOn', title: 'AC on', subtitle: 'Keep the car cool' },
  { key: 'musicOk', title: 'Music', subtitle: "Okay with the driver's playlist" },
  { key: 'womenOnly', title: 'Women-only rides', subtitle: 'Match with women drivers only' },
  { key: 'luggageSpace', title: 'Luggage space', subtitle: 'Need room for a bag' },
  { key: 'petFriendly', title: 'Pet-friendly', subtitle: 'Okay riding with pets' },
];

export default function PreferencesScreen() {
  const { token } = useAuth();
  const [prefs, setPrefs] = useState<Preference | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    getPreferences(token)
      .then(setPrefs)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Could not load preferences.')
      );
  }, [token]);

  async function toggle(key: keyof Preference, value: boolean) {
    if (!token || !prefs) return;
    const next = { ...prefs, [key]: value };
    setPrefs(next); // optimistic update
    setSaving(true);
    setError(null);
    try {
      const saved = await updatePreferences(token, { [key]: value });
      setPrefs(saved);
    } catch (err) {
      setPrefs(prefs); // rollback on failure
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <AppHeader title="Ride preferences" />

      <ScreenScroll>
        {prefs ? (
          <SectionGroup title="">
            {ROWS.map((row, i) => {
              const value = prefs[row.key] as boolean;
              return (
                <View
                  key={row.key}
                  style={[
                    styles.row,
                    i < ROWS.length - 1 && styles.divider,
                  ]}>
                  <View style={styles.middle}>
                    <Text style={styles.title}>{row.title}</Text>
                    <Text style={styles.subtitle}>{row.subtitle}</Text>
                  </View>
                  <Toggle value={value} onChange={(v) => toggle(row.key, v)} />
                </View>
              );
            })}
          </SectionGroup>
        ) : (
          <Text style={styles.loading}>Loading…</Text>
        )}

        <Text style={styles.hint}>
          Drivers see your preferences when you request a seat.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScreenScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  middle: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  loading: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  hint: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    paddingHorizontal: 4,
  },
  error: {
    fontSize: 12,
    color: Colors.light.primary,
    textAlign: 'center',
  },
});