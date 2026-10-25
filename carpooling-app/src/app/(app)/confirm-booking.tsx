import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wallet } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { Badge, Card } from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError, createBooking, getRide, type Ride } from '@/lib/api';
import { formatDay, formatTime } from '@/lib/status';

export default function ConfirmBookingScreen() {
  const { token, user } = useAuth();
  const params = useLocalSearchParams<{ rideId?: string }>();

  const [ride, setRide] = useState<Ride | null>(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !params.rideId) return;
    getRide(token, Number(params.rideId))
      .then(setRide)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Error loading ride.'));
  }, [token, params.rideId]);

  async function onConfirm() {
    if (!token || !ride) return;
    setLoading(true);
    setError(null);
    try {
      const booking = await createBooking(token, { rideId: ride.id, seatsBooked: seats });
      router.replace({ pathname: '/(app)/booking-details', params: { bookingId: booking.id } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Booking failed.');
    } finally {
      setLoading(false);
    }
  }

  if (!ride) {
    return (
      <View style={styles.safe}>
        <AppHeader title="Confirm Booking" />
        <Text style={{ textAlign: 'center', marginTop: 40 }}>{error || 'Loading...'}</Text>
      </View>
    );
  }

  const total = ride.price * seats;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar style="light" />
      <AppHeader title="Confirm Booking" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Driver Card */}
        <Card style={styles.driverCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Driver:</Text>
            <Text style={styles.driverName}>{ride.driverName ?? 'INTI driver'}</Text>
            {ride.vehicle ? <Text style={styles.paySub}>{ride.vehicle}</Text> : null}
          </View>
          <Badge label="✔ INTI student" variant="success" />
        </Card>

        {/* Booking Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Booking Summary</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Ride</Text>
            <Text style={styles.rowValue}>{ride.origin} → {ride.destination}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Date</Text>
            <Text style={styles.rowValue}>{formatDay(ride.departureTime)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Departure</Text>
            <Text style={styles.rowValue}>{formatTime(ride.departureTime)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Passenger</Text>
            <Text style={styles.rowValue}>{user?.username || 'Passenger'}</Text>
          </View>

          {/* Seat Counter */}
          <View style={styles.seatRow}>
            <Text style={styles.rowLabel}>Seats ({ride.seatsAvailable} left)</Text>
            <View style={styles.seatControl}>
              <Pressable style={styles.seatBtn} onPress={() => setSeats(Math.max(1, seats - 1))}>
                <Text style={styles.seatBtnText}>-</Text>
              </Pressable>
              <Text style={styles.seatNum}>{seats}</Text>
              <Pressable style={styles.seatBtn} onPress={() => setSeats(Math.min(ride.seatsAvailable, seats + 1))}>
                <Text style={styles.seatBtnText}>+</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        {/* Payment */}
        <Card style={styles.payCard}>
          <View style={styles.payIcon}><Wallet size={20} color={Colors.light.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Payment</Text>
            <Text style={styles.payText}>Pay your driver at pickup</Text>
            <Text style={styles.paySub}>Cash or DuitNow. You won't be charged until the driver accepts.</Text>
          </View>
        </Card>

        {/* Fare Breakdown */}
        <Card style={styles.fareCard}>
          <Text style={styles.cardTitle}>Fare breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Contribution (RM {ride.price.toFixed(2)} × {seats})</Text>
            <Text style={styles.rowValue}>RM {total.toFixed(2)}</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>RM {total.toFixed(2)}</Text>
          </View>
        </Card>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.cta}>
        <Pressable style={[styles.confirmBtn, loading && { opacity: 0.6 }]} onPress={onConfirm} disabled={loading}>
          <Text style={styles.confirmText}>
            {loading ? 'Requesting...' : `Request Seat · RM ${total.toFixed(2)}`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  header: {
    backgroundColor: Colors.light.primary,
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4, width: 32 },
  headerTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '800' },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },

  driverCard: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  label: { fontSize: 12, color: Colors.light.textSecondary, marginBottom: 2 },
  driverName: { fontSize: 18, fontWeight: '800', color: Colors.light.text },

  summaryCard: { padding: 16, gap: 10 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.light.text, marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 13, color: Colors.light.textSecondary },
  rowValue: { fontSize: 13, fontWeight: '700', color: Colors.light.text, textAlign: 'right', flex: 1, marginLeft: 16 },
  
  seatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  seatControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  seatBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  seatBtnText: { fontSize: 18, fontWeight: '600', color: Colors.light.text },
  seatNum: { fontSize: 16, fontWeight: '800', color: Colors.light.text },

  payCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  payIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#FDEBEC', alignItems: 'center', justifyContent: 'center' },
  payText: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  paySub: { fontSize: 11, color: Colors.light.textSecondary },
  changeBtn: { padding: 8 },
  changeText: { fontSize: 12, fontWeight: '700', color: Colors.light.primary },

  promoCard: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  promoInputWrap: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  promoInput: { fontSize: 13, color: Colors.light.text },
  applyBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  applyText: { color: '#FFF', fontWeight: '700', fontSize: 13 },

  fareCard: { padding: 16, gap: 8 },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLabel: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.light.primary },

  error: { color: Colors.light.primary, textAlign: 'center', fontSize: 13, marginTop: 8 },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  confirmBtn: { backgroundColor: Colors.light.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});