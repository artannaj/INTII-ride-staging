import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Bell, Car, MapPin, Navigation, Plus, Users } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components';
import { BottomNav } from '@/components/bottom-nav';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePolling } from '@/hooks/use-polling';
import { ApiError, getMyRides, getWallet, type Ride } from '@/lib/api';
import { RIDE_STATUS, formatDay, formatTime } from '@/lib/status';

export default function DriverHomeScreen() {
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState<Ride[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [earned, setEarned] = useState<number | null>(null);

  async function load() {
    if (!token) return;
    try {
      const [myRides, wallet] = await Promise.all([
        getMyRides(token),
        getWallet(token).catch(() => null),
      ]);
      setRides(myRides);
      setEarned(wallet ? wallet.totalEarned : null);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your rides.');
    }
  }

  // Poll so new booking requests show up without pulling to refresh
  usePolling(load, 15000, user?.role === 'DRIVER');

  if (user && user.role !== 'DRIVER') {
    return <Redirect href="/(app)/driver/setup" />;
  }

  const live = rides?.find((r) => r.status === 'IN_PROGRESS');
  const upcoming = (rides ?? [])
    .filter((r) => r.status === 'ACTIVE' || r.status === 'FULL')
    .sort((a, b) => a.departureTime.localeCompare(b.departureTime));
  const past = (rides ?? []).filter((r) => r.status === 'COMPLETED' || r.status === 'CANCELLED').slice(0, 5);
  const pendingTotal = upcoming.reduce((sum, r) => sum + (r.pendingRequests ?? 0), 0);
  const displayName = user?.username ?? 'Driver';

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Avatar name={displayName} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Driver mode</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>
        <View>
          <Bell size={24} color="#FFFFFF" />
          {pendingTotal > 0 ? (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{pendingTotal}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {live ? (
          <Pressable
            style={styles.liveCard}
            onPress={() => router.push({ pathname: '/(app)/driver/trip', params: { rideId: String(live.id) } })}>
            <View style={styles.liveIcon}>
              <Navigation size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.liveLabel}>Trip in progress</Text>
              <Text style={styles.liveTitle} numberOfLines={1}>To {live.destination}</Text>
              <Text style={styles.liveSub}>Sharing your location with passengers</Text>
            </View>
            <View style={styles.liveBtn}>
              <Text style={styles.liveBtnText}>Open</Text>
            </View>
          </Pressable>
        ) : null}

        <Pressable style={styles.earnCard} onPress={() => router.push('/(app)/wallet')}>
          <View style={{ flex: 1 }}>
            <Text style={styles.earnLabel}>Total earned (Campus Wallet)</Text>
            <Text style={styles.earnValue}>{earned !== null ? `RM ${earned.toFixed(2)}` : '—'}</Text>
          </View>
          <Text style={styles.earnSub}>
            {(rides ?? []).filter((r) => r.status === 'COMPLETED').length} trips completed
          </Text>
        </Pressable>

        <Pressable style={styles.postBtn} onPress={() => router.push('/(app)/driver/post-ride')}>
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.postText}>Post a ride</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Upcoming rides</Text>
        {rides === null ? (
          <ActivityIndicator color={Colors.light.primary} style={{ marginTop: 12 }} />
        ) : upcoming.length === 0 ? (
          <View style={styles.empty}>
            <Car size={32} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No upcoming rides</Text>
            <Text style={styles.emptySub}>Post your next trip to campus and passengers heading the same way can request a seat.</Text>
          </View>
        ) : (
          upcoming.map((ride) => <RideRow key={ride.id} ride={ride} />)
        )}

        {past.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Recent</Text>
            {past.map((ride) => <RideRow key={ride.id} ride={ride} compact />)}
          </>
        ) : null}
      </ScrollView>

      <BottomNav active="home" />
    </View>
  );
}

function RideRow({ ride, compact = false }: { ride: Ride; compact?: boolean }) {
  const status = RIDE_STATUS[ride.status];
  return (
    <Pressable
      style={[styles.card, compact && styles.cardCompact]}
      onPress={() => router.push({ pathname: '/(app)/driver/ride', params: { rideId: String(ride.id) } })}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTime}>{formatTime(ride.departureTime)}</Text>
        <Text style={styles.cardDay}>{formatDay(ride.departureTime)}</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.pill, { backgroundColor: status.bg }]}>
          <Text style={[styles.pillText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      <View style={styles.routeRow}>
        <View style={styles.ring} />
        <Text style={styles.routeText} numberOfLines={1}>{ride.origin}</Text>
      </View>
      <View style={styles.routeRow}>
        <MapPin size={12} color={Colors.light.primary} strokeWidth={2.5} />
        <Text style={styles.routeText} numberOfLines={1}>{ride.destination}</Text>
      </View>
      {!compact ? (
        <View style={styles.cardFooter}>
          <Users size={14} color="#6B7280" />
          <Text style={styles.footerText}>{ride.seatsAvailable} seats left · RM {ride.price.toFixed(2)}</Text>
          <View style={{ flex: 1 }} />
          {(ride.pendingRequests ?? 0) > 0 ? (
            <View style={styles.requestPill}>
              <Text style={styles.requestText}>
                {ride.pendingRequests} new request{ride.pendingRequests === 1 ? '' : 's'}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  earnCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  earnLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  earnValue: { fontSize: 22, fontWeight: '800', color: Colors.light.text, marginTop: 2 },
  earnSub: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  root: { flex: 1, backgroundColor: '#E0E0E0' },
  header: { backgroundColor: Colors.light.primary, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  name: { fontSize: 18, color: '#FFFFFF', fontWeight: '800' },
  bellBadge: { position: 'absolute', top: -6, right: -8, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bellBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.light.primary },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  error: { color: Colors.light.danger, textAlign: 'center' },
  liveCard: { backgroundColor: '#1F2937', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  liveLabel: { fontSize: 11, color: '#9CA3AF' },
  liveTitle: { fontSize: 16, color: '#FFFFFF', fontWeight: '800', marginVertical: 2 },
  liveSub: { fontSize: 12, color: '#9CA3AF' },
  liveBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  liveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  postBtn: { backgroundColor: Colors.light.primary, borderRadius: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  postText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text, marginTop: 6 },
  empty: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: Colors.light.text },
  emptySub: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 6 },
  cardCompact: { opacity: 0.8 },
  cardTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4 },
  cardTime: { fontSize: 22, fontWeight: '800', color: Colors.light.text },
  cardDay: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'center' },
  pillText: { fontSize: 11, fontWeight: '800' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ring: { width: 10, height: 10, borderRadius: 5, borderWidth: 2.5, borderColor: Colors.light.text, marginLeft: 1 },
  routeText: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.light.text },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  footerText: { fontSize: 12, color: '#6B7280', fontWeight: '600' },
  requestPill: { backgroundColor: Colors.light.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  requestText: { fontSize: 11, fontWeight: '800', color: Colors.light.primary },
});
