import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Changed import
import { ChevronLeft, Circle, MapPin } from 'lucide-react-native';

import { BottomNav } from '@/components/bottom-nav';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError, getMyBookings, type Booking } from '@/lib/api';

const TABS = ['All', 'Pending', 'Confirmed', 'Completed', 'Canceled'];

export default function MyBookingsScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getMyBookings(token)
      .then(setBookings)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load bookings.'));
  }, [token]);

  const filteredBookings = activeTab === 'All' 
    ? bookings 
    : bookings.filter(b => b.status.toLowerCase() === activeTab.toLowerCase());

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      
      {/* Header safely padding from top */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable 
            key={tab} 
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        {filteredBookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings found.</Text>
        ) : (
          filteredBookings.map((booking) => (
            <View key={booking.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.driverName}>Driver #{booking.rideId}</Text>
                <Text style={[
                  styles.statusText, 
                  booking.status === 'PENDING' && { color: '#D97706' },
                  booking.status === 'CONFIRMED' && { color: '#15803D' },
                  booking.status === 'CANCELED' && { color: '#9CA3AF' },
                ]}>
                  {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                </Text>
              </View>

              <Text style={styles.time}>
                {new Date(booking.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              
              <Text style={styles.dateText}>
                {new Date(booking.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })} · {booking.seatsBooked} seat
              </Text>

              <View style={styles.routeWrap}>
                <View style={styles.routeRow}>
                  <Circle size={10} color={Colors.light.text} strokeWidth={3} />
                  <Text style={styles.routeText}>INTI International University</Text>
                </View>
                <View style={styles.routeLine} />
                <View style={styles.routeRow}>
                  <MapPin size={12} color={Colors.light.primary} strokeWidth={2.5} />
                  <Text style={styles.routeText}>Nilai AEON Mall</Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                {booking.status === 'COMPLETED' && (
                  <Pressable style={styles.rateBtn}>
                    <Text style={styles.rateBtnText}>Rate</Text>
                  </Pressable>
                )}
                <Pressable 
                  style={styles.detailsBtn}
                  onPress={() => router.push({ pathname: '/(app)/booking-details', params: { bookingId: booking.id } })}
                >
                  <Text style={styles.detailsText}>View Details</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <BottomNav active="bookings" />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#EFEFEF' },
  header: { backgroundColor: Colors.light.primary, paddingBottom: 16, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4, width: 32 },
  headerTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '800' },
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
  rateBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  rateBtnText: { fontSize: 12, fontWeight: '700', color: Colors.light.text },
  detailsBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  detailsText: { fontSize: 12, fontWeight: '700', color: Colors.light.text },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20, fontSize: 14 },
  error: { textAlign: 'center', color: Colors.light.primary, fontSize: 13, marginBottom: 10 }
});