import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MapPin, MessageCircle, Share2, WifiOff } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { RideMap } from '@/components/ride-map';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePolling } from '@/hooks/use-polling';
import { ApiError, getTracking, type Tracking } from '@/lib/api';
import { distanceKm, etaMinutes, formatDistance, toLatLng } from '@/lib/geo';

const POLL_MS = 4000;
// Driver app sends a fix every few seconds; much older than this means signal loss
const STALE_AFTER_S = 45;

export default function TrackingScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ rideId?: string; bookingId?: string }>();
  const rideId = Number(params.rideId);

  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const finished = tracking?.status === 'COMPLETED' || tracking?.status === 'CANCELLED';

  usePolling(
    async () => {
      if (!token || !rideId) return;
      try {
        setTracking(await getTracking(token, rideId));
        setError(null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not load the driver location.');
      }
    },
    POLL_MS,
    !finished
  );

  const origin = toLatLng(tracking?.originLat, tracking?.originLng);
  const destination = toLatLng(tracking?.destinationLat, tracking?.destinationLng);
  const driver = toLatLng(tracking?.currentLat, tracking?.currentLng);
  const stale = (tracking?.secondsSinceUpdate ?? 0) > STALE_AFTER_S;

  async function shareTrip() {
    if (!tracking) return;
    const eta = driver && destination ? ` ETA about ${etaMinutes(driver, destination)} min.` : '';
    await Share.share({
      message: `I'm riding with ${tracking.driverName ?? 'my INTI Ride driver'} from ${tracking.origin} to ${tracking.destination}.${eta}`,
    });
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AppHeader title="Live tracking" />

      <View style={styles.mapWrap}>
        <RideMap origin={origin} destination={destination} driver={driver} follow={!!driver} />
        {!tracking && !error ? (
          <View style={styles.mapOverlay}>
            <ActivityIndicator color={Colors.light.primary} />
          </View>
        ) : null}
      </View>

      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        {error && !tracking ? (
          <Text style={styles.error}>{error}</Text>
        ) : tracking ? (
          <>
            <StatusHeadline tracking={tracking} stale={stale} />

            {tracking.status === 'IN_PROGRESS' && driver ? (
              <View style={styles.statsRow}>
                {origin ? (
                  <Stat label="To pickup" value={formatDistance(distanceKm(driver, origin))} />
                ) : null}
                {destination ? (
                  <>
                    <Stat label="To destination" value={formatDistance(distanceKm(driver, destination))} />
                    <Stat label="ETA" value={`~${etaMinutes(driver, destination)} min`} />
                  </>
                ) : null}
              </View>
            ) : null}

            <View style={styles.routeRow}>
              <View style={styles.ring} />
              <Text style={styles.routeText} numberOfLines={1}>{tracking.origin}</Text>
            </View>
            <View style={styles.routeRow}>
              <MapPin size={14} color={Colors.light.primary} strokeWidth={2.5} />
              <Text style={styles.routeText} numberOfLines={1}>{tracking.destination}</Text>
            </View>

            {!origin || !destination ? (
              <Text style={styles.note}>This ride was posted without map coordinates, so only the driver's position is shown.</Text>
            ) : null}

            {error ? <Text style={styles.errorSmall}>{error}</Text> : null}

            <View style={styles.actions}>
              {params.bookingId ? (
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => router.push({ pathname: '/(app)/chat/[bookingId]', params: { bookingId: params.bookingId! } })}>
                  <MessageCircle size={18} color={Colors.light.primary} />
                  <Text style={styles.actionText}>Chat</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.actionBtn} onPress={shareTrip}>
                <Share2 size={18} color={Colors.light.primary} />
                <Text style={styles.actionText}>Share trip</Text>
              </Pressable>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
}

function StatusHeadline({ tracking, stale }: { tracking: Tracking; stale: boolean }) {
  const name = tracking.driverName ?? 'Your driver';
  switch (tracking.status) {
    case 'ACTIVE':
    case 'FULL':
      return (
        <Headline
          title="Waiting for the trip to start"
          sub={`${name} hasn't started driving yet. This screen updates automatically.`}
        />
      );
    case 'IN_PROGRESS':
      if (tracking.currentLat == null) {
        return <Headline title={`${name} is on the way`} sub="Waiting for the driver's first location update…" />;
      }
      if (stale) {
        return (
          <View style={styles.staleRow}>
            <WifiOff size={18} color="#B45309" />
            <Headline
              title={`${name} is on the way`}
              sub={`Last update ${Math.round((tracking.secondsSinceUpdate ?? 0) / 60) || 1} min ago. The driver may have lost signal.`}
            />
          </View>
        );
      }
      return <Headline title={`${name} is on the way`} sub="Live location · updates every few seconds" live />;
    case 'COMPLETED':
      return <Headline title="Trip completed" sub="Thanks for riding with INTI Ride." />;
    case 'CANCELLED':
      return <Headline title="Ride cancelled" sub="The driver cancelled this ride." />;
  }
}

function Headline({ title, sub, live = false }: { title: string; sub: string; live?: boolean }) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.titleRow}>
        {live ? <View style={styles.liveDot} /> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.sub}>{sub}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E0E0E0' },
  mapWrap: { flex: 1 },
  mapOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 12,
    marginTop: -20,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  sub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16A34A' },
  staleRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ring: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: Colors.light.text, marginLeft: 1 },
  routeText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.light.text },
  note: { fontSize: 12, color: '#9CA3AF' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionText: { fontSize: 14, fontWeight: '700', color: Colors.light.primary },
  error: { color: Colors.light.danger, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  errorSmall: { color: Colors.light.danger, fontSize: 12 },
});
