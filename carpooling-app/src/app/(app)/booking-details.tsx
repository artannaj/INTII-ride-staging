import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MessageCircle, Phone, Share, Circle, MapPin, Upload } from 'lucide-react-native';

import { Avatar, Badge, Card } from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError, getMyBookings, type Booking } from '@/lib/api';

export default function BookingDetailsScreen() {
  const { token, user } = useAuth();
  const params = useLocalSearchParams<{ bookingId?: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!token || !params.bookingId) return;
    getMyBookings(token).then((bookings) => {
      const found = bookings.find(b => b.id === Number(params.bookingId));
      if (found) setBooking(found);
    }).catch(() => {});
  }, [token, params.bookingId]);

  if (!booking) return <SafeAreaView style={styles.safe}><Text style={{textAlign:'center', marginTop: 40}}>Loading...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar style="light" />
      
      {/* Red Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <Pressable style={styles.backBtn}>
            <Upload size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Status Card */}
        <Card style={styles.statusCard}>
          <Text style={styles.label}>Booking Status:</Text>
          <Text style={styles.statusTitle}>‚Ź≥ Pending Driver Approval</Text>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressLine, styles.progressLineActive]} />
            <View style={styles.progressDot} />
            <View style={styles.progressLine} />
            <View style={styles.progressDot} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressTextActive}>Requested</Text>
            <Text style={styles.progressText}>Accepted</Text>
            <Text style={styles.progressText}>Pickup</Text>
          </View>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Booking Information</Text>
          <Row label="Booking ID:" value={`BKG-${booking.id}260929`} />
          <Row label="Passenger:" value={`${user?.username || 'Passenger'} (${booking.seatsBooked} Seat)`} />
          <Row label="Booked On:" value={new Date(booking.createdAt).toLocaleString()} />
        </Card>

        {/* Ride Card */}
        <Card style={styles.rideCard}>
          <Text style={styles.cardTitle}>Ride Information</Text>
          
          <View style={styles.driverRow}>
            <Avatar name="Max Verstappen" size={44} />
            <View style={{flex: 1}}>
              <Text style={styles.driverName}>Max Verstappen</Text>
              <Text style={styles.carName}>Aston Martin Valkyrie ¬∑ MY6767</Text>
            </View>
            <View style={styles.matricBadge}><Text style={styles.matricText}>I25076676</Text></View>
          </View>

          <Row label="Departure:" value={new Date(booking.createdAt).toLocaleString()} />
          
          <View style={styles.routeWrap}>
            <View style={styles.routeRow}>
              <Circle size={12} color={Colors.light.text} strokeWidth={3} />
              <Text style={styles.routeText}>INTI International University</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.routeRow}>
              <MapPin size={14} color={Colors.light.primary} strokeWidth={2.5} />
              <Text style={styles.routeText}>Nilai AEON Mall</Text>
            </View>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn}>
            <MessageCircle size={20} color={Colors.light.primary} />
            <Text style={styles.actionText}>Chat</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Phone size={20} color={Colors.light.primary} />
            <Text style={styles.actionText}>Call</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Share size={20} color={Colors.light.primary} />
            <Text style={styles.actionText}>Share</Text>
          </Pressable>
        </View>

        {/* Payment Card */}
        <Card style={styles.payCard}>
          <Text style={styles.cardTitle}>Payment</Text>
          <Row label="Contribution:" value={`RM ${(booking.totalPrice - 0.50).toFixed(2)}`} />
          <Row label="Service fee:" value="RM 0.50" />
          <Row label="Payment Method:" value="Visa ‚ÄĘ‚ÄĘ‚ÄĘ‚ÄĘ 4821" />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>RM {booking.totalPrice.toFixed(2)}</Text>
          </View>
        </Card>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.cta}>
        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel Request</Text>
        </Pressable>
      </View>
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
  matricBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  matricText: { fontSize: 10, fontWeight: '700', color: Colors.light.textSecondary },
  
  routeWrap: { marginTop: 8, gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeText: { fontSize: 12, fontWeight: '600', color: Colors.light.text },
  routeLine: { height: 16, width: 1, backgroundColor: '#D1D5DB', marginLeft: 5 },

  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 12, borderRadius: 12, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  actionText: { fontSize: 12, fontWeight: '700', color: Colors.light.primary },

  payCard: { padding: 16, gap: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  totalLabel: { fontSize: 14, fontWeight: '800', color: Colors.light.text },
  totalValue: { fontSize: 16, fontWeight: '800', color: Colors.light.primary },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  cancelBtn: { backgroundColor: '#FFFFFF', paddingVertical: 16, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  cancelText: { color: Colors.light.primary, fontSize: 16, fontWeight: '800' },
});