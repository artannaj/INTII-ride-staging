import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ScrollView, Modal, TouchableOpacity, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, MapPin, ArrowUpDown, Clock, Home, Gift, MessageSquare, Phone, Mail, Send, Users, X, Train, Building, Search } from 'lucide-react-native';

import { BottomNav } from '@/components/bottom-nav';
import { Avatar } from '@/components';
import { filterPlaces } from '@/constants/places';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { usePolling } from '@/hooks/use-polling';
import { getMyBookings, getUpcomingRides, type Booking, type Ride } from '@/lib/api';
import { formatDay, formatTime } from '@/lib/status';

const INITIAL_RECENT = ['Nilai AEON Mall', 'INTI International University', 'KL Sentral'];
const SAVED_PLACES = [
  { label: 'INTI International University', type: 'Campus' },
  { label: 'Home', type: 'Set location' }
];

const TIME_SLOTS = ['Anytime', '6–9 AM', '9 AM–12', '12–5 PM', '5–8 PM'];

/** The booking worth surfacing on Home: a live trip first, else the next confirmed/pending one. */
function pickActiveBooking(bookings: Booking[]): Booking | null {
  const live = bookings.find((b) => b.status === 'CONFIRMED' && b.rideStatus === 'IN_PROGRESS');
  if (live) return live;
  const soon = bookings
    .filter((b) => (b.status === 'CONFIRMED' || b.status === 'PENDING') && b.departureTime)
    .filter((b) => b.rideStatus === 'ACTIVE' || b.rideStatus === 'FULL')
    .sort((a, b) => a.departureTime!.localeCompare(b.departureTime!));
  return soon[0] ?? null;
}

export default function PassengerHomeScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  
  const [activeInput, setActiveInput] = useState<'pickup' | 'destination' | null>(null);
  const [recentSearches, setRecentSearches] = useState(INITIAL_RECENT);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  
  const [activeChip, setActiveChip] = useState('Today');
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);

  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [suggestedRides, setSuggestedRides] = useState<Ride[]>([]);

  usePolling(async () => {
    if (!token || user?.role === 'DRIVER') return;
    const [bookings, upcoming] = await Promise.all([
      getMyBookings(token).catch(() => [] as Booking[]),
      getUpcomingRides(token).catch(() => [] as Ride[]),
    ]);
    setActiveBooking(pickActiveBooking(bookings));
    setSuggestedRides(upcoming.slice(0, 3));
  }, 20000);

  const displayName = user?.username || 'Wee';
  const shareMessage = 'Join me on INTI Ride — use code AIMAN5 for RM5 off your first ride! inti.ride/join/AIMAN5';

  const searchQuery = activeInput === 'pickup' ? pickup : destination;
  const filteredLocations = filterPlaces(searchQuery);

  const handleSelectLocation = (locName: string) => {
    if (activeInput === 'pickup') setPickup(locName);
    if (activeInput === 'destination') setDestination(locName);
    setActiveInput(null);
  };

  const handleLetsRide = () => {
    if (!pickup.trim() || !destination.trim()) {
      Alert.alert('Missing Details', 'Please enter both your pickup location and destination.');
      return; 
    }

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== destination);
      return [destination, ...filtered].slice(0, 5);
    });
    
    router.push({ 
      pathname: '/(app)/search', 
      params: { 
        pickup: pickup.trim(), 
        destination: destination.trim(),
        time: scheduledTime || 'Now'
      } 
    });
  };

  const handleCopy = () => {
    console.log('Copied: inti.ride/join/AIMAN5');
    setShareModalVisible(false);
  };

  const openLink = async (url: string, appName: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(`${appName} not installed`, `It looks like ${appName} is not installed on your device.`);
      }
    } catch (err) {
      console.warn(err);
    }
    setShareModalVisible(false);
  };

  const shareViaMessages = () => openLink(`sms:?body=${encodeURIComponent(shareMessage)}`, 'Messages');
  const shareViaWhatsApp = () => openLink(`whatsapp://send?text=${encodeURIComponent(shareMessage)}`, 'WhatsApp');
  const shareViaEmail = () => openLink(`mailto:?subject=Join me on INTI Ride&body=${encodeURIComponent(shareMessage)}`, 'Email');
  const shareViaTelegram = () => openLink(`tg://msg?text=${encodeURIComponent(shareMessage)}`, 'Telegram');

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'train': return <Train size={20} color="#9CA3AF" />;
      case 'mall': return <Building size={20} color="#9CA3AF" />;
      case 'campus': return <Home size={20} color="#9CA3AF" />;
      default: return <MapPin size={20} color="#9CA3AF" />;
    }
  };

  if (user?.role === 'DRIVER') {
    return <Redirect href="/(app)/driver" />;
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Avatar name={displayName} size={40} />
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.name}>{displayName}</Text>
        </View>
        <Pressable style={styles.bellBtn}>
          <Bell size={24} color="#FFFFFF" strokeWidth={2} />
          <View style={styles.badge} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>Where to?</Text>

        <View style={styles.searchCard}>
          <View style={styles.inputsWrapper}>
            <View style={styles.inputRow}>
              <View style={styles.pickupRing} />
              <TextInput
                value={pickup}
                onChangeText={setPickup}
                onFocus={() => setActiveInput('pickup')}
                placeholder="Enter pickup location"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.inputRow}>
              <MapPin size={18} color={Colors.light.primary} strokeWidth={2.5} />
              <TextInput
                value={destination}
                onChangeText={setDestination}
                onFocus={() => setActiveInput('destination')}
                placeholder="Enter destination"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>
          </View>

          <Pressable 
            style={styles.swapBtn} 
            onPress={() => {
              const temp = pickup;
              setPickup(destination);
              setDestination(temp);
            }}
          >
            <ArrowUpDown size={18} color={Colors.light.text} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
          <Pressable onPress={() => setActiveChip('Today')} style={[styles.chip, activeChip === 'Today' && styles.chipActive]}>
            <Text style={[styles.chipText, activeChip === 'Today' && styles.chipTextActive]}>Today</Text>
          </Pressable>
          <Pressable onPress={() => setActiveChip('Tomorrow')} style={[styles.chip, activeChip === 'Tomorrow' && styles.chipActive]}>
            <Text style={[styles.chipText, activeChip === 'Tomorrow' && styles.chipTextActive]}>Tomorrow</Text>
          </Pressable>
          <Pressable onPress={() => setActiveChip('Women only')} style={[styles.chip, activeChip === 'Women only' && styles.chipActive]}>
            <Text style={[styles.chipText, activeChip === 'Women only' && styles.chipTextActive]}>Women only</Text>
          </Pressable>
          <Pressable onPress={() => setScheduleModalVisible(true)} style={[styles.chip, scheduledTime && styles.chipActive]}>
            <Text style={[styles.chipText, scheduledTime && styles.chipTextActive]}>
              {scheduledTime ? scheduledTime : 'Schedule...'}
            </Text>
          </Pressable>
        </ScrollView>

        <Pressable style={styles.rideBtn} onPress={handleLetsRide}>
          <Text style={styles.rideBtnText}>Let's Ride!</Text>
        </Pressable>

        <View style={styles.savedRow}>
          <View style={styles.savedChip}>
            <MapPin size={16} color={Colors.light.text} strokeWidth={2} />
            <Text style={styles.savedText}>Campus</Text>
          </View>
          <View style={styles.savedChip}>
            <Home size={16} color={Colors.light.text} strokeWidth={2} />
            <Text style={styles.savedText}>Home · Set</Text>
          </View>
        </View>

        <Text style={styles.subTitle}>RECENT</Text>
        
        <View style={styles.recentCard}>
          {recentSearches.slice(0, 3).map((loc, index) => (
            <View key={index}>
              <RecentRow icon={<Clock size={18} color="#9CA3AF" />} title={loc} subtitle="Tap to use as pickup" onPress={() => setPickup(loc)} />
              {index < 2 && <View style={styles.recentDivider} />}
            </View>
          ))}
        </View>

        {activeBooking ? <ActiveRideCard booking={activeBooking} /> : null}

        {suggestedRides.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Rides leaving soon</Text>
            {suggestedRides.map((ride) => <RideCard key={ride.id} ride={ride} />)}
          </>
        ) : null}

        <View style={styles.referCard}>
          <Gift size={24} color={Colors.light.text} strokeWidth={2} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.referTitle}>Invite a friend, get RM5</Text>
            <Text style={styles.referSub}>Code AIMAN5 · 3 friends joined</Text>
          </View>
          <Pressable style={styles.shareBtn} onPress={() => setShareModalVisible(true)}>
            <Text style={styles.shareText}>Share</Text>
          </Pressable>
        </View>

      </ScrollView>

      <BottomNav active="home" />

      <Modal visible={activeInput !== null} transparent animationType="fade">
        <View style={styles.searchOverlay}>
          <TouchableOpacity style={styles.searchDismiss} onPress={() => setActiveInput(null)} />
          <View style={styles.searchModalContent}>
            <View style={styles.searchCardModal}>
              <View style={styles.inputRowModal}>
                <View style={styles.pickupRing} />
                <TextInput value={pickup} onChangeText={setPickup} placeholder="Enter pickup location" placeholderTextColor="#9CA3AF" style={styles.inputModal} autoFocus={activeInput === 'pickup'} />
              </View>
              <View style={styles.dividerModal} />
              <View style={styles.inputRowModal}>
                <MapPin size={18} color={Colors.light.primary} strokeWidth={2.5} />
                <TextInput value={destination} onChangeText={setDestination} placeholder="Enter destination" placeholderTextColor="#9CA3AF" style={styles.inputModal} autoFocus={activeInput === 'destination'} />
              </View>
              <Pressable style={styles.swapBtnModal} onPress={() => { const temp = pickup; setPickup(destination); setDestination(temp); }}>
                <ArrowUpDown size={18} color={Colors.light.text} strokeWidth={2} />
              </Pressable>
            </View>

            <ScrollView style={styles.dropdownList} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {searchQuery.trim().length > 0 ? (
                filteredLocations.length > 0 ? (
                  filteredLocations.map((loc, index) => (
                    <Pressable key={index} style={styles.dropdownRow} onPress={() => handleSelectLocation(loc.name)}>
                      {getLocationIcon(loc.icon)}
                      <View style={styles.dropdownTextWrap}>
                        <Text style={styles.dropdownTitle}>{loc.name}</Text>
                        <Text style={styles.dropdownSub}>{loc.sub}</Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Search size={32} color="#D1D5DB" />
                    <Text style={styles.emptyText}>No places found for "{searchQuery}"</Text>
                    <Text style={styles.emptySubText}>Try searching for a different location.</Text>
                  </View>
                )
              ) : (
                <>
                  <Text style={styles.dropdownHeader}>RECENT</Text>
                  {recentSearches.map((loc, index) => (
                    <Pressable key={index} style={styles.dropdownRow} onPress={() => handleSelectLocation(loc)}>
                      <Clock size={20} color="#9CA3AF" />
                      <View style={styles.dropdownTextWrap}>
                        <Text style={styles.dropdownTitle}>{loc}</Text>
                        <Text style={styles.dropdownSub}>Recent search</Text>
                      </View>
                    </Pressable>
                  ))}

                  <Text style={styles.dropdownHeader}>SAVED PLACES</Text>
                  {SAVED_PLACES.map((place, index) => (
                    <Pressable key={index} style={styles.dropdownRow} onPress={() => handleSelectLocation(place.label)}>
                      {place.type === 'Campus' ? <Home size={20} color="#9CA3AF" /> : <MapPin size={20} color="#9CA3AF" />}
                      <View style={styles.dropdownTextWrap}>
                        <Text style={styles.dropdownTitle}>{place.label}</Text>
                        <Text style={styles.dropdownSub}>{place.type}</Text>
                      </View>
                    </Pressable>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={scheduleModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setScheduleModalVisible(false)}>
          <View style={[styles.modalSheet, { paddingBottom: 40 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Schedule a ride</Text>
              <Pressable onPress={() => setScheduleModalVisible(false)}>
                <X size={24} color="#9CA3AF" />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>Choose a departure window for today.</Text>
            <View style={styles.timeGrid}>
              {TIME_SLOTS.map((time) => (
                <Pressable key={time} onPress={() => { setScheduledTime(time === 'Anytime' ? null : time); setScheduleModalVisible(false); }} style={[styles.timePill, scheduledTime === time && styles.timePillActive]}>
                  <Text style={[styles.timeText, scheduledTime === time && styles.timeTextActive]}>{time}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={shareModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setShareModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Invite friends</Text>
              <Pressable onPress={() => setShareModalVisible(false)}>
                <X size={24} color="#9CA3AF" />
              </Pressable>
            </View>
            <Text style={styles.modalSub}>Join me on INTI Ride — use code AIMAN5 for RM5 off.</Text>
            <View style={styles.linkBox}>
              <Text style={styles.linkText}>inti.ride/join/AIMAN5</Text>
              <Pressable onPress={handleCopy}>
                <Text style={styles.copyText}>Copy</Text>
              </Pressable>
            </View>
            <View style={styles.shareList}>
              <ShareRow Icon={MessageSquare} label="Messages" onPress={shareViaMessages} />
              <ShareRow Icon={Phone} label="WhatsApp" onPress={shareViaWhatsApp} />
              <ShareRow Icon={Mail} label="Email" onPress={shareViaEmail} />
              <ShareRow Icon={Send} label="Telegram" onPress={shareViaTelegram} />
              <ShareRow Icon={Users} label="Emergency contacts" onPress={shareViaMessages} last />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RecentRow({ icon, title, subtitle, onPress }: { icon: any, title: string, subtitle: string, onPress: () => void }) {
  return (
    <Pressable style={styles.recentRow} onPress={onPress}>
      <View style={styles.recentIconWrap}>{icon}</View>
      <View style={styles.recentTextWrap}>
        <Text style={styles.recentTitle}>{title}</Text>
        <Text style={styles.recentSubtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function ActiveRideCard({ booking }: { booking: Booking }) {
  const live = booking.status === 'CONFIRMED' && booking.rideStatus === 'IN_PROGRESS';
  const name = booking.driverName ?? 'Your driver';
  return (
    <View style={styles.activeRideCard}>
      <Avatar name={name} size={44} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.activeRideLabel}>Your ride · {name}</Text>
        <Text style={styles.activeRideTitle} numberOfLines={1}>
          {live ? (
            <Text style={{ color: '#EF4444' }}>On the way</Text>
          ) : (
            `${formatDay(booking.departureTime)}, ${formatTime(booking.departureTime)}`
          )}
        </Text>
        <Text style={styles.activeRideSub} numberOfLines={1}>
          {booking.status === 'PENDING' ? 'Waiting for driver approval' : booking.vehicle ?? `To ${booking.destination}`}
        </Text>
      </View>
      <Pressable
        style={styles.trackBtn}
        onPress={() =>
          live
            ? router.push({ pathname: '/(app)/tracking', params: { rideId: booking.rideId, bookingId: booking.id } })
            : router.push({ pathname: '/(app)/booking-details', params: { bookingId: booking.id } })
        }>
        <Text style={styles.trackText}>{live ? 'Track' : 'View'}</Text>
      </Pressable>
    </View>
  );
}

function RideCard({ ride }: { ride: Ride }) {
  return (
    <View style={styles.grayCard}>
      <View style={styles.rideHeader}>
        <Text style={styles.rideName}>{ride.driverName ?? 'INTI driver'}</Text>
        <View style={styles.idBadge}><Text style={styles.idText}>RM {ride.price.toFixed(2)}</Text></View>
      </View>
      <Text style={styles.rideTime}>{formatTime(ride.departureTime)}</Text>
      <View style={styles.routeRow}>
        <View style={styles.smallRing} />
        <Text style={styles.routeText}>{ride.origin}</Text>
      </View>
      <View style={styles.routeLine} />
      <View style={styles.routeRow}>
        <MapPin size={12} color={Colors.light.primary} strokeWidth={2.5} />
        <Text style={styles.routeText}>{ride.destination}</Text>
      </View>
      <View style={styles.rideFooter}>
        <Text style={styles.ratingText}>{formatDay(ride.departureTime)} · {ride.seatsAvailable} seats available</Text>
        <Pressable style={styles.viewDetailsBtn} onPress={() => router.push({ pathname: '/(app)/ride-details', params: { rideId: ride.id } })}>
          <Text style={styles.viewDetailsText}>View Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ShareRow({ Icon, label, onPress, last = false }: { Icon: any, label: string, onPress: () => void, last?: boolean }) {
  return (
    <Pressable style={[styles.shareRow, !last && styles.shareRowBorder]} onPress={onPress}>
      <Icon size={20} color={Colors.light.text} strokeWidth={2} />
      <Text style={styles.shareRowLabel}>{label}</Text>
      <Text style={styles.shareRowChevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#E0E0E0' },
  header: { backgroundColor: Colors.light.primary, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerText: { flex: 1 },
  greeting: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
  name: { fontSize: 18, color: '#FFFFFF', fontWeight: '800' },
  bellBtn: { position: 'relative' },
  badge: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light.primary, borderWidth: 1, borderColor: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  
  searchCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, position: 'relative' },
  inputsWrapper: { paddingRight: 45 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, fontSize: 14, color: Colors.light.text, paddingVertical: 8 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginLeft: 30 },
  
  pickupRing: { width: 16, height: 16, borderRadius: 8, borderWidth: 4, borderColor: '#000000', backgroundColor: 'transparent', marginLeft: 1 },
  smallRing: { width: 12, height: 12, borderRadius: 6, borderWidth: 3, borderColor: Colors.light.text, backgroundColor: 'transparent', marginLeft: 1 },

  swapBtn: { position: 'absolute', right: 16, top: '50%', marginTop: -12, width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },

  chipsScroll: { gap: 10, paddingVertical: 4 },
  chip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#1F2937', borderColor: '#1F2937' },
  chipText: { fontSize: 14, fontWeight: '700', color: Colors.light.textSecondary },
  chipTextActive: { color: '#FFFFFF' },

  rideBtn: { backgroundColor: Colors.light.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  rideBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },

  savedRow: { flexDirection: 'row', gap: 10 },
  savedChip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  savedText: { fontSize: 13, fontWeight: '600', color: Colors.light.text },

  subTitle: { fontSize: 12, fontWeight: '800', color: '#9CA3AF', marginTop: 4, letterSpacing: 0.5 },
  
  recentCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 0, overflow: 'hidden' },
  recentRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  recentIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  recentTextWrap: { flex: 1 },
  recentTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  recentSubtitle: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  recentDivider: { height: 1, backgroundColor: '#F3F4F6', marginLeft: 62 },

  activeRideCard: { backgroundColor: '#1F2937', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
  activeRideLabel: { fontSize: 11, color: '#9CA3AF' },
  activeRideTitle: { fontSize: 18, color: '#FFFFFF', fontWeight: '800', marginVertical: 2 },
  activeRideSub: { fontSize: 12, color: '#9CA3AF' },
  trackBtn: { backgroundColor: Colors.light.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  trackText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  grayCard: { backgroundColor: '#D1D5DB', borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: '#BFC5CD' },
  rideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rideName: { fontSize: 14, fontWeight: '800', color: Colors.light.text },
  idBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  idText: { fontSize: 10, fontWeight: '700', color: Colors.light.textSecondary },
  rideTime: { fontSize: 24, fontWeight: '800', color: '#2A2A2A', marginVertical: 4 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  routeText: { fontSize: 13, fontWeight: '600', color: Colors.light.text },
  routeLine: { height: 16, width: 1, backgroundColor: '#9CA3AF', marginLeft: 6 },
  rideFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  ratingText: { fontSize: 12, fontWeight: '600', color: Colors.light.text },
  viewDetailsBtn: { backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewDetailsText: { fontSize: 11, fontWeight: '700', color: Colors.light.text },

  referCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center' },
  referTitle: { fontSize: 14, fontWeight: '800', color: Colors.light.text },
  referSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  shareBtn: { borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  shareText: { color: Colors.light.primary, fontWeight: '700', fontSize: 13 },

  searchOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  searchDismiss: { height: 120 },
  searchModalContent: { backgroundColor: '#E0E0E0', flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  searchCardModal: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, position: 'relative', marginBottom: 16 },
  inputRowModal: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inputModal: { flex: 1, fontSize: 14, color: Colors.light.text, paddingVertical: 8 },
  dividerModal: { height: 1, backgroundColor: '#E5E7EB', marginLeft: 30 },
  swapBtnModal: { position: 'absolute', right: 16, top: '50%', marginTop: -18, width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  dropdownList: { backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', maxHeight: 400 },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownTextWrap: { flex: 1 },
  dropdownTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  dropdownSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  dropdownHeader: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', marginTop: 16, marginBottom: 8, marginLeft: 16, letterSpacing: 0.5 },
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 12, color: Colors.light.text, fontSize: 15, fontWeight: '600' },
  emptySubText: { marginTop: 4, color: '#9CA3AF', fontSize: 13 },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  timePill: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  timePillActive: { backgroundColor: Colors.light.primary, borderColor: Colors.light.primary },
  timeText: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  timeTextActive: { color: '#FFFFFF' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.light.text },
  modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  linkBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 16, marginBottom: 24 },
  linkText: { fontSize: 14, fontWeight: '500', color: Colors.light.text },
  copyText: { fontSize: 14, fontWeight: '700', color: Colors.light.primary },
  shareList: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, overflow: 'hidden' },
  shareRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  shareRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  shareRowLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.light.text },
  shareRowChevron: { fontSize: 20, color: '#D1D5DB' },
});