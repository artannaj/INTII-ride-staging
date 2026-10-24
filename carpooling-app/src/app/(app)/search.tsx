import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Star, ChevronLeft, SlidersHorizontal } from 'lucide-react-native';

import { BottomNav } from '@/components/bottom-nav';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError, searchRides, type Ride } from '@/lib/api';

export default function SearchResultsScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ pickup?: string; destination?: string }>();
  
  const pickup = params.pickup || 'Current location';
  const destination = params.destination || 'INTI International University';

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate current week dates
  const getWeekDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push({
        day: d.getDate().toString(),
        label: d.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: i === 0
      });
    }
    return days;
  };
  const weekDays = getWeekDays();
  const [selectedDate, setSelectedDate] = useState(0);

  useEffect(() => {
    let isMounted = true; 
    
    if (!token) return;
    
    setLoading(true);
    searchRides(token, pickup, destination)
      .then((data) => {
        if (isMounted) setRides(data); 
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof ApiError ? err.message : 'Could not load rides.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token, pickup, destination]);

  const handleNotify = () => {
    alert('Ride alert on · we will notify you when a ride matches');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      
      {/* Red Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <ChevronLeft size={26} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
        <Text style={styles.headerTitle}>Search Result</Text>
        <Pressable style={styles.iconBtn}>
          <SlidersHorizontal size={22} color="#FFFFFF" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Route Summary Card */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.pickupRing} />
            <Text style={styles.routeText}>{pickup}</Text>
            <Text style={styles.routeDate}>Today</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <MapPin size={18} color={Colors.light.primary} strokeWidth={2.5} />
            <Text style={styles.routeText}>{destination}</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Date Selector */}
        <View style={styles.dateRow}>
          {weekDays.map((d, index) => (
            <Pressable 
              key={index} 
              style={[styles.datePill, selectedDate === index && styles.datePillActive]}
              onPress={() => setSelectedDate(index)}
            >
              <Text style={[styles.dateDay, selectedDate === index && styles.dateDayActive]}>{d.day}</Text>
              <Text style={[styles.dateLabel, selectedDate === index && styles.dateLabelActive]}>{d.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{rides.length} rides available</Text>
          <Text style={styles.sortText}>Sort: Earliest ▾</Text>
        </View>

        {/* Empty State / Ride Cards */}
        {rides.length === 0 && !loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No rides on this route yet</Text>
            <Text style={styles.emptySub}>Try different filters, or get notified when a driver posts one.</Text>
            <Pressable style={styles.notifyBtn} onPress={handleNotify}>
              <Text style={styles.notifyText}>Notify me</Text>
            </Pressable>
          </View>
        ) : (
          rides.map((ride) => (
            <Pressable 
              key={ride.id} 
              style={styles.rideCard}
              onPress={() => router.push({ pathname: '/(app)/ride-details', params: { rideId: ride.id } })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.driverName}>Driver #{ride.driverId}</Text>
                <View style={styles.matricBadge}>
                  <Text style={styles.matricText}>I250{ride.driverId}678</Text>
                </View>
                <Text style={styles.price}>RM {ride.price.toFixed(2)}</Text>
              </View>

              <Text style={styles.time}>
                {new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>

              <View style={styles.cardRoute}>
                <View style={styles.smallRing} />
                <Text style={styles.cardRouteText}>{ride.origin}</Text>
              </View>
              <View style={styles.cardRoute}>
                <MapPin size={14} color={Colors.light.primary} strokeWidth={2.5} />
                <Text style={styles.cardRouteText}>{ride.destination}</Text>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.ratingRow}>
                  <Star size={14} color="#FACC15" fill="#FACC15" />
                  <Text style={styles.ratingText}>5.0</Text>
                  <Text style={styles.seatsText}>· {ride.seatsAvailable} seats</Text>
                </View>
                <View style={styles.detailsBtn}>
                  <Text style={styles.detailsText}>View Details</Text>
                </View>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>

      <BottomNav active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E0E0E0' },
  header: { backgroundColor: Colors.light.primary, paddingHorizontal: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '800' },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 40 },

  routeCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 8 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeText: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.light.text },
  routeDate: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  routeLine: { height: 16, width: 1, backgroundColor: '#D1D5DB', marginLeft: 6 },
  pickupRing: { width: 16, height: 16, borderRadius: 8, borderWidth: 4, borderColor: '#000000', backgroundColor: 'transparent', marginLeft: 1 },
  smallRing: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: Colors.light.text, backgroundColor: 'transparent', marginLeft: 1 },

  dateRow: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  datePill: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  datePillActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  dateDay: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  dateDayActive: { color: '#FFFFFF' },
  dateLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  dateLabelActive: { color: 'rgba(255,255,255,0.8)' },

  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  resultsCount: { fontSize: 14, fontWeight: '800', color: Colors.light.text },
  sortText: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary },
  
  emptyState: { alignItems: 'center', marginTop: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  emptySub: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 12 },
  notifyBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  notifyText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  rideCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  driverName: { flex: 1, fontSize: 14, fontWeight: '800', color: Colors.light.text },
  matricBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 },
  matricText: { fontSize: 10, fontWeight: '700', color: Colors.light.textSecondary },
  price: { fontSize: 14, fontWeight: '800', color: Colors.light.text },
  time: { fontSize: 24, fontWeight: '800', color: '#2A2A2A', marginVertical: 4 },
  cardRoute: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  cardRouteText: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, fontWeight: '700', color: Colors.light.text },
  seatsText: { fontSize: 12, color: Colors.light.textSecondary },
  detailsBtn: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  detailsText: { fontSize: 11, fontWeight: '700', color: Colors.light.text },
});