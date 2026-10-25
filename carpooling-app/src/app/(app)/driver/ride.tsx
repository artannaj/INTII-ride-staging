import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Check, MapPin, MessageCircle, Navigation, Phone, X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Avatar } from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePolling } from '@/hooks/use-polling';
import {
  ApiError,
  acceptBooking,
  cancelRide,
  getRide,
  getRideBookings,
  rejectBooking,
  startRide,
  type Booking,
  type Ride,
} from '@/lib/api';
import { BOOKING_STATUS, RIDE_STATUS, formatDay, formatTime } from '@/lib/status';

export default function DriverRideScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ rideId: string }>();
  const rideId = Number(params.rideId);

  const [ride, setRide] = useState<Ride | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!token || !rideId) return;
    try {
      const [r, b] = await Promise.all([getRide(token, rideId), getRideBookings(token, rideId)]);
      setRide(r);
      setBookings(b);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load this ride.');
    }
  }

  usePolling(load, 8000);

  async function run(key: string, action: () => Promise<unknown>) {
    setBusy(key);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  }

  async function onStart() {
    if (!token || !ride) return;
    const pending = bookings.filter((b) => b.status === 'PENDING').length;
    const go = () =>
      run('start', async () => {
        await startRide(token, ride.id);
        router.push({ pathname: '/(app)/driver/trip', params: { rideId: String(ride.id) } });
      });
    if (pending > 0) {
      Alert.alert(
        'Start trip?',
        `${pending} request${pending === 1 ? ' is' : 's are'} still pending and will be declined automatically.`,
        [{ text: 'Not yet', style: 'cancel' }, { text: 'Start trip', onPress: go }]
      );
    } else {
      go();
    }
  }

  function onCancel() {
    if (!token || !ride) return;
    Alert.alert('Cancel this ride?', 'All passengers will be notified that the ride is cancelled.', [
      { text: 'Keep ride', style: 'cancel' },
      {
        text: 'Cancel ride',
        style: 'destructive',
        onPress: () => run('cancel', () => cancelRide(token, ride.id)),
      },
    ]);
  }

  if (!ride) {
    return (
      <View style={styles.root}>
        <AppHeader title="Ride" />
        {error ? <Text style={styles.error}>{error}</Text> : <ActivityIndicator style={{ marginTop: 40 }} color={Colors.light.primary} />}
      </View>
    );
  }

  const status = RIDE_STATUS[ride.status];
  const upcoming = ride.status === 'ACTIVE' || ride.status === 'FULL';
  const confirmedSeats = bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((n, b) => n + b.seatsBooked, 0);
  const pending = bookings.filter((b) => b.status === 'PENDING');
  const others = bookings.filter((b) => b.status !== 'PENDING');

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AppHeader title="Manage ride" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.time}>{formatTime(ride.departureTime)}</Text>
            <Text style={styles.day}>{formatDay(ride.departureTime)}</Text>
            <View style={{ flex: 1 }} />
            <View style={[styles.pill, { backgroundColor: status.bg }]}>
              <Text style={[styles.pillText, { color: status.color }]}>{status.label}</Text>
            </View>
          </View>
          <View style={styles.routeRow}>
            <View style={styles.ring} />
            <Text style={styles.routeText}>{ride.origin}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <MapPin size={14} color={Colors.light.primary} strokeWidth={2.5} />
            <Text style={styles.routeText}>{ride.destination}</Text>
          </View>
          <View style={styles.statsRow}>
            <Stat value={String(ride.seatsAvailable)} label="Seats left" />
            <Stat value={String(confirmedSeats)} label="Confirmed" />
            <Stat value={`RM ${ride.price.toFixed(2)}`} label="Per seat" />
          </View>
          {ride.note ? <Text style={styles.note}>Note: {ride.note}</Text> : null}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {pending.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Requests ({pending.length})</Text>
            {pending.map((b) => (
              <PassengerCard
                key={b.id}
                booking={b}
                actions={
                  <View style={styles.decisionRow}>
                    <Pressable
                      style={[styles.decisionBtn, styles.rejectBtn]}
                      disabled={busy !== null}
                      onPress={() => run(`reject-${b.id}`, () => rejectBooking(token!, b.id))}>
                      <X size={16} color={Colors.light.text} />
                      <Text style={styles.rejectText}>Decline</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.decisionBtn, styles.acceptBtn]}
                      disabled={busy !== null}
                      onPress={() => run(`accept-${b.id}`, () => acceptBooking(token!, b.id))}>
                      {busy === `accept-${b.id}` ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Check size={16} color="#FFFFFF" />
                          <Text style={styles.acceptText}>Accept</Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                }
              />
            ))}
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Passengers</Text>
        {others.length === 0 ? (
          <Text style={styles.empty}>
            {upcoming ? 'No passengers yet. Requests will appear here.' : 'No passengers on this ride.'}
          </Text>
        ) : (
          others.map((b) => <PassengerCard key={b.id} booking={b} />)
        )}
      </ScrollView>

      {upcoming || ride.status === 'IN_PROGRESS' ? (
        <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
          {ride.status === 'IN_PROGRESS' ? (
            <Pressable
              style={styles.primaryBtn}
              onPress={() => router.push({ pathname: '/(app)/driver/trip', params: { rideId: String(ride.id) } })}>
              <Navigation size={18} color="#FFFFFF" />
              <Text style={styles.primaryText}>Open live trip</Text>
            </Pressable>
          ) : (
            <>
              <Pressable style={styles.secondaryBtn} onPress={onCancel} disabled={busy !== null}>
                <Text style={styles.secondaryText}>Cancel ride</Text>
              </Pressable>
              <Pressable style={[styles.primaryBtn, { flex: 2 }]} onPress={onStart} disabled={busy !== null}>
                {busy === 'start' ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Navigation size={18} color="#FFFFFF" />
                    <Text style={styles.primaryText}>Start trip</Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

function PassengerCard({ booking, actions }: { booking: Booking; actions?: ReactNode }) {
  const status = BOOKING_STATUS[booking.status];
  const name = booking.passengerName ?? 'Passenger';
  const canChat = booking.status !== 'CANCELLED' && booking.status !== 'REJECTED';
  return (
    <View style={styles.passengerCard}>
      <View style={styles.passengerRow}>
        <Avatar name={name} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={styles.passengerName}>{name}</Text>
          <Text style={styles.passengerSub}>
            {booking.seatsBooked} seat{booking.seatsBooked === 1 ? '' : 's'} · RM {booking.totalPrice.toFixed(2)}
          </Text>
        </View>
        {!actions ? (
          <View style={[styles.pill, { backgroundColor: status.bg }]}>
            <Text style={[styles.pillText, { color: status.color }]}>{status.label}</Text>
          </View>
        ) : null}
        {canChat ? (
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push({ pathname: '/(app)/chat/[bookingId]', params: { bookingId: String(booking.id), name } })}>
            <MessageCircle size={18} color={Colors.light.primary} />
          </Pressable>
        ) : null}
        {booking.passengerPhone ? (
          <Pressable style={styles.iconBtn} onPress={() => Linking.openURL(`tel:${booking.passengerPhone}`)}>
            <Phone size={18} color={Colors.light.primary} />
          </Pressable>
        ) : null}
      </View>
      {actions}
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E0E0E0' },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 6 },
  cardTop: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 6 },
  time: { fontSize: 26, fontWeight: '800', color: Colors.light.text },
  day: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'center' },
  pillText: { fontSize: 11, fontWeight: '800' },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeLine: { height: 14, width: 1, backgroundColor: '#9CA3AF', marginLeft: 6 },
  ring: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: Colors.light.text, marginLeft: 1 },
  routeText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.light.text },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  stat: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '800', color: Colors.light.text },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  note: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.light.text, marginTop: 6 },
  empty: { fontSize: 13, color: '#6B7280' },
  passengerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, gap: 12 },
  passengerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  passengerName: { fontSize: 15, fontWeight: '800', color: Colors.light.text },
  passengerSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.light.primarySoft, alignItems: 'center', justifyContent: 'center' },
  decisionRow: { flexDirection: 'row', gap: 10 },
  decisionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, paddingVertical: 11 },
  rejectBtn: { backgroundColor: '#F3F4F6' },
  rejectText: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  acceptBtn: { backgroundColor: '#16A34A' },
  acceptText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  error: { color: Colors.light.danger, textAlign: 'center', margin: 12 },
  cta: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  primaryBtn: { flex: 1, flexDirection: 'row', gap: 8, backgroundColor: Colors.light.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { flex: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  secondaryText: { color: Colors.light.text, fontSize: 15, fontWeight: '700' },
});
