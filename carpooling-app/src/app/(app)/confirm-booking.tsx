import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, CreditCard, CheckCircle2 } from 'lucide-react-native';

import { Badge, Button, Card, ScreenHeader } from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError, createBooking, searchRides, type Ride } from '@/lib/api';

export default function ConfirmBookingScreen() {
  const { token, user } = useAuth();
  const params = useLocalSearchParams<{ rideId?: string }>();
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [seats, setSeats] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !params.rideId) return;
    searchRides(token, 'INTI International University', 'Nilai AEON Mall')
      .then((rides) => {
        const found = rides.find((r) => r.id === Number(params.rideId));
        if (found) setRide(found);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Error loading ride.'));
  }, [token, params.rideId]);

  async function onConfirm() {
    if (!token || !ride) return;
    setLoading(true);
    setError(null);
    try {
      await createBooking(token, { rideId: ride.id, seatsBooked: seats });
      // Redirect to bookings page after success
      router.replace('/(app)/bookings');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Booking failed.');
    } finally {
      setLoading(false);
    }
  }

  if (!ride) return <SafeAreaView style={styles.safe}><Text style={{textAlign:'center', marginTop: 40}}>Loading...</Text></SafeAreaView>;

  const serviceFee = 0.50;
  const total = (ride.price * seats) + serviceFee;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar style="light" />
      
      {/* Red Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Confirm Booking</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Driver Card */}
        <Card style={styles.driverCard}>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Driver:</Text>
            <Text style={styles.driverName}>Max Verstappen</Text>
          </View>
          <View style={{alignItems: 'flex-end', gap: 4}}>
            <Badge label="‚úĒ Verified Driver" variant="success" />
            <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
              <Text style={{color:'#FACC15'}}>‚ėÖ</Text>
              <Text style={{fontWeight:'800'}}>5.0</Text>
            </View>
          </View>
        </Card>

        {/* Booking Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Booking Summary</Text>
          
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Ride</Text>
            <Text style={styles.rowValue}>{ride.origin} ‚Üí {ride.destination}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Date</Text>
            <Text style={styles.rowValue}>{new Date(ride.departureTime).toLocaleDateString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Departure</Text>
            <Text style={styles.rowValue}>{new Date(ride.departureTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Passenger</Text>
            <Text style={styles.rowValue}>{user?.username || 'Passenger'} ({seats} Seat)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Contribution</Text>
            <Text style={[styles.rowValue, {color: Colors.light.primary}]}>RM {ride.price.toFixed(2)}</Text>
          </View>

          {/* Seat Counter */}
          <View style={styles.seatRow}>
            <Text style={styles.rowLabel}>Seats</Text>
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

        {/* Payment Method */}
        <Card style={styles.payCard}>
          <View style={styles.payIcon}><CreditCard size={20} color={Colors.light.primary} /></View>
          <View style={{flex: 1}}>
            <Text style={styles.label}>Payment method</Text>
            <Text style={styles.payText}>Visa ‚ÄĘ‚ÄĘ‚ÄĘ‚ÄĘ 4821</Text>
            <Text style={styles.paySub}>Expires 08/28</Text>
          </View>
          <Pressable style={styles.changeBtn}><Text style={styles.changeText}>Change</Text></Pressable>
        </Card>

        {/* Promo Code */}
        <Card style={styles.promoCard}>
          <View style={styles.promoInputWrap}>
            <TextInput placeholder="Promo code (try INTI10)" placeholderTextColor="#9CA3AF" style={styles.promoInput} />
          </View>
          <Pressable style={styles.applyBtn}><Text style={styles.applyText}>Apply</Text></Pressable>
        </Card>

        {/* Fare Breakdown */}
        <Card style={styles.fareCard}>
          <Text style={styles.cardTitle}>Fare breakdown</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Fare (RM {ride.price.toFixed(2)} √ó {seats})</Text>
            <Text style={styles.rowValue}>RM {(ride.price * seats).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Service fee</Text>
            <Text style={styles.rowValue}>RM {serviceFee.toFixed(2)}</Text>
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
        <Pressable style={styles.confirmBtn} onPress={onConfirm} disabled={loading}>
          <Text style={styles.confirmText}>
            {loading ? 'Requesting...' : `Request Seat ¬∑ RM ${total.toFixed(2)}`}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// Added missing import for TextInput
import { TextInput } from 'react-native';

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
  confirmBtn: { backgroundColor: '#E69996', paddingVertical: 16, borderRadius: 14, alignItems: 'center' }, // Faded red like the prototype
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});