import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    Car,
    CreditCard,
    Eye,
    Flag,
    Gift,
    Info,
    MapPin,
    MessageCircle,
    Settings as SettingsIcon,
    Shield,
    User,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar, Badge, BottomNav, MenuRow, ScreenScroll, SectionGroup } from '@/components';
import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function AccountScreen() {
  const { user, signOut } = useAuth();

  const displayName = user?.username || 'User';
  const email = user?.email || '';

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader title="Account" />

      <ScreenScroll>
        {/* Profile card */}
        <Pressable
          onPress={() => router.push('/(app)/edit')}
          style={styles.profileCard}>
          <Avatar name={displayName} size={56} />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail} numberOfLines={1}>
              {email}
            </Text>
            <View style={{ marginTop: 4 }}>
              <Badge label="✔ Verified student" variant="success" />
            </View>
          </View>
        </Pressable>

        {/* Wallet / Rides / Rating tiles */}
        <View style={styles.tilesRow}>
          <Tile label="Wallet" value="RM 12.00" onPress={() => router.push('/(app)/wallet')} />
          <Tile label="Rides" value="12" onPress={() => {}} />
          <Tile label="Rating" value="4.9 ★" onPress={() => router.push('/(app)/reviews')} />
        </View>

        {/* ACCOUNT */}
        <SectionGroup title="Account">
          <MenuRow
            Icon={User}
            title="Profile"
            subtitle="Name, photo and contact details"
            onPress={() => router.push('/(app)/edit')}
          />
          <MenuRow
            Icon={CreditCard}
            title="Payment"
            subtitle="Methods, wallet, PIN and receipts"
            onPress={() => router.push('/(app)/wallet')}
          />
          <MenuRow
            Icon={MapPin}
            title="Saved places"
            subtitle="Home, campus and favourites"
            onPress={() => router.push('/(app)/places')}
          />
          <MenuRow
            Icon={Eye}
            title="Ride preferences"
            subtitle="Quiet ride, AC, music"
            onPress={() => router.push('/(app)/preferences')}
            last
          />
        </SectionGroup>

        {/* DRIVING */}
        <SectionGroup title="Driving">
          <MenuRow
            Icon={Car}
            title="Become a driver"
            subtitle="Earn by sharing your commute"
            onPress={() => {}}
            last
          />
        </SectionGroup>

        {/* SAFETY & SUPPORT */}
        <SectionGroup title="Safety & support">
          <MenuRow
            Icon={Shield}
            title="Safety"
            subtitle="Emergency contacts, SOS, trip sharing"
            onPress={() => {}}
          />
          <MenuRow
            Icon={MessageCircle}
            title="Support"
            subtitle="Help centre and contact us"
            onPress={() => {}}
          />
          <MenuRow
            Icon={Flag}
            title="My reviews"
            subtitle="Ratings you gave and received"
            onPress={() => router.push('/(app)/reviews')}
            last
          />
        </SectionGroup>

        {/* MORE */}
        <SectionGroup title="More">
          <MenuRow
            Icon={Gift}
            title="Refer & earn"
            subtitle="Get RM5 for every friend"
            onPress={() => router.push('/(app)/refer')}
          />
          <MenuRow
            Icon={SettingsIcon}
            title="Settings"
            subtitle="Notifications, privacy, language"
            onPress={() => router.push('/(app)/settings')}
          />
          <MenuRow
            Icon={Info}
            title="About INTI Ride"
            subtitle="Version 2.4.0"
            onPress={() => {}}
            last
          />
        </SectionGroup>

        {/* Log out */}
        <Pressable style={styles.logoutBtn} onPress={() => void signOut()}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </ScreenScroll>

      <BottomNav active="account" onNavigate={(tab) => {
        if (tab === 'home') router.push('/(app)');
        if (tab === 'account') return;
        // other tabs handled later
      }} />
    </SafeAreaView>
  );
}

/* ------------ Small local component: the wallet/rides/rating tile ------------ */

function Tile({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 14,
    padding: 14,
  },
  profileInfo: { flex: 1, minWidth: 0 },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.text,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },

  tilesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tile: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
  },
  tileValue: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.text,
  },
  tileLabel: {
    fontSize: 10.5,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },

  logoutBtn: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutText: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});