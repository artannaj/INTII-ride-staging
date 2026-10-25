import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Star, ShieldCheck, ChevronDown, Check } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header'; // <-- Use the perfect header
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { getRideById, createBooking, type Ride } from '@/lib/api';

export default function ConfirmBookingScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const { token, user } = useAuth();
  
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [isToday, setIsToday] = useState(false);
  const [selectedWindow, setSelectedWindow] = useState('On time');
  const [showWindowModal, setShowWindowModal] = useState(false);

  useEffect(() => {
    if (!token || !rideId) return;
    getRideById(token, Number(rideId))
      .then((data: Ride) => {
        setRide(data);
        const rideDate = new Date(data.departureTime);
        const today = new Date();
        setIsToday(rideDate.toDateString() === today.toDateString());
      })
      .catch((err: any) => Alert.alert('Error', 'Could not load ride details.'))
      .finally(() => setLoading(false));
  }, [token, rideId]);

  const handleRequestSeat = async () => {
    if (!token || !ride) return;
    try {
      await createBooking(token, { rideId: ride.id, seatsBooked: 1 }); 
      
      Alert.alert(
        'Request Sent!', 
        'Your seat request has been sent to the driver. You will be able to track them once they approve your booking.', 
        [{ text: 'OK', onPress: () => router.replace('/(app)') }]
      );
      
    } catch (error: any) {
      Alert.alert('Booking Failed', error.message || 'Could not book this ride.');
    }
  };

  if (loading || !ride) {
    return (
      <View style={styles.root}>
        <AppHeader title="Confirm Booking" />
        <ActivityIndicator size="large" color={Colors.light.primary} style={{ flex: 1, marginTop: 40 }} />
      </View>
    );
  }

  const date = new Date(ride.departureTime);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });
  const passengerName = user?.username || 'Passenger';

  const TIME_WINDOWS = ['15 mins before', '10 mins before', '5 mins before', 'On time'];

  return (
    <View style={styles.root}>
      <AppHeader title="Confirm Booking" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Driver Card */}
        <View style={styles.card}>
          <View style={styles.driverRow}>
            <View>
              <Text style={styles.label}>Driver:</Text>
              <Text style={styles.driverName}>{ride.driverName}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Verified Driver</Text>
              </View>
              <View style={styles.ratingBadge}>
                <Star size={16} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>5.0</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Booking Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Booking Summary</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ride:</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailValue}>{ride.origin}</Text>
              <Text style={styles.detailValue}>→ {ride.destination}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{dateString}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Departure:</Text>
            <Text style={styles.detailValue}>{timeString}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passenger:</Text>
            <Text style={styles.detailValue}>{passengerName} (1 Seat)</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Contribution:</Text>
            <Text style={styles.detailValue}>RM {ride.price.toFixed(2)}</Text>
          </View>
        </View>

        {/* Schedule Window - ONLY SHOWS IF TODAY */}
        {isToday && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Departure Window</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
              When should the driver expect you?
            </Text>
            <Pressable style={styles.dropdownBtn} onPress={() => setShowWindowModal(true)}>
              <Text style={styles.dropdownText}>{selectedWindow}</Text>
              <ChevronDown size={20} color="#374151" />
            </Pressable>
          </View>
        )}

        {/* Ride Note */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ride Note</Text>
          <Text style={styles.noteText}>• {ride.note || 'No special notes provided.'}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.requestBtn} onPress={handleRequestSeat}>
          <Text style={styles.requestBtnText}>Request Seat</Text>
        </Pressable>
      </View>

      <Modal visible={showWindowModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowWindowModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Window</Text>
            {TIME_WINDOWS.map((win) => (
              <Pressable 
                key={win} 
                style={styles.windowOption}
                onPress={() => { setSelectedWindow(win); setShowWindowModal(false); }}
              >
                <Text style={styles.windowText}>{win}</Text>
                {selectedWindow === win && <Check size={20} color="#10B981" />}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#D1D5DB' },
  scrollContent: { padding: 16, gap: 16 },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16 },
  driverRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 16, fontWeight: '800', color: '#111827' },
  driverName: { fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  verifiedText: { fontSize: 12, fontWeight: '700', color: '#10B981' },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 16, fontWeight: '800', color: '#374151' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },
  detailRow: { flexDirection: 'row', marginBottom: 12 },
  detailLabel: { width: 100, fontSize: 14, fontWeight: '800', color: '#111827' },
  detailValue: { flex: 1, fontSize: 14, fontWeight: '500', color: '#4B5563' },
  dropdownBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  dropdownText: { fontSize: 16, fontWeight: '600', color: '#111827' },
  noteText: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  footer: { padding: 16, backgroundColor: '#D1D5DB' },
  requestBtn: { backgroundColor: '#EF4444', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  requestBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalSheet: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16, textAlign: 'center' },
  windowOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  windowText: { fontSize: 16, fontWeight: '600', color: '#374151' },
});