import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Car, CreditCard, Eye, Flag, Gift, Info, MapPin, MessageCircle, Settings as SettingsIcon, Shield, User,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Badge, BottomNav, MenuRow, ScreenScroll, SectionGroup } from '@/components';
import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePolling } from '@/hooks/use-polling';
import { ApiError, getDriverProfile, getMyBookings, getMyRides, getWallet } from '@/lib/api';

export default function AccountScreen() {
  const { user, token, signOut, setRole } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [rideCount, setRideCount] = useState<number | null>(null);
  const [switching, setSwitching] = useState(false);
  const isDriver = user?.role === 'DRIVER';

  usePolling(async () => {
    if (!token) return;
    const [wallet, count] = await Promise.all([
      getWallet(token).then((w) => w.balance).catch(() => null),
      // Drivers see trips they drove, passengers see trips they took
      (isDriver
        ? getMyRides(token).then((r) => r.filter((x) => x.status === 'COMPLETED').length)
        : getMyBookings(token).then((b) => b.filter((x) => x.status === 'COMPLETED').length)
      ).catch(() => null),
    ]);
    setBalance(wallet);
    setRideCount(count);
  }, 30000);

  async function switchMode() {
    if (!token || switching) return;
    setSwitching(true);
    try {
      if (isDriver) {
        await setRole('PASSENGER');
        router.replace('/(app)');
        return;
      }
      // First-time drivers add their vehicle; returning drivers switch straight back
      const profile = await getDriverProfile(token);
      if (!profile.complete) {
        router.push('/(app)/driver/setup');
        return;
      }
      await setRole('DRIVER');
      router.replace('/(app)/driver');
    } catch (err) {
      Alert.alert('Could not switch mode', err instanceof ApiError ? err.message : 'Please try again.');
    } finally {
      setSwitching(false);
    }
  }

  const displayName = user?.username || 'User';
  const email = user?.email || '';

  return (
    <SafeAreaView style={styles.safe} edges={['top',]}>
      <StatusBar style="dark" />
      <ScreenHeader title="Account" />

      <ScreenScroll>
        <Pressable onPress={() => router.push('/(app)/edit')} style={styles.profileCard}>
          <Avatar name={displayName} size={56} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>{email}</Text>
            <View style={{ marginTop: 4 }}>
             <Badge label="✓ Verified student" variant="success" />
            </View>
          </View>
        </Pressable>

        <View style={styles.tilesRow}>
          <Tile
            label="Wallet"
            value={balance !== null ? `RM ${balance.toFixed(2)}` : '—'}
            onPress={() => router.push('/(app)/wallet')}
          />
          <Tile
            label={isDriver ? 'Trips driven' : 'Rides'}
            value={rideCount !== null ? String(rideCount) : '—'}
            onPress={() => router.push(isDriver ? '/(app)/driver' : '/(app)/bookings')}
          />
          <Tile label="Rating" value="4.9 ★" onPress={() => router.push('/(app)/reviews')} />
        </View>

        <SectionGroup title="Account">
          <MenuRow Icon={User} title="Profile" subtitle="Name, photo and contact details" onPress={() => router.push('/(app)/edit')} />
          <MenuRow Icon={CreditCard} title="Payment" subtitle="Methods, wallet, PIN and receipts" onPress={() => router.push('/(app)/wallet')} />
          <MenuRow Icon={MapPin} title="Saved places" subtitle="Home, campus and favourites" onPress={() => router.push('/(app)/places')} />
          <MenuRow Icon={Eye} title="Ride preferences" subtitle="Quiet ride, AC, music" onPress={() => router.push('/(app)/preferences')} last />
        </SectionGroup>

        <SectionGroup title="Driving">
          {isDriver ? (
            <MenuRow
              Icon={Car}
              title="Vehicle details"
              subtitle="Model, colour and plate shown to passengers"
              onPress={() => router.push('/(app)/driver/setup')}
            />
          ) : null}
          <MenuRow
            Icon={Car}
            title={switching ? 'Switching…' : isDriver ? 'Switch to passenger mode' : 'Switch to driver mode'}
            subtitle={isDriver ? 'Find and book rides' : 'Share your commute and split costs'}
            onPress={switchMode}
            last
          />
        </SectionGroup>

        <SectionGroup title="Safety & support">
          <MenuRow Icon={Shield} title="Safety" subtitle="Emergency contacts, SOS, trip sharing" onPress={() => {}} />
          <MenuRow Icon={MessageCircle} title="Support" subtitle="Help centre and contact us" onPress={() => {}} />
          <MenuRow Icon={Flag} title="My reviews" subtitle="Ratings you gave and received" onPress={() => router.push('/(app)/reviews')} last />
        </SectionGroup>

        <SectionGroup title="More">
          <MenuRow Icon={Gift} title="Refer & earn" subtitle="Get RM5 for every friend" onPress={() => router.push('/(app)/refer')} />
          <MenuRow Icon={SettingsIcon} title="Settings" subtitle="Notifications, privacy, language" onPress={() => router.push('/(app)/settings')} />
          <MenuRow Icon={Info} title="About INTI Ride" subtitle="Version 2.4.0" onPress={() => {}} last />
        </SectionGroup>

        <Pressable style={styles.logoutBtn} onPress={() => void signOut()}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScreenScroll>

      <BottomNav active="account" />
    </SafeAreaView>
  );
}

function Tile({ label, value, onPress }: { label: string; value: string; onPress: () => void; }) {
  return (
    <Pressable onPress={onPress} style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.border, borderRadius: 14, padding: 14 },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: { fontSize: 15, fontWeight: '800', color: Colors.light.text, letterSpacing: -0.3 },
  profileEmail: { fontSize: 11, color: Colors.light.textSecondary, marginTop: 2 },
  tilesRow: { flexDirection: 'row', gap: 8 },
  tile: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: Colors.light.border, alignItems: 'center' },
  tileValue: { fontSize: 14, fontWeight: '800', color: Colors.light.text },
  tileLabel: { fontSize: 10.5, color: Colors.light.textSecondary, marginTop: 2 },
  logoutBtn: { backgroundColor: Colors.light.surface, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  logoutText: { color: Colors.light.primary, fontSize: 13, fontWeight: '700' },
});