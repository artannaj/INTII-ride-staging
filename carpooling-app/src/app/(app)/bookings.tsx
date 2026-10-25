import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Circle, MapPin, Navigation } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePolling } from '@/hooks/use-polling';
import { ApiError, getMyBookings, type Booking, type BookingStatus } from '@/lib/api';
import { BOOKING_STATUS, formatDay, formatTime } from '@/lib/status';

const TABS: { label: string; statuses: BookingStatus[] | null }[] = [
  { label: 'All', statuses: null },
  { label: 'Pending', statuses: ['PENDING'] },
  { label: 'Confirmed', statuses: ['CONFIRMED'] },
  { label: 'Completed', statuses: ['COMPLETED'] },
  { label: 'Cancelled', statuses: ['CANCELLED', 'REJECTED'] },
];

export default function MyBookingsScreen() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [error, setError] = useState<string | null>(null);

  // Refresh while visible so "Pending" flips to "Confirmed" when the driver accepts
  usePolling(async () => {
    if (!token) return;
    try {
      setBookings(await getMyBookings(token));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load bookings.');
    }
  }, 15000);

  const tab = TABS.find((t) => t.label === activeTab)!;
  const filteredBookings = (bookings ?? []).filter((b) => !tab.statuses || tab.statuses.includes(b.status));

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <AppHeader title="My Bookings" />

      <View style={styles.tabBar}>
        {TABS.map(({ label }) => (
          <Pressable
            key={label}
            onPress={() => setActiveTab(label)}
            style={[styles.tabItem, activeTab === label && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, activeTab === label && styles.tabTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {bookings && filteredBookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings found.</Text>
        ) : (
          filteredBookings.map((booking) => {
            const status = BOOKING_STATUS[booking.status];
            const live = booking.status === 'CONFIRMED' && booking.rideStatus === 'IN_PROGRESS';
            return (
              <Pressable
                key={booking.id}
                style={styles.card}
                onPress={() => router.push({ pathname: '/(app)/booking-details', params: { bookingId: booking.id } })}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.driverName}>{booking.driverName ?? 'Driver'}</Text>
                  <Text style={[styles.statusText, { color: live ? Colors.light.primary : status.color }]}>
                    {live ? 'On the way' : status.label}
                  </Text>
                </View>

                <Text style={styles.time}>{formatTime(booking.departureTime)}</Text>
                <Text style={styles.dateText}>
                  {formatDay(booking.departureTime)} · {booking.seatsBooked} seat{booking.seatsBooked === 1 ? '' : 's'} · RM {booking.totalPrice.toFixed(2)}
                </Text>

                <View style={styles.routeWrap}>
                  <View style={styles.routeRow}>
                    <Circle size={10} color={Colors.light.text} strokeWidth={3} />
                    <Text style={styles.routeText}>{booking.origin}</Text>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeRow}>
                    <MapPin size={12} color={Colors.light.primary} strokeWidth={2.5} />
                    <Text style={styles.routeText}>{booking.destination}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  {live ? (
                    <Pressable
                      style={styles.trackBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/(app)/tracking',
                          params: { rideId: booking.rideId, bookingId: booking.id },
                        })
                      }
                    >
                      <Navigation size={14} color="#FFFFFF" />
                      <Text style={styles.trackText}>Track</Text>
                    </Pressable>
                  ) : null}
                  <View style={styles.detailsBtn}>
                    <Text style={styles.detailsText}>View Details</Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      <BottomNav active="bookings" />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  tabBar: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: Colors.light.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF' },
  tabTextActive: { color: Colors.light.primary, fontWeight: '800' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  card: { backgroundColor: '#E0E0E0', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#D1D5DB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  driverName: { fontSize: 14, fontWeight: '800', color: Colors.light.text },
  statusText: { fontSize: 12, fontWeight: '700' },
  time: { fontSize: 20, fontWeight: '800', color: '#2A2A2A', marginTop: 4 },
  dateText: { fontSize: 11, color: Colors.light.textSecondary, marginBottom: 12 },
  routeWrap: { gap: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  routeText: { fontSize: 12, fontWeight: '600', color: Colors.light.text },
  routeLine: { height: 12, width: 1, backgroundColor: '#9CA3AF', marginLeft: 5 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  trackBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.light.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  trackText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  detailsBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  detailsText: { fontSize: 12, fontWeight: '700', color: Colors.light.text },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20, fontSize: 14 },
  error: { textAlign: 'center', color: Colors.light.primary, fontSize: 13, marginBottom: 10 }
});