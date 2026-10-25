import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Share as RNShare, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Phone, Share, Circle, MapPin, Navigation } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { Avatar, Card } from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePolling } from '@/hooks/use-polling';
import { ApiError, cancelBooking, getBooking, type Booking } from '@/lib/api';
import { formatDay, formatTime } from '@/lib/status';

const STEPS = ['Requested', 'Accepted', 'On the way', 'Completed'];

function progressOf(b: Booking): number {
  if (b.status === 'COMPLETED') return 3;
  if (b.status === 'CONFIRMED') return b.rideStatus === 'IN_PROGRESS' ? 2 : 1;
  return 0;
}

function headlineOf(b: Booking): string {
  switch (b.status) {
    case 'PENDING': return '⏳ Waiting for driver approval';
    case 'CONFIRMED': return b.rideStatus === 'IN_PROGRESS' ? '🚗 Your driver is on the way' : '✅ Seat confirmed';
    case 'COMPLETED': return '🏁 Trip completed';
    case 'REJECTED': return 'Request declined by driver';
    case 'CANCELLED': return 'Booking cancelled';
  }
}

export default function BookingDetailsScreen() {
  const { token, user } = useAuth();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  usePolling(async () => {
    if (!token || !params.bookingId) return;
    try {
      setBooking(await getBooking(token, Number(params.bookingId)));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load booking.');
    }
  }, 10000);

  if (!booking) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Booking Details" />
        <Text style={{ textAlign: 'center', marginTop: 40 }}>{error || 'Loading...'}</Text>
      </View>
    );
  }

  const step = progressOf(booking);
  const closed = booking.status === 'CANCELLED' || booking.status === 'REJECTED';
  const live = booking.status === 'CONFIRMED' && booking.rideStatus === 'IN_PROGRESS';
  const cancellable =
    (booking.status === 'PENDING' || booking.status === 'CONFIRMED') &&
    booking.rideStatus !== 'IN_PROGRESS' &&
    booking.rideStatus !== 'COMPLETED';
  const driverName = booking.driverName ?? 'Driver';

  function confirmCancel() {
    if (!token || !booking) return;
    Alert.alert('Cancel booking?', 'Your seat will be released for other passengers.', [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            setBooking(await cancelBooking(token, booking.id));
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not cancel.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }

  async function shareTrip() {
    if (!booking) return;
    await RNShare.share({
      message: `My INTI Ride: ${booking.origin} → ${booking.destination}, ${formatDay(booking.departureTime)} at ${formatTime(booking.departureTime)} with ${driverName}${booking.vehicle ? ` (${booking.vehicle})` : ''}.`,
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar style="light" />
      <AppHeader title="Booking Details" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <Text style={styles.label}>Booking Status:</Text>
          <Text style={styles.statusTitle}>{headlineOf(booking)}</Text>

          {!closed ? (
            <>
              <View style={styles.progressBar}>
                {STEPS.map((_, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', flex: i === STEPS.length - 1 ? 0 : 1 }}>
                    <View style={[styles.progressDot, i <= step && styles.progressDotActive]} />
                    {i < STEPS.length - 1 ? (
                      <View style={[styles.progressLine, i < step && styles.progressLineActive]} />
                    ) : null}
                  </View>
                ))}
              </View>
              <View style={styles.progressLabels}>
                {STEPS.map((label, i) => (
                  <Text key={label} style={i <= step ? styles.progressTextActive : styles.progressText}>{label}</Text>
                ))}
              </View>
            </>
          ) : null}
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Booking Information</Text>
          <Row label="Booking ID:" value={`BKG-${String(booking.id).padStart(5, '0')}`} />
          <Row label="Passenger:" value={`${user?.username || 'Passenger'} (${booking.seatsBooked} seat${booking.seatsBooked === 1 ? '' : 's'})`} />
          <Row label="Booked On:" value={new Date(booking.createdAt).toLocaleString()} />
        </Card>

        {/* Ride Card */}
        <Card style={styles.rideCard}>
          <Text style={styles.cardTitle}>Ride Information</Text>

          <View style={styles.driverRow}>
            <Avatar name={driverName} size={44} />
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{driverName}</Text>
              <Text style={styles.carName}>{booking.vehicle ?? 'Vehicle details not provided'}</Text>
            </View>
          </View>

          <Row label="Departure:" value={`${formatDay(booking.departureTime)}, ${formatTime(booking.departureTime)}`} />

          <View style={styles.routeWrap}>
            <View style={styles.routeRow}>
              <Circle size={12} color={Colors.light.text} strokeWidth={3} />
              <Text style={styles.routeText}>{booking.origin}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <MapPin size={14} color={Colors.light.primary} strokeWidth={2.5} />
              <Text style={styles.routeText}>{booking.destination}</Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionBtn, closed && styles.actionDisabled]}
            disabled={closed}
            onPress={() => router.push({ pathname: '/(app)/chat/[bookingId]', params: { bookingId: String(booking.id), name: driverName } })}>
            <MessageCircle size={20} color={Colors.light.primary} />
            <Text style={styles.actionText}>Chat</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, !booking.driverPhone && styles.actionDisabled]}
            disabled={!booking.driverPhone}
            onPress={() => Linking.openURL(`tel:${booking.driverPhone}`)}>
            <Phone size={20} color={Colors.light.primary} />
            <Text style={styles.actionText}>{booking.driverPhone ? 'Call' : 'Call after accept'}</Text>
          </Pressable>
          <Pressable style={styles.actionBtn} onPress={shareTrip}>
            <Share size={20} color={Colors.light.primary} />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
        </View>

        {/* Payment Card */}
        <Card style={styles.payCard}>
          <Text style={styles.cardTitle}>Payment</Text>
          <Row label="Contribution:" value={`RM ${booking.totalPrice.toFixed(2)}`} />
          <Row label="Payment Method:" value="Pay driver at pickup" />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>RM {booking.totalPrice.toFixed(2)}</Text>
          </View>
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      {/* Bottom CTA */}
      {live || cancellable ? (
        <View style={styles.cta}>
          {live ? (
            <Pressable
              style={styles.trackBtn}
              onPress={() => router.push({ pathname: '/(app)/tracking', params: { rideId: booking.rideId, bookingId: booking.id } })}>
              <Navigation size={18} color="#FFFFFF" />
              <Text style={styles.trackText}>Track driver</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.cancelBtn} onPress={confirmCancel} disabled={cancelling}>
              {cancelling ? (
                <ActivityIndicator color={Colors.light.primary} />
              ) : (
                <Text style={styles.cancelText}>{booking.status === 'PENDING' ? 'Cancel Request' : 'Cancel Booking'}</Text>
              )}
            </Pressable>
          )}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },

  label: { fontSize: 12, color: Colors.light.textSecondary, marginBottom: 4 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.light.text, marginBottom: 12 },

  statusCard: { padding: 16 },
  statusTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text, marginBottom: 16 },
  progressBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E5E7EB' },
  progressDotActive: { backgroundColor: Colors.light.primary },
  progressLine: { flex: 1, height: 2, backgroundColor: '#E5E7EB' },
  progressLineActive: { backgroundColor: Colors.light.primary },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },
  progressTextActive: { fontSize: 10, color: Colors.light.text, fontWeight: '800' },

  infoCard: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { fontSize: 12, color: Colors.light.textSecondary },
  rowValue: { fontSize: 12, fontWeight: '600', color: Colors.light.text },

  rideCard: { padding: 16, gap: 12 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverName: { fontSize: 14, fontWeight: '800', color: Colors.light.text },
  carName: { fontSize: 11, color: Colors.light.textSecondary },
  
  routeWrap: { marginTop: 8, gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeText: { fontSize: 12, fontWeight: '600', color: Colors.light.text },
  routeLine: { height: 16, width: 1, backgroundColor: '#D1D5DB', marginLeft: 5 },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  actionText: { fontSize: 12, fontWeight: '700', color: Colors.light.primary },
  actionDisabled: { opacity: 0.45 },
  error: { color: Colors.light.danger, textAlign: 'center', fontSize: 13 },

  payCard: { padding: 16, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLabel: { fontSize: 14, fontWeight: '800', color: Colors.light.text },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.light.primary },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  cancelBtn: { backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cancelText: { color: Colors.light.primary, fontSize: 16, fontWeight: '800' },
  trackBtn: { flexDirection: 'row', gap: 8, backgroundColor: Colors.light.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  trackText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});