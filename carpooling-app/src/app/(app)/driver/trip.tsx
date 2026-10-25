import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MapPin, MessageCircle, Phone, Radio, WifiOff } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { RideMap } from '@/components/ride-map';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import {
  ApiError,
  completeRide,
  getRide,
  getRideBookings,
  updateRideLocation,
  type Booking,
  type Ride,
} from '@/lib/api';
import { distanceKm, etaMinutes, formatDistance, toLatLng, type LatLng } from '@/lib/geo';

// Send at most one fix per SEND_MS, and re-send the last fix every HEARTBEAT_MS
// so passengers don't see "stale" while the car is stopped at a light.
const SEND_MS = 4000;
const HEARTBEAT_MS = 15000;

type PermissionState = 'checking' | 'granted' | 'denied';

export default function DriverTripScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ rideId: string }>();
  const rideId = Number(params.rideId);

  const [ride, setRide] = useState<Ride | null>(null);
  const [passengers, setPassengers] = useState<Booking[]>([]);
  const [permission, setPermission] = useState<PermissionState>('checking');
  const [position, setPosition] = useState<LatLng | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ending, setEnding] = useState(false);
  const [, forceTick] = useState(0);

  const latestRef = useRef<LatLng | null>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!token || !rideId) return;
    Promise.all([getRide(token, rideId), getRideBookings(token, rideId)])
      .then(([r, b]) => {
        setRide(r);
        setPassengers(b.filter((x) => x.status === 'CONFIRMED'));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load this trip.'));
  }, [token, rideId]);

  const live = ride?.status === 'IN_PROGRESS';

  // Watch GPS while the trip is live and this screen is open
  useEffect(() => {
    if (!live || !token) return;
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    async function send(force = false) {
      const pos = latestRef.current;
      if (!pos || !token) return;
      const now = Date.now();
      if (!force && now - lastSentRef.current < SEND_MS) return;
      lastSentRef.current = now;
      try {
        await updateRideLocation(token, rideId, pos.latitude, pos.longitude);
        setLastSentAt(Date.now());
        setSendError(null);
      } catch (err) {
        setSendError(err instanceof ApiError ? err.message : 'Location upload failed. Retrying…');
      }
    }

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setPermission('denied');
        return;
      }
      setPermission('granted');

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: SEND_MS, distanceInterval: 10 },
        (loc) => {
          const next = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
          latestRef.current = next;
          setPosition(next);
          void send();
        }
      );
      if (cancelled) subscription.remove();
    })();

    const heartbeat = setInterval(() => void send(true), HEARTBEAT_MS);
    // Re-render once a second so "sent Xs ago" stays current
    const ticker = setInterval(() => forceTick((n) => n + 1), 1000);

    return () => {
      cancelled = true;
      subscription?.remove();
      clearInterval(heartbeat);
      clearInterval(ticker);
    };
  }, [live, token, rideId]);

  function onEndTrip() {
    if (!token || !ride) return;
    Alert.alert('End trip?', 'Confirm that everyone has been dropped off. Location sharing will stop.', [
      { text: 'Not yet', style: 'cancel' },
      {
        text: 'End trip',
        onPress: async () => {
          setEnding(true);
          try {
            await completeRide(token, ride.id);
            router.replace('/(app)/driver');
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not end the trip.');
            setEnding(false);
          }
        },
      },
    ]);
  }

  const origin = toLatLng(ride?.originLat, ride?.originLng);
  const destination = toLatLng(ride?.destinationLat, ride?.destinationLng);
  const secondsAgo = lastSentAt ? Math.round((Date.now() - lastSentAt) / 1000) : null;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AppHeader title="Live trip" />

      <View style={styles.mapWrap}>
        <RideMap origin={origin} destination={destination} driver={position} follow showsUserLocation={false} />
        {live ? (
          <View style={styles.liveBadge}>
            {sendError ? <WifiOff size={14} color="#FFFFFF" /> : <Radio size={14} color="#FFFFFF" />}
            <Text style={styles.liveBadgeText}>
              {sendError
                ? 'Connection problem'
                : secondsAgo !== null
                  ? `Sharing live · sent ${secondsAgo}s ago`
                  : 'Getting your location…'}
            </Text>
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.sheet} contentContainerStyle={[styles.sheetContent, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {!ride ? (
          <ActivityIndicator color={Colors.light.primary} />
        ) : !live ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.title}>This trip isn't in progress</Text>
            <Text style={styles.sub}>Start the trip from the ride screen to begin sharing your location.</Text>
            <Pressable style={styles.secondaryBtn} onPress={() => router.back()}>
              <Text style={styles.secondaryText}>Back to ride</Text>
            </Pressable>
          </View>
        ) : permission === 'denied' ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.title}>Location permission needed</Text>
            <Text style={styles.sub}>
              Passengers can only follow the car if INTI Ride can use your location while this screen is open.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={() => Linking.openSettings()}>
              <Text style={styles.primaryText}>Open settings</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.title} numberOfLines={1}>To {ride.destination}</Text>
            {position && destination ? (
              <Text style={styles.sub}>
                {formatDistance(distanceKm(position, destination))} away · about {etaMinutes(position, destination)} min
              </Text>
            ) : (
              <Text style={styles.sub}>Keep this screen open while driving so passengers can follow you.</Text>
            )}
            {sendError ? <Text style={styles.errorSmall}>{sendError}</Text> : null}

            <View style={styles.routeRow}>
              <View style={styles.ring} />
              <Text style={styles.routeText} numberOfLines={1}>{ride.origin}</Text>
            </View>
            <View style={styles.routeRow}>
              <MapPin size={14} color={Colors.light.primary} strokeWidth={2.5} />
              <Text style={styles.routeText} numberOfLines={1}>{ride.destination}</Text>
            </View>

            <Text style={styles.sectionTitle}>Passengers ({passengers.length})</Text>
            {passengers.length === 0 ? (
              <Text style={styles.sub}>No confirmed passengers on this trip.</Text>
            ) : (
              passengers.map((p) => (
                <View key={p.id} style={styles.passengerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passengerName}>{p.passengerName ?? 'Passenger'}</Text>
                    <Text style={styles.passengerSub}>{p.seatsBooked} seat{p.seatsBooked === 1 ? '' : 's'}</Text>
                  </View>
                  <Pressable
                    style={styles.iconBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/(app)/chat/[bookingId]',
                        params: { bookingId: String(p.id), name: p.passengerName ?? 'Passenger' },
                      })
                    }>
                    <MessageCircle size={18} color={Colors.light.primary} />
                  </Pressable>
                  {p.passengerPhone ? (
                    <Pressable style={styles.iconBtn} onPress={() => Linking.openURL(`tel:${p.passengerPhone}`)}>
                      <Phone size={18} color={Colors.light.primary} />
                    </Pressable>
                  ) : null}
                </View>
              ))
            )}

            <Pressable style={[styles.primaryBtn, ending && { opacity: 0.6 }]} onPress={onEndTrip} disabled={ending}>
              {ending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>End trip</Text>}
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E0E0E0' },
  mapWrap: { flex: 1 },
  liveBadge: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(31,41,55,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  sheet: { flexGrow: 0, maxHeight: '55%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20 },
  sheetContent: { padding: 20, gap: 10 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  sub: { fontSize: 13, color: '#6B7280' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ring: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: Colors.light.text, marginLeft: 1 },
  routeText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.light.text },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Colors.light.text, marginTop: 8 },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12 },
  passengerName: { fontSize: 14, fontWeight: '800', color: Colors.light.text },
  passengerSub: { fontSize: 12, color: '#6B7280' },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.light.primarySoft, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { backgroundColor: Colors.light.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  secondaryText: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
  error: { color: Colors.light.danger, textAlign: 'center' },
  errorSmall: { color: Colors.light.danger, fontSize: 12 },
});
