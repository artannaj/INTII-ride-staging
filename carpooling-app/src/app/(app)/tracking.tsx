import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, MessageCircle, MapPin, Clock } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { getBooking, type Booking } from '@/lib/api';

const { width, height } = Dimensions.get('window');

// Default coordinates for INTI and Nilai AEON if the database is missing them
const INTI_LAT = 2.8138;
const INTI_LNG = 101.7830;

export default function TrackingScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !bookingId) return;
    
    getBooking(token, Number(bookingId))
      .then((data: Booking) => setBooking(data))
      .catch((err: any) => Alert.alert('Error', 'Could not load tracking info.'))
      .finally(() => setLoading(false));
  }, [token, bookingId]);

  if (loading || !booking) {
    return (
      <View style={styles.root}>
        <ActivityIndicator size="large" color={Colors.light.primary} style={{ flex: 1, marginTop: 100 }} />
      </View>
    );
  }

  const isPending = booking.status === 'PENDING';

  // Hardcoded coordinates for the demo (since your database doesn't have them yet)
  const driverLocation = { latitude: INTI_LAT + 0.005, longitude: INTI_LNG + 0.005 }; // Simulating driver moving
  const pickupLocation = { latitude: INTI_LAT, longitude: INTI_LNG };

  return (
    <View style={styles.root}>
      
      {/* REAL MAP */}
      <MapView 
        style={styles.map} 
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: INTI_LAT,
          longitude: INTI_LNG,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {/* Driver Pin */}
        {!isPending && (
          <Marker coordinate={driverLocation}>
            <View style={styles.carMarker}>
              <Text style={{ fontSize: 24 }}>🚗</Text>
            </View>
          </Marker>
        )}

        {/* Pickup Pin */}
        <Marker coordinate={pickupLocation}>
          <View style={styles.pickupMarker}>
             <View style={styles.pickupDot} />
          </View>
        </Marker>
      </MapView>

      {/* FLOATING BACK BUTTON */}
      <Pressable 
        style={[styles.floatingBackBtn, { top: insets.top + 10 }]} 
        onPress={() => router.back()}
      >
        <ArrowLeft size={24} color="#111827" />
      </Pressable>

      {/* FLOATING BOTTOM CARD */}
      <View style={[styles.bottomCard, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.dragHandle} />
        
        {isPending ? (
          <View style={styles.statusRow}>
            <View style={[styles.pulseDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={[styles.statusText, { color: '#F59E0B' }]}>Pending Driver Approval</Text>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>Arriving in 4 mins</Text>
          </View>
        )}

        <View style={styles.driverCard}>
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarText}>{booking.driverName?.charAt(0) || 'D'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{booking.driverName || 'Driver'}</Text>
            <Text style={styles.vehicleText}>{booking.vehicle || 'Car details unavailable'}</Text>
          </View>
          <View style={styles.actionRow}>
            <Pressable style={styles.iconBtn} onPress={() => Alert.alert('Chat', 'Chat feature coming soon.')}>
              <MessageCircle size={20} color="#374151" />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => Alert.alert('Call', 'Calling driver...')}>
              <Phone size={20} color="#374151" />
            </Pressable>
          </View>
        </View>

        <View style={styles.routeInfo}>
          <View style={styles.routeRow}>
            <View style={styles.ring} />
            <Text style={styles.routeText} numberOfLines={1}>{booking.origin}</Text>
          </View>
          <View style={styles.routeRow}>
            <MapPin size={14} color="#E93F3F" strokeWidth={2.5} />
            <Text style={styles.routeText} numberOfLines={1}>{booking.destination}</Text>
          </View>
        </View>

        <Pressable 
          style={[styles.mainBtn, isPending && { backgroundColor: '#9CA3AF' }]} 
          onPress={() => {
            if (isPending) Alert.alert('Info', 'Waiting for the driver to accept.');
            else router.back();
          }}
        >
          <Text style={styles.mainBtnText}>{isPending ? 'Pending...' : 'Close Map'}</Text>
        </Pressable>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E5E7EB' },
  
  map: { width: width, height: height, position: 'absolute', top: 0, left: 0 },
  
  carMarker: { backgroundColor: '#FFF', padding: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 4 },
  pickupMarker: { backgroundColor: '#FFF', padding: 4, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 4 },
  pickupDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981' },

  floatingBackBtn: {
    position: 'absolute',
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    elevation: 5,
    zIndex: 10,
  },

  bottomCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    elevation: 10,
  },
  dragHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10B981' },
  statusText: { fontSize: 15, fontWeight: '800', color: '#10B981' },
  
  driverCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  avatarPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#9CA3AF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800', color: '#FFF' },
  driverName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  vehicleText: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, elevation: 2 },

  routeInfo: { gap: 12, marginBottom: 24 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ring: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: '#111827', marginLeft: 1 },
  routeText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111827' },

  mainBtn: { backgroundColor: '#E93F3F', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  mainBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});