import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Star, ShieldCheck } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header'; // <-- Use the perfect header
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { getRideById, type Ride } from '@/lib/api';

export default function RideDetailsScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { token } = useAuth();
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !rideId) return;
    
    getRideById(token, Number(rideId))
      .then((data: Ride) => setRide(data))
      .catch((err: any) => Alert.alert('Error', 'Could not load ride details.'))
      .finally(() => setLoading(false));
  }, [token, rideId]);

  if (loading || !ride) {
    return (
      <View style={styles.root}>
        <AppHeader title="Ride Details" />
        <ActivityIndicator size="large" color={Colors.light.primary} style={{ flex: 1, marginTop: 40 }} />
      </View>
    );
  }

  const date = new Date(ride.departureTime);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <View style={styles.root}>
      <AppHeader title="Ride Details" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Driver Card */}
        <View style={styles.driverCard}>
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarText}>{ride.driverName?.charAt(0) || 'D'}</Text>
          </View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{ride.driverName || 'Driver'}</Text>
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

        {/* Ride Info Card */}
        <View style={styles.card}>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{timeString}</Text>
            <Text style={styles.dateText}>{dateString}</Text>
          </View>

          <View style={styles.routeContainer}>
            <View style={styles.routeLine} />
            <View style={styles.routeItem}>
              <View style={styles.dotStart} />
              <Text style={styles.routeText}>{ride.origin}</Text>
            </View>
            <View style={styles.routeItem}>
              <View style={styles.dotEnd} />
              <Text style={styles.routeText}>{ride.destination}</Text>
            </View>
          </View>

          <View style={styles.seatsRow}>
            <Text style={styles.seatsLabel}>{ride.seatsAvailable} Seat{ride.seatsAvailable > 1 && 's'} Available</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contribution:</Text>
            <Text style={styles.detailValue}>RM {ride.price.toFixed(2)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Method:</Text>
            <Text style={styles.detailValue}>Cash / Touch n Go</Text>
          </View>
        </View>

        {/* Ride Note */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ride Note</Text>
          <Text style={styles.noteText}>• {ride.note || 'No special notes provided.'}</Text>
        </View>

        {/* Vehicle */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle</Text>
          <View style={styles.vehicleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName}>{ride.vehicle?.split('·')[0] || 'Car'}</Text>
              <Text style={styles.vehicleDetail}>Color: {ride.vehicle?.split('·')[1] || 'Unknown'}</Text>
              <Text style={styles.vehicleDetail}>Plate: {ride.vehicle?.split('·')[2] || 'Unknown'}</Text>
              <Text style={styles.vehicleDetail}>1 Seat</Text>
            </View>
            <View style={styles.vehicleImagePlaceholder}>
              <Text style={{ fontSize: 40 }}>🚗</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={styles.confirmBtn} 
          onPress={() => router.push({ pathname: '/(app)/confirm-booking', params: { rideId: ride.id } })}
        >
          <Text style={styles.confirmBtnText}>Confirm Booking</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#D1D5DB' },
  scrollContent: { padding: 16, gap: 16 },
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
  seatsRow: { alignItems: 'flex-end', marginBottom: 16 },
  seatsLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 16 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  detailLabel: { fontSize: 14, fontWeight: '700', color: '#374151' },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 8 },
  noteText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center' },
  vehicleName: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 4 },
  vehicleDetail: { fontSize: 14, color: '#4B5563', marginBottom: 2 },
  vehicleImagePlaceholder: { width: 100, height: 60, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 16, backgroundColor: '#D1D5DB' },
  confirmBtn: { backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});