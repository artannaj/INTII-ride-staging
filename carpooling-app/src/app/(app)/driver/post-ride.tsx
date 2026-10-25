import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowUpDown, MapPin, Minus, Plus, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { BottomNav } from '@/components/bottom-nav';
import { Button } from '@/components';
import { KNOWN_PLACES, filterPlaces, type KnownPlace } from '@/constants/places';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { ApiError, createRide } from '@/lib/api';
import { distanceKm, formatDistance } from '@/lib/geo';

const DAY_COUNT = 7;
const QUICK_TIMES = ['07:30', '08:00', '12:00', '15:00', '17:30', '19:00'];
const MAX_SEATS = 6;

/** Suggested contribution: RM 2 base + RM 0.40/km, rounded to 50 sen. */
function suggestPrice(km: number) {
  return Math.max(2, Math.round((2 + km * 0.4) * 2) / 2);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/** Local date-time without offset, matching the backend's LocalDateTime. */
function toLocalIso(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

export default function PostRideScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();

  const [origin, setOrigin] = useState<KnownPlace | null>(KNOWN_PLACES[0]);
  const [destination, setDestination] = useState<KnownPlace | null>(null);
  const [picking, setPicking] = useState<'origin' | 'destination' | null>(null);

  const [dayOffset, setDayOffset] = useState(0);
  const [time, setTime] = useState('08:00');
  const [seats, setSeats] = useState(3);
  const [price, setPrice] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => {
    return Array.from({ length: DAY_COUNT }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        offset: i,
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString([], { weekday: 'short' }),
        day: d.getDate(),
      };
    });
  }, []);

  const km = origin && destination
    ? distanceKm({ latitude: origin.lat, longitude: origin.lng }, { latitude: destination.lat, longitude: destination.lng })
    : null;
  const suggested = km != null ? suggestPrice(km) : 3;
  const effectivePrice = price ?? suggested;

  function buildDeparture(): Date | null {
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
    if (!match) return null;
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    d.setHours(Number(match[1]), Number(match[2]), 0, 0);
    return d;
  }

  async function onSubmit() {
    if (!token) return;
    setError(null);
    if (!origin || !destination) {
      setError('Choose both pickup and destination.');
      return;
    }
    if (origin.name === destination.name) {
      setError('Pickup and destination must be different.');
      return;
    }
    const departure = buildDeparture();
    if (!departure) {
      setError('Enter the time as HH:MM, e.g. 08:30.');
      return;
    }
    if (departure.getTime() < Date.now()) {
      setError('That time has already passed. Pick a later time or another day.');
      return;
    }

    setSaving(true);
    try {
      const ride = await createRide(token, {
        origin: origin.name,
        destination: destination.name,
        originLat: origin.lat,
        originLng: origin.lng,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        departureTime: toLocalIso(departure),
        price: effectivePrice,
        seatsAvailable: seats,
        note: note.trim() || undefined,
      });
      router.replace({ pathname: '/(app)/driver/ride', params: { rideId: String(ride.id) } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post the ride.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AppHeader title="Post a ride" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Route */}
          <View style={styles.card}>
            <Pressable style={styles.placeRow} onPress={() => setPicking('origin')}>
              <View style={styles.ring} />
              <Text style={[styles.placeText, !origin && styles.placeholder]} numberOfLines={1}>
                {origin?.name ?? 'Choose pickup'}
              </Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.placeRow} onPress={() => setPicking('destination')}>
              <MapPin size={18} color={Colors.light.primary} strokeWidth={2.5} />
              <Text style={[styles.placeText, !destination && styles.placeholder]} numberOfLines={1}>
                {destination?.name ?? 'Choose destination'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.swapBtn}
              onPress={() => {
                setOrigin(destination);
                setDestination(origin);
              }}>
              <ArrowUpDown size={18} color={Colors.light.text} />
            </Pressable>
          </View>
          {km != null ? <Text style={styles.hint}>About {formatDistance(km * 1.3)} by road</Text> : null}

          {/* When */}
          <Text style={styles.label}>Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {days.map((d) => (
              <Pressable
                key={d.offset}
                onPress={() => setDayOffset(d.offset)}
                style={[styles.dayPill, dayOffset === d.offset && styles.pillActive]}>
                <Text style={[styles.dayNum, dayOffset === d.offset && styles.pillTextActive]}>{d.day}</Text>
                <Text style={[styles.dayLabel, dayOffset === d.offset && styles.pillTextActive]}>{d.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.label}>Departure time</Text>
          <View style={styles.timeRow}>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="08:00"
              placeholderTextColor="#9CA3AF"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
              style={styles.timeInput}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {QUICK_TIMES.map((t) => (
                <Pressable key={t} onPress={() => setTime(t)} style={[styles.chip, time === t && styles.pillActive]}>
                  <Text style={[styles.chipText, time === t && styles.pillTextActive]}>{t}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Seats + price */}
          <View style={styles.row2}>
            <View style={[styles.card, styles.half]}>
              <Text style={styles.label}>Seats</Text>
              <Stepper
                value={String(seats)}
                onMinus={() => setSeats((s) => Math.max(1, s - 1))}
                onPlus={() => setSeats((s) => Math.min(MAX_SEATS, s + 1))}
              />
            </View>
            <View style={[styles.card, styles.half]}>
              <Text style={styles.label}>Per seat</Text>
              <Stepper
                value={`RM ${effectivePrice.toFixed(2)}`}
                onMinus={() => setPrice(Math.max(0, effectivePrice - 0.5))}
                onPlus={() => setPrice(effectivePrice + 0.5)}
              />
            </View>
          </View>
          <Text style={styles.hint}>
            Suggested RM {suggested.toFixed(2)} to share fuel and toll costs.
            {price != null && price !== suggested ? ' ' : ''}
            {price != null && price !== suggested ? (
              <Text style={styles.link} onPress={() => setPrice(null)}>Use suggested</Text>
            ) : null}
          </Text>

          <Text style={styles.label}>Note for passengers (optional)</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="e.g. Meeting at Block C drop-off, small boot space"
            placeholderTextColor="#9CA3AF"
            style={styles.noteInput}
            multiline
            maxLength={255}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="Post ride" onPress={onSubmit} loading={saving} />
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNav active="post" />

      <PlacePicker
        visible={picking !== null}
        title={picking === 'origin' ? 'Pickup' : 'Destination'}
        bottomInset={insets.bottom}
        onClose={() => setPicking(null)}
        onPick={(place) => {
          if (picking === 'origin') setOrigin(place);
          else setDestination(place);
          setPrice(null);
          setPicking(null);
        }}
      />
    </View>
  );
}

function Stepper({ value, onMinus, onPlus }: { value: string; onMinus: () => void; onPlus: () => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={onMinus} hitSlop={6}>
        <Minus size={16} color={Colors.light.text} />
      </Pressable>
      <Text style={styles.stepValue}>{value}</Text>
      <Pressable style={styles.stepBtn} onPress={onPlus} hitSlop={6}>
        <Plus size={16} color={Colors.light.text} />
      </Pressable>
    </View>
  );
}

function PlacePicker({
  visible,
  title,
  bottomInset,
  onClose,
  onPick,
}: {
  visible: boolean;
  title: string;
  bottomInset: number;
  onClose: () => void;
  onPick: (place: KnownPlace) => void;
}) {
  const [query, setQuery] = useState('');
  const results = query.trim() ? filterPlaces(query) : KNOWN_PLACES;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { paddingBottom: bottomInset + 12 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={24} color="#9CA3AF" />
            </Pressable>
          </View>
          <View style={styles.searchBox}>
            <Search size={18} color="#9CA3AF" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search places"
              placeholderTextColor="#9CA3AF"
              style={styles.searchInput}
              autoFocus
            />
          </View>
          <FlatList
            data={results}
            keyExtractor={(p) => p.name}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.hint}>No places match "{query}".</Text>}
            renderItem={({ item }) => (
              <Pressable
                style={styles.resultRow}
                onPress={() => {
                  setQuery('');
                  onPick(item);
                }}>
                <MapPin size={18} color="#9CA3AF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultTitle}>{item.name}</Text>
                  <Text style={styles.resultSub}>{item.sub}</Text>
                </View>
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E0E0E0' },
  content: { padding: 20, gap: 10, paddingBottom: 40 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingRight: 48 },
  placeText: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.light.text },
  placeholder: { color: '#9CA3AF', fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginLeft: 30 },
  ring: { width: 16, height: 16, borderRadius: 8, borderWidth: 4, borderColor: '#000000', marginLeft: 1 },
  swapBtn: { position: 'absolute', right: 16, top: '50%', marginTop: -2, width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12, color: '#6B7280', marginLeft: 4 },
  link: { color: Colors.light.primary, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '800', color: '#6B7280', letterSpacing: 0.3, marginTop: 6 },
  chips: { gap: 8, paddingVertical: 2 },
  dayPill: { width: 62, paddingVertical: 10, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  dayNum: { fontSize: 18, fontWeight: '800', color: Colors.light.text },
  dayLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  pillActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  pillTextActive: { color: '#FFFFFF' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  timeInput: { width: 84, backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 12, textAlign: 'center', fontSize: 18, fontWeight: '800', color: Colors.light.text },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  chipText: { fontSize: 13, fontWeight: '700', color: Colors.light.text },
  row2: { flexDirection: 'row', gap: 10, marginTop: 6 },
  half: { flex: 1, gap: 8, paddingVertical: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  noteInput: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, minHeight: 70, fontSize: 14, color: Colors.light.text, textAlignVertical: 'top' },
  error: { color: Colors.light.danger, fontSize: 13, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: '80%', gap: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: Colors.light.text },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  resultTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  resultSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
