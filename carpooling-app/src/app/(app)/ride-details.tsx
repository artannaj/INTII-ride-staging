import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Circle, MapPin, Star, Car, ShieldCheck } from 'lucide-react-native';

import { Avatar, Badge, Card } from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError, searchRides, type Ride } from '@/lib/api';

export default function RideDetailsScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{ rideId?: string }>();
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !params.rideId) return;
    // For simplicity, we are just searching all rides and finding the one we clicked.
    // In a real app, you'd have a GET /api/rides/{id} endpoint.
    searchRides(token, 'INTI International University', 'Nilai AEON Mall')
      .then((rides) => {
        const found = rides.find((r) => r.id === Number(params.rideId));
        if (found) setRide(found);
        else setError('Ride not found');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load ride.'));
  }, [token, params.rideId]);

  if (!ride) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>{error || 'Loading...'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <StatusBar style="light" />
      
      {/* Red Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
          <Text style={styles.headerTitle}>Ride Details</Text>
          <View style={styles.backBtn} />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Driver Card */}
        <Card style={styles.driverCard}>
          <Avatar name="Max Verstappen" size={50} />
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>Max Verstappen</Text>
            <Badge label="‚úĒ Verified Driver" variant="success" />
          </View>
          <View style={styles.ratingWrap}>
            <Star size={14} color="#FACC15" fill="#FACC15" />
            <Text style={styles.ratingNum}>5.0</Text>
          </View>
        </Card>

        {/* Ride Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.timeText}>
              {new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.dateText}>
              {new Date(ride.departureTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>

          <View style={styles.routeRow}>
            <Circle size={12} color={Colors.light.text} strokeWidth={3} />
            <Text style={styles.routeText}>{ride.origin}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <MapPin size={14} color={Colors.light.primary} strokeWidth={2.5} />
            <Text style={styles.routeText}>{ride.destination}</Text>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Contribution</Text>
            <Text style={styles.priceValue}>RM {ride.price.toFixed(2)}</Text>
          </View>
        </Card>

        {/* Preferences Card */}
        <Card style={styles.prefCard}>
          <Text style={styles.cardTitle}>Ride preferences</Text>
          <View style={styles.chips}>
            {['Quiet ride', 'AC on', 'Soft music', 'No smoking'].map((pref) => (
              <View key={pref} style={styles.chip}>
                <Text style={styles.chipText}>{pref}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Note Card */}
        {ride.note ? (
          <Card style={styles.noteCard}>
            <Text style={styles.cardTitle}>Ride Note</Text>
            <Text style={styles.noteText}>‚ÄĘ {ride.note}</Text>
          </Card>
        ) : null}

        {/* Vehicle Card */}
        <Card style={styles.vehicleCard}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.cardTitle}>Vehicle</Text>
            <Text style={styles.vehicleText}>Aston Martin Valkyrie</Text>
            <Text style={styles.vehicleText}>Color: Green</Text>
            <Text style={styles.vehicleText}>Plate: MY6767</Text>
            <Text style={styles.vehicleText}>{ride.seatsAvailable} Seat</Text>
          </View>
          <View style={styles.vehicleIconWrap}>
            <Car size={40} color="#9CA3AF" />
          </View>
        </Card>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.cta}>
        <Pressable 
          style={styles.confirmBtn}
          onPress={() => router.push({ pathname: '/(app)/confirm-booking', params: { rideId: ride.id } })}
        >
          <Text style={styles.confirmText}>Confirm Booking</Text>
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4, width: 32 },
  headerTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '800' },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 100 },

  driverCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  driverInfo: { flex: 1, gap: 4 },
  driverName: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingNum: { fontSize: 14, fontWeight: '800', color: Colors.light.text },

  infoCard: { padding: 16, gap: 12 },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { fontSize: 24, fontWeight: '800', color: Colors.light.text },
  dateText: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeText: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  routeLine: { height: 20, width: 1, backgroundColor: '#D1D5DB', marginLeft: 6 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  priceLabel: { fontSize: 14, color: '#6B7280' },
  priceValue: { fontSize: 16, fontWeight: '800', color: Colors.light.primary },

  prefCard: { padding: 16, gap: 12 },
  cardTitle: { fontSize: 14, fontWeight: '800', color: Colors.light.text, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary },

  noteCard: { padding: 16 },
  noteText: { fontSize: 13, color: Colors.light.textSecondary, lineHeight: 20 },

  vehicleCard: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  vehicleInfo: { flex: 1, gap: 4 },
  vehicleText: { fontSize: 12, color: Colors.light.textSecondary },
  vehicleIconWrap: { width: 100, height: 80, backgroundColor: '#F3F4F6', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  confirmBtn: { backgroundColor: Colors.light.primary, paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});