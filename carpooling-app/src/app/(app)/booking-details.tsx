import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Star, ShieldCheck, Clock, MapPin, CheckCircle2, XCircle, CalendarClock, Wallet as WalletIcon, Banknote } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError, cancelBooking, getBooking, type Booking } from '@/lib/api';

const PAYMENT_TEXT: Record<Booking['paymentStatus'], string> = {
  PAID: 'Paid from Campus Wallet',
  REFUNDED: 'Refunded to your Campus Wallet',
  PAID_OUT: 'Paid from Campus Wallet',
  CASH_ON_PICKUP: 'Pay the driver in cash at pickup',
};

export default function BookingDetailsScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { token } = useAuth();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  function confirmCancel() {
    if (!token || !booking) return;
    const refundNote =
      booking.paymentStatus === 'PAID'
        ? ` RM ${booking.totalPrice.toFixed(2)} will be refunded to your wallet.`
        : '';
    Alert.alert('Cancel booking?', `Your seat will be released.${refundNote}`, [
      { text: 'Keep booking', style: 'cancel' },
      {
        text: 'Cancel booking',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            setBooking(await cancelBooking(token, booking.id));
          } catch (err) {
            Alert.alert('Could not cancel', err instanceof ApiError ? err.message : 'Please try again.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }

  useEffect(() => {
    if (!token || !bookingId) return;
    getBooking(token, Number(bookingId))
      .then((data: Booking) => setBooking(data))
      .catch((err: any) => Alert.alert('Error', 'Could not load booking details.'))
      .finally(() => setLoading(false));
  }, [token, bookingId]);

  if (loading || !booking) {
    return (
      <View style={styles.root}>
        <AppHeader title="Booking Details" />
        <ActivityIndicator size="large" color={Colors.light.primary} style={{ flex: 1, marginTop: 40 }} />
      </View>
    );
  }

  const date = booking.departureTime ? new Date(booking.departureTime) : new Date();
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  
  const now = new Date().getTime();
  const rideTime = date.getTime();
  const diffInHours = (rideTime - now) / (1000 * 60 * 60);
  const isWithinOneHour = diffInHours <= 1 && diffInHours > -1;
  
  const isPending = booking.status === 'PENDING';
  const isCancelled = booking.status === 'CANCELLED' || booking.status === 'REJECTED';
  const isConfirmed = booking.status === 'CONFIRMED';

  const showTrackButton = isConfirmed && isWithinOneHour;
  const canCancel =
    (isPending || isConfirmed) && booking.rideStatus !== 'IN_PROGRESS' && booking.rideStatus !== 'COMPLETED';
  const paidByWallet = booking.paymentMethod === 'WALLET';
  const showFutureStatus = isConfirmed && !isWithinOneHour;

  return (
    <View style={styles.root}>
      <AppHeader title="Booking Details" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {isPending && (
          <View style={[styles.statusBanner, { backgroundColor: '#FEF3C7' }]}>
            <Clock size={20} color="#D97706" />
            <Text style={[styles.statusBannerText, { color: '#D97706' }]}>
              Waiting for driver to approve your request
            </Text>
          </View>
        )}
        {isCancelled && (
          <View style={[styles.statusBanner, { backgroundColor: '#FEE2E2' }]}>
            <XCircle size={20} color="#EF4444" />
            <Text style={[styles.statusBannerText, { color: '#EF4444' }]}>
              This booking has been cancelled
            </Text>
          </View>
        )}
        {showFutureStatus && (
          <View style={[styles.statusBanner, { backgroundColor: '#EFF6FF' }]}>
            <CalendarClock size={20} color="#3B82F6" />
            <Text style={[styles.statusBannerText, { color: '#3B82F6' }]}>
              Your ride is scheduled for {dateString}
            </Text>
          </View>
        )}
        {showTrackButton && (
          <View style={[styles.statusBanner, { backgroundColor: '#ECFDF5' }]}>
            <CheckCircle2 size={20} color="#10B981" />
            <Text style={[styles.statusBannerText, { color: '#10B981' }]}>
              Your driver is confirmed and on the way!
            </Text>
          </View>
        )}

        <View style={styles.driverCard}>
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarText}>{booking.driverName?.charAt(0) || 'D'}</Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{booking.driverName || 'Driver'}</Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={14} color="#10B981" />
              <Text style={styles.verifiedText}>Verified Driver</Text>
            </View>
          </View>
          <View style={styles.ratingBadge}>
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>5.0</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{timeString}</Text>
            <Text style={styles.dateText}>{dateString}</Text>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeLine} />
            <View style={styles.routeItem}>
              <View style={styles.dotStart} />
              <Text style={styles.routeText}>{booking.origin}</Text>
            </View>
            <View style={styles.routeItem}>
              <View style={styles.dotEnd} />
              <Text style={styles.routeText}>{booking.destination}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passenger:</Text>
            <Text style={styles.detailValue}>{booking.passengerName || 'You'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Seats Booked:</Text>
            <Text style={styles.detailValue}>{booking.seatsBooked}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Contribution:</Text>
            <Text style={styles.detailValue}>RM {booking.totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Payment</Text>
          <View style={styles.paymentRow}>
            {paidByWallet ? <WalletIcon size={20} color="#374151" /> : <Banknote size={20} color="#374151" />}
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>{PAYMENT_TEXT[booking.paymentStatus]}</Text>
              <Text style={styles.paymentSub}>RM {booking.totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle</Text>
          <View style={styles.vehicleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName}>{booking.vehicle?.split('·')[0] || 'Car'}</Text>
              <Text style={styles.vehicleDetail}>Color: {booking.vehicle?.split('·')[1] || 'Unknown'}</Text>
              <Text style={styles.vehicleDetail}>Plate: {booking.vehicle?.split('·')[2] || 'Unknown'}</Text>
            </View>
            <View style={styles.vehicleImagePlaceholder}>
              <Text style={{ fontSize: 40 }}>🚗</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        {showTrackButton ? (
          <Pressable 
            style={styles.trackBtn}
            onPress={() => router.push({ 
              pathname: '/(app)/tracking', 
              params: { rideId: booking.rideId, bookingId: booking.id } 
            })}
          >
            <Text style={styles.trackBtnText}>Track Driver</Text>
          </Pressable>
        ) : showFutureStatus ? (
          <View style={[styles.trackBtn, { backgroundColor: '#E5E7EB' }]}>
            <Text style={[styles.trackBtnText, { color: '#6B7280' }]}>Tracking available 1hr before departure</Text>
          </View>
        ) : isPending ? (
          <View style={[styles.trackBtn, { backgroundColor: '#E5E7EB' }]}>
            <Text style={[styles.trackBtnText, { color: '#6B7280' }]}>Pending Approval</Text>
          </View>
        ) : null}
        {canCancel ? (
          <Pressable style={styles.cancelLink} onPress={confirmCancel} disabled={cancelling}>
            <Text style={styles.cancelLinkText}>
              {cancelling ? 'Cancelling…' : isPending ? 'Cancel request' : 'Cancel booking'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  paymentTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  paymentSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cancelLink: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  cancelLinkText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
  root: { flex: 1, backgroundColor: '#D1D5DB' },
  scrollContent: { padding: 16, gap: 16 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 12 },
  statusBannerText: { flex: 1, fontSize: 14, fontWeight: '700' },
  driverCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: 16, padding: 16 },
  avatarPlaceholder: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 18, fontWeight: '800', color: '#111827' },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifiedText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '800', color: '#374151' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  timeText: { fontSize: 18, fontWeight: '800', color: '#111827' },
  dateText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  routeContainer: { position: 'relative', marginBottom: 16, paddingLeft: 20 },
  routeLine: { position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, backgroundColor: '#9CA3AF' },
  routeItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dotStart: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#111827', backgroundColor: '#FFF', position: 'absolute', left: -20 },
  dotEnd: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#111827', position: 'absolute', left: -20 },
  routeText: { fontSize: 15, fontWeight: '500', color: '#111827', flex: 1 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 8 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center' },
  vehicleName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  vehicleDetail: { fontSize: 14, color: '#4B5563', marginBottom: 2 },
  vehicleImagePlaceholder: { width: 100, height: 60, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 16, backgroundColor: '#D1D5DB' },
  trackBtn: { backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  trackBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});