import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, ScrollView, TextInput, Alert } from 'react-native';
import { Star, BellRing } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header'; // <-- Use the perfect header
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { getUpcomingRides, type Ride } from '@/lib/api';

export default function SearchResultsScreen() {
  const { pickup, destination } = useLocalSearchParams<{ pickup: string, destination: string }>();
  const { token } = useAuth();
  
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    
    // Fetch all upcoming rides
    getUpcomingRides(token)
      .then((data: Ride[]) => {
        setAllRides(data);
      })
      .catch((err: any) => {
        console.log(err);
        Alert.alert('Error', 'Could not fetch rides.');
      })
      .finally(() => setLoading(false));
  }, [token]);

  // BULLETPROOF DATE FILTER (Ignores Timezones)
  const ridesForSelectedDate = allRides.filter(ride => {
    const matchesRoute = 
      ride.destination.toLowerCase().includes(destination.toLowerCase()) || 
      ride.origin.toLowerCase().includes(pickup.toLowerCase());

    if (!matchesRoute) return false;

    const rideDate = new Date(ride.departureTime);
    
    const isSameDay = 
      rideDate.getDate() === selectedDate.getDate() &&
      rideDate.getMonth() === selectedDate.getMonth() &&
      rideDate.getFullYear() === selectedDate.getFullYear();

    return isSameDay;
  });

  const renderRide = ({ item }: { item: Ride }) => {
    const date = new Date(item.departureTime);
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const plate = item.vehicle?.split('·')[2]?.trim() || 'UNKNOWN';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.driverName}>{item.driverName || 'Driver'}</Text>
          <View style={styles.plateBadge}>
            <Text style={styles.plateText}>{plate}</Text>
          </View>
          <Text style={styles.priceText}>{item.price === 0 ? 'FREE' : `RM ${item.price.toFixed(2)}`}</Text>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{timeString}</Text>
          <Text style={styles.seatsText}>{item.seatsAvailable} seats</Text>
        </View>

        <View style={styles.routeContainer}>
          <View style={styles.routeLine} />
          <View style={styles.routeItem}>
            <View style={styles.dotStart} />
            <Text style={styles.routeText} numberOfLines={1}>{item.origin}</Text>
          </View>
          <View style={styles.routeItem}>
            <View style={styles.dotEnd} />
            <Text style={styles.routeText} numberOfLines={1}>{item.destination}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.ratingBadge}>
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingText}>5.0</Text>
          </View>
          <Pressable 
            style={styles.detailsBtn}
            onPress={() => router.push({ pathname: '/(app)/ride-details', params: { rideId: item.id } })}
          >
            <Text style={styles.detailsBtnText}>View Details</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const getDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        fullDate: d,
        day: d.getDate().toString(),
        name: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isActive: d.toDateString() === selectedDate.toDateString()
      });
    }
    return dates;
  };

  const handleNotifyMe = () => {
    if (!notifyEmail.trim()) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    setNotified(true);
    Alert.alert('Notification Set', `We'll notify you at ${notifyEmail} when a ride becomes available on this date!`);
  };

  return (
    <View style={styles.root}>
      <AppHeader title="Search Result" />

      {/* ROUTE SUMMARY */}
      <View style={styles.routeSummary}>
        <Text style={styles.summaryText}>{pickup}</Text>
        <Text style={styles.summaryArrow}>→ {destination}</Text>
      </View>

      {/* DATE SCROLLER */}
      <View style={styles.dateScrollerWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroller}>
          {getDates().map((d, i) => (
            <Pressable 
              key={i} 
              style={[styles.dateCard, d.isActive && styles.dateCardActive]}
              onPress={() => {
                setSelectedDate(d.fullDate);
                setNotified(false); 
              }}
            >
              <Text style={[styles.dateDay, d.isActive && styles.dateTextActive]}>{d.day}</Text>
              <Text style={[styles.dateName, d.isActive && styles.dateTextActive]}>{d.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* LIST OR EMPTY STATE */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EF4444" />
        </View>
      ) : ridesForSelectedDate.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyCard}>
            <BellRing size={40} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No rides available</Text>
            <Text style={styles.emptySub}>There are no rides for this date. Want us to notify you when someone posts one?</Text>
            
            {notified ? (
              <View style={styles.successBox}>
                <Text style={styles.successText}>✅ We'll notify you!</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={notifyEmail}
                  onChangeText={setNotifyEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Pressable style={styles.notifyBtn} onPress={handleNotifyMe}>
                  <Text style={styles.notifyBtnText}>Notify Me</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={ridesForSelectedDate}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={renderRide}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E5E5E5' },
  
  // Route Summary
  routeSummary: { padding: 16, backgroundColor: '#D1D5DB' },
  summaryText: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  summaryArrow: { fontSize: 15, fontWeight: '600', color: '#111827' },

  // Date Scroller
  dateScrollerWrapper: { backgroundColor: '#D1D5DB', paddingBottom: 16 },
  dateScroller: { paddingHorizontal: 16, gap: 12 },
  dateCard: { width: 60, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', paddingVertical: 12 },
  dateCardActive: { backgroundColor: '#E93F3F' },
  dateDay: { fontSize: 18, fontWeight: '800', color: '#E93F3F' },
  dateName: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginTop: 2 },
  dateTextActive: { color: '#FFF' },

  // Ride Cards
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: '#D1D5DB', borderRadius: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  driverName: { fontSize: 16, fontWeight: '700', color: '#FFF', flex: 1, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 2 },
  plateBadge: { backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 12 },
  plateText: { fontSize: 13, fontWeight: '700', color: '#374151' },
  priceText: { fontSize: 18, fontWeight: '800', color: '#111827' },
  
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  timeText: { fontSize: 22, fontWeight: '800', color: '#111827' },
  seatsText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },
  
  routeContainer: { position: 'relative', marginBottom: 16, paddingLeft: 20 },
  routeLine: { position: 'absolute', left: 5, top: 10, bottom: 10, width: 2, backgroundColor: '#9CA3AF' },
  routeItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dotStart: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#111827', backgroundColor: '#D1D5DB', position: 'absolute', left: -20 },
  dotEnd: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#111827', position: 'absolute', left: -20 },
  routeText: { fontSize: 15, fontWeight: '500', color: '#111827', flex: 1 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4 },
  ratingText: { fontSize: 15, fontWeight: '800', color: '#374151' },
  detailsBtn: { backgroundColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16, borderWidth: 1, borderColor: '#D1D5DB' },
  detailsBtnText: { fontSize: 13, fontWeight: '700', color: '#374151' },

  // Empty State
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, elevation: 3 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 },
  input: { width: '100%', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', marginBottom: 12 },
  notifyBtn: { backgroundColor: '#E93F3F', width: '100%', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  notifyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  successBox: { backgroundColor: '#ECFDF5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, width: '100%', alignItems: 'center' },
  successText: { color: '#10B981', fontSize: 16, fontWeight: '700' },
});