import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Car } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Button, TextField } from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError, getDriverProfile, saveDriverProfile } from '@/lib/api';

/** Vehicle details passengers use to recognise the car at pickup. */
export default function DriverSetupScreen() {
  const { token, setRole, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [plate, setPlate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getDriverProfile(token)
      .then((p) => {
        setModel(p.vehicleModel ?? '');
        setColor(p.vehicleColor ?? '');
        setPlate(p.vehiclePlate ?? '');
      })
      .catch(() => {});
  }, [token]);

  async function onSave() {
    if (!token) return;
    if (!model.trim() || !color.trim() || !plate.trim()) {
      setError('Fill in your car model, colour and plate number.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveDriverProfile(token, {
        vehicleModel: model.trim(),
        vehicleColor: color.trim(),
        vehiclePlate: plate.trim(),
      });
      // Server already switched the role; this syncs the local session
      if (user?.role !== 'DRIVER') await setRole('DRIVER');
      router.replace('/(app)/driver');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your vehicle.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AppHeader title={user?.role === 'DRIVER' ? 'Vehicle details' : 'Become a driver'} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Car size={28} color={Colors.light.primary} />
            </View>
            <Text style={styles.heroTitle}>Share your commute</Text>
            <Text style={styles.heroSub}>
              Passengers see these details so they can find your car at pickup. You can switch back to passenger mode at any time from Account.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField label="Car model" value={model} onChangeText={setModel} placeholder="e.g. Perodua Myvi" />
            <TextField label="Colour" value={color} onChangeText={setColor} placeholder="e.g. Silver" />
            <TextField
              label="Plate number"
              value={plate}
              onChangeText={(t) => setPlate(t.toUpperCase())}
              placeholder="e.g. VGX 2041"
              autoCapitalize="characters"
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label={user?.role === 'DRIVER' ? 'Save vehicle' : 'Start driving'} onPress={onSave} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.light.background },
  content: { padding: 20, gap: 20 },
  hero: { alignItems: 'center', gap: 8, paddingVertical: 8 },
  heroIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.light.primarySoft, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 22, fontWeight: '800', color: Colors.light.text },
  heroSub: { fontSize: 13, color: '#6B7280', textAlign: 'center', lineHeight: 19 },
  form: { gap: 14 },
  error: { color: Colors.light.danger, fontSize: 13, textAlign: 'center' },
});
