import { router, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, ScrollView } from 'react-native';

import { AppHeader } from '@/components/app-header'; // <-- Use the perfect header
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { getMyBookings, type Booking, type BookingStatus } from '@/lib/api';

const TABS = ['All', 'Pending', 'Confirmed', 'Completed', 'Canceled'];

export default function BookingsScreen() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      getMyBookings(token)
        .then((data: Booking[]) => setBookings(data))
        .catch((err: any) => console.log('Error fetching bookings:', err))
        .finally(() => setLoading(false));
    }, [token])
  );

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'All') return true;
    // Backend spells it CANCELLED, and declined requests belong on that tab too
    if (activeTab === 'Canceled') return b.status === 'CANCELLED' || b.status === 'REJECTED';
    return b.status.toUpperCase() === activeTab.toUpperCase();
  });

  const paymentLabel = (b: Booking) => {
    switch (b.paymentStatus) {
      case 'PAID':
      case 'PAID_OUT': return `Paid RM ${b.totalPrice.toFixed(2)} · wallet`;
      case 'REFUNDED': return `Refunded RM ${b.totalPrice.toFixed(2)}`;
      default: return `RM ${b.totalPrice.toFixed(2)} · cash`;
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'PENDING': return '#D97706'; // Orange
      case 'CONFIRMED': return '#10B981'; // Green
      case 'COMPLETED': return '#6B7280'; // Grey
      case 'CANCELLED': return '#EF4444'; // Red
      case 'REJECTED': return '#EF4444'; // Red
      default: return '#6B7280';
    }
  };

  const renderBooking = ({ item }: { item: Booking }) => {
    const date = item.departureTime ? new Date(item.departureTime) : new Date();
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = date.toLocaleDateString([], { day: 'numeric', month: 'short' });

    return (
      <View style={styles.card}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <Text style={styles.driverName}>{item.driverName || 'Driver'}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0) + item.status.slice(1).toLowerCase()}
          </Text>
        </View>

        {/* Time Row */}
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{timeString}</Text>
          <Text style={styles.dateSeatsText}>{dateString} · {item.seatsBooked} seat · {paymentLabel(item)}</Text>
        </View>

        {/* Route Row */}
        <View style={styles.routeContainer}>
          <View style={styles.routeLine} />
          <View style={styles.routeItem}>
            <View style={styles.dotStart} />
            <Text style={styles.routeText} numberOfLines={1}>{item.origin || 'Origin'}</Text>
          </View>
          <View style={styles.routeItem}>
            <View style={styles.dotEnd} />
            <Text style={styles.routeText} numberOfLines={1}>{item.destination || 'Destination'}</Text>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footerRow}>
          <Pressable 
            style={styles.detailsBtn}
            onPress={() => router.push({ pathname: '/(app)/booking-details', params: { bookingId: item.id } })}
          >
            <Text style={styles.detailsBtnText}>View Details</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Use the perfect AppHeader instead of the manual red view */}
      <AppHeader title="My Bookings" />

      {/* Tabs */}
      <View style={styles.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
          {TABS.map((tab) => (
            <Pressable 
              key={tab} 
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : filteredBookings.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No {activeTab.toLowerCase()} bookings.</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={renderBooking}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E5E7EB' },
  
  // Tabs
  tabsWrapper: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabsContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 20 },
  tabItem: { paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#E93F3F' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#E93F3F', fontWeight: '800' },

  list: { padding: 16, gap: 16 },
  
  // Grey Card Design
  card: { backgroundColor: '#D1D5DB', borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  driverName: { fontSize: 15, fontWeight: '700', color: '#374151' },
  statusText: { fontSize: 14, fontWeight: '800' },
  
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  timeText: { fontSize: 24, fontWeight: '800', color: '#111827' },
  dateSeatsText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  
  // Route Lines
  routeContainer: { position: 'relative', marginBottom: 16, paddingLeft: 20 },
  routeLine: { position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, backgroundColor: '#9CA3AF' },
  routeItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dotStart: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#111827', backgroundColor: '#D1D5DB', position: 'absolute', left: -20 },
  dotEnd: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E93F3F', position: 'absolute', left: -20 },
  routeText: { fontSize: 14, fontWeight: '600', color: '#111827', flex: 1 },

  footerRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  detailsBtn: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  detailsBtnText: { fontSize: 13, fontWeight: '700', color: '#111827' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
});