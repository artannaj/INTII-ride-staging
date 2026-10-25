import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useCallback } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, ScrollView, Modal, TouchableOpacity, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Bell, MapPin, ArrowUpDown, Clock, Home, Gift, MessageSquare, Phone, Mail, Send, Users, X, Train, Building, Search, Briefcase, ChevronRight, CalendarClock
} from 'lucide-react-native';

import { BottomNav } from '@/components/bottom-nav';
import { Avatar } from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import { getMyBookings, listPlaces, type Booking, type Place } from '@/lib/api';

const AVAILABLE_LOCATIONS = [
  { name: 'INTI International University', sub: 'Campus · Nilai', icon: 'campus' },
  { name: 'Nilai AEON Mall', sub: 'Shopping mall · Nilai', icon: 'mall' },
  { name: 'Nilai Sentral (KTM)', sub: 'Train station · Nilai', icon: 'train' },
  { name: 'KL Sentral', sub: 'Transit hub · Kuala Lumpur', icon: 'train' },
  { name: 'KLCC Kiosk', sub: 'Landmark · Kuala Lumpur', icon: 'pin' },
  { name: 'Bukit Bintang', sub: 'Shopping district · Kuala Lumpur', icon: 'mall' },
  { name: 'Mid Valley Megamall', sub: 'Shopping mall · Kuala Lumpur', icon: 'mall' },
  { name: 'Sunway Pyramid', sub: 'Shopping mall · Subang Jaya', icon: 'mall' },
  { name: 'KLIA 2', sub: 'Airport · Sepang', icon: 'pin' },
  { name: 'Cyberjaya', sub: 'Town · Selangor', icon: 'building' },
];

const INITIAL_RECENT = ['Nilai AEON Mall', 'INTI International University', 'KL Sentral'];

export default function PassengerHomeScreen() {
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [pickup, setPickup] = useState(''); 
  const [destination, setDestination] = useState('');
  const [activeInput, setActiveInput] = useState<'pickup' | 'destination' | null>(null);
  
  const [recentSearches, setRecentSearches] = useState(INITIAL_RECENT);
  const [activeRide, setActiveRide] = useState<Booking | null>(null);
  const [isRideToday, setIsRideToday] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [shareModalVisible, setShareModalVisible] = useState(false);

  const displayName = user?.username || 'Wee';
  const shareMessage = 'Join me on INTI Ride — use code AIMAN5 for RM5 off your first ride! inti.ride/join/AIMAN5';

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      
      getMyBookings(token)
        .then((bookings: Booking[]) => {
          const current = bookings.find(b => b.status === 'CONFIRMED' || b.status === 'PENDING');
          
          if (current && current.departureTime) {
            setActiveRide(current);
            
            // Use the string split to check if it's today (bulletproof)
            const rawDate = current.departureTime.split('T')[0];
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayString = `${year}-${month}-${day}`;
            
            setIsRideToday(rawDate === todayString);
          } else {
            setActiveRide(null);
          }
        })
        .catch((err: any) => console.log('Error fetching active ride:', err));

      listPlaces(token)
        .then((places: Place[]) => setSavedPlaces(places))
        .catch((err: any) => console.log('Error fetching places:', err));
    }, [token])
  );

  const searchQuery = activeInput === 'pickup' ? pickup : destination;
  const filteredLocations = searchQuery.trim() 
    ? AVAILABLE_LOCATIONS.filter(loc => loc.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleSelectLocation = (locName: string) => {
    if (activeInput === 'pickup') setPickup(locName);
    if (activeInput === 'destination') setDestination(locName);
    setActiveInput(null);
  };

  const executeSearch = (pickupLoc: string, destLoc: string, timeStr: string = 'Now') => {
    if (!pickupLoc.trim() || !destLoc.trim()) {
      Alert.alert('Missing Details', 'Please enter both your pickup location and destination.');
      return; 
    }

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== destLoc);
      return [destLoc, ...filtered].slice(0, 5);
    });
    
    router.push({ 
      pathname: '/(app)/search', 
      params: { pickup: pickupLoc.trim(), destination: destLoc.trim(), time: timeStr } 
    });
  };

  const handleLetsRide = () => {
    executeSearch(pickup, destination);
  };

  const handleCopy = () => {
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
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

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerPill}>
          <Pressable onPress={() => router.push('/(app)/account')}>
            <Avatar name={displayName} size={44} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.name}>{displayName}</Text>
          </View>
          <Pressable style={styles.bellBtn} onPress={() => Alert.alert('Notifications', 'You have no new notifications right now.')}>
            <Bell size={24} color="#FFFFFF" strokeWidth={2} />
            <View style={styles.badge} />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.searchSection}>
          <View style={styles.inputWrapper}>
            <View style={styles.inputRow}>
              <View style={styles.pickupRing} />
              <TextInput
                value={pickup}
                onChangeText={setPickup}
                onFocus={() => setActiveInput('pickup')}
                placeholder="Pick up location"
                placeholderTextColor="#6B7280"
                style={styles.input}
              />
            </View>
          </View>
          
          <View style={styles.inputWrapper}>
            <View style={styles.inputRow}>
              <MapPin size={20} color={Colors.light.primary} strokeWidth={2.5} />
              <TextInput
                value={destination}
                onChangeText={setDestination}
                onFocus={() => setActiveInput('destination')}
                placeholder="Where to?"
                placeholderTextColor="#6B7280"
                style={styles.input}
                onSubmitEditing={handleLetsRide}
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

        <Pressable style={styles.rideBtn} onPress={handleLetsRide}>
          <Text style={styles.rideBtnText}>Let's Ride!</Text>
        </Pressable>

        <View style={styles.quickGrid}>
          {savedPlaces.length > 0 ? (
            savedPlaces.slice(0, 2).map((place, i) => (
              <Pressable 
                key={i} 
                style={styles.quickItem}
                onPress={() => {
                  setPickup('');
                  setDestination(place.address);
                  executeSearch('', place.address);
                }}
              >
                <View style={styles.quickIcon}>
                  {place.label.toLowerCase().includes('home') ? <Home size={20} color={Colors.light.text} /> : <MapPin size={20} color={Colors.light.text} />}
                </View>
                <Text style={styles.quickLabel} numberOfLines={1}>{place.label}</Text>
              </Pressable>
            ))
          ) : (
            <Pressable style={styles.quickItem} onPress={() => router.push('/(app)/places')}>
              <View style={styles.quickIcon}><Home size={20} color={Colors.light.text} /></View>
              <Text style={styles.quickLabel}>Add Home</Text>
            </Pressable>
          )}
          
          <Pressable style={styles.quickItem} onPress={() => router.push('/(app)/places')}>
            <View style={styles.quickIcon}><Briefcase size={20} color={Colors.light.text} /></View>
            <Text style={styles.quickLabel}>Saved</Text>
          </Pressable>
        </View>

        {/* Active Ride Widget */}
        {activeRide && (
          <Pressable 
            style={styles.activeRideCard}
            onPress={() => router.push({ pathname: '/(app)/booking-details', params: { bookingId: activeRide.id } })}
          >
            <View style={styles.activeRideHeader}>
              <Text style={styles.activeRideLabel}>
                {activeRide.status === 'PENDING' ? 'Waiting for driver approval' : 
                 !isRideToday ? 'Scheduled Ride' : 'Driver is arriving'}
              </Text>
              <Text style={styles.activeRideStatus}>{activeRide.status}</Text>
            </View>
            <View style={styles.activeRideBody}>
               <Avatar name={activeRide.driverName || 'Driver'} size={40} />
               <View style={{flex: 1, marginLeft: 12}}>
                 <Text style={styles.activeRideTitle}>{activeRide.driverName || 'Driver'}</Text>
                 <Text style={styles.activeRideSub}>
                   {!isRideToday 
                     ? new Date(activeRide.departureTime!).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                     : `${activeRide.seatsBooked} seat(s) · RM ${activeRide.totalPrice.toFixed(2)}`}
                 </Text>
               </View>
               
               {/* 🛠️ CHANGED: It now says "Scheduled" with a calendar icon instead of "View" */}
               {isRideToday && activeRide.status === 'CONFIRMED' ? (
                 <View style={styles.trackBtn}>
                   <Text style={styles.trackText}>Track</Text>
                 </View>
               ) : (
                 <View style={styles.scheduledBadge}>
                    <CalendarClock size={14} color="#9CA3AF" style={{marginRight: 6}} />
                    <Text style={styles.scheduledText}>Scheduled</Text>
                 </View>
               )}
            </View>
          </Pressable>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
        </View>
        <View style={styles.recentCard}>
          {recentSearches.slice(0, 3).map((loc, index) => (
            <Pressable 
              key={index} 
              style={[styles.recentRow, index !== Math.min(recentSearches.length, 3) - 1 && styles.recentDivider]}
              onPress={() => {
                setDestination(loc);
                executeSearch('', loc);
              }}
            >
              <View style={styles.recentIconWrap}><Clock size={16} color="#6B7280" /></View>
              <Text style={styles.recentTitle}>{loc}</Text>
              <ChevronRight size={16} color="#D1D5DB" />
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Explore Nearby</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
          {AVAILABLE_LOCATIONS.slice(0, 5).map((loc, index) => (
            <Pressable 
              key={index} 
              style={styles.nearbyCard}
              onPress={() => {
                setDestination(loc.name);
                executeSearch('', loc.name);
              }}
            >
              <View style={styles.nearbyIcon}>{getLocationIcon(loc.icon)}</View>
              <Text style={styles.nearbyTitle} numberOfLines={1}>{loc.name}</Text>
              <Text style={styles.nearbySub} numberOfLines={1}>{loc.sub}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable style={styles.referCard} onPress={() => setShareModalVisible(true)}>
          <Gift size={24} color={Colors.light.text} strokeWidth={2} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.referTitle}>Invite a friend, get RM5</Text>
            <Text style={styles.referSub}>Share code AIMAN5</Text>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </Pressable>
      </ScrollView>

      <BottomNav active="home" />

      {/* SEARCH OVERLAY MODAL */}
      <Modal visible={activeInput !== null} transparent animationType="fade">
        <View style={styles.searchOverlay}>
          <TouchableOpacity style={styles.searchDismiss} onPress={() => setActiveInput(null)} />
          <View style={styles.searchModalContent}>
            
            <View style={styles.searchModalHeader}>
              <Text style={styles.searchModalTitle}>Search Location</Text>
              <Pressable onPress={() => setActiveInput(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>

            <View style={styles.searchCardModal}>
              <View style={styles.inputWrapper}>
                <View style={styles.inputRow}>
                  <View style={styles.pickupRing} />
                  <TextInput value={pickup} onChangeText={setPickup} placeholder="Pick up location" placeholderTextColor="#6B7280" style={styles.input} autoFocus={activeInput === 'pickup'} />
                </View>
              </View>
              <View style={styles.inputWrapper}>
                <View style={styles.inputRow}>
                  <MapPin size={20} color={Colors.light.primary} strokeWidth={2.5} />
                  <TextInput value={destination} onChangeText={setDestination} placeholder="Where to?" placeholderTextColor="#6B7280" style={styles.input} autoFocus={activeInput === 'destination'} />
                </View>
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
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
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
  root: { flex: 1, backgroundColor: '#EFEFEF' }, 
  
  headerContainer: { paddingHorizontal: 20, paddingBottom: 10, backgroundColor: '#EFEFEF' },
  headerPill: { backgroundColor: Colors.light.primary, paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 24 },
  headerText: { flex: 1 },
  greeting: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600', marginBottom: 2 },
  name: { fontSize: 22, color: '#FFFFFF', fontWeight: '800' },
  bellBtn: { position: 'relative' },
  badge: { position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: Colors.light.primary },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 20, paddingBottom: 60 },
  
  searchSection: { position: 'relative', gap: 12 },
  inputWrapper: { backgroundColor: '#C4C4C4', borderRadius: 16, paddingHorizontal: 16 }, 
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: { flex: 1, fontSize: 16, color: '#000000', paddingVertical: 18, fontWeight: '600' },
  pickupRing: { width: 16, height: 16, borderRadius: 8, borderWidth: 4, borderColor: '#000000', backgroundColor: 'transparent', marginLeft: 1 },
  swapBtn: { position: 'absolute', right: 16, top: '50%', marginTop: -20, width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },

  rideBtn: { backgroundColor: Colors.light.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center', shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 4 },
  rideBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },

  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  quickItem: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  quickIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 13, fontWeight: '700', color: Colors.light.text },

  activeRideCard: { backgroundColor: '#1F2937', borderRadius: 24, padding: 16, gap: 12 },
  activeRideHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeRideLabel: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  activeRideStatus: { fontSize: 10, color: '#FACC15', fontWeight: '800', letterSpacing: 0.5 },
  activeRideBody: { flexDirection: 'row', alignItems: 'center' },
  activeRideTitle: { fontSize: 16, color: '#FFFFFF', fontWeight: '800' },
  activeRideSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  trackBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  trackText: { color: '#1F2937', fontWeight: '800', fontSize: 13 },
  scheduledBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#374151', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  scheduledText: { color: '#9CA3AF', fontWeight: '800', fontSize: 12 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Colors.light.text },
  
  recentCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  recentRow: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 14 },
  recentDivider: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  recentIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  recentTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.light.text },

  nearbyCard: { width: 140, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, gap: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  nearbyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  nearbyTitle: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  nearbySub: { fontSize: 12, color: '#9CA3AF' },

  referCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  referTitle: { fontSize: 15, fontWeight: '800', color: Colors.light.text },
  referSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  searchOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  searchDismiss: { height: 100 },
  searchModalContent: { backgroundColor: '#EFEFEF', flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  searchModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  searchModalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  cancelBtn: { padding: 8 },
  cancelText: { fontSize: 16, fontWeight: '700', color: '#EF4444' },
  searchCardModal: { position: 'relative', marginBottom: 16, gap: 12 },
  swapBtnModal: { position: 'absolute', right: 16, top: '50%', marginTop: -20, width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  dropdownList: { backgroundColor: '#FFFFFF', borderRadius: 24, overflow: 'hidden', maxHeight: 400 },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownTextWrap: { flex: 1 },
  dropdownTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  dropdownSub: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  dropdownHeader: { fontSize: 11, fontWeight: '800', color: '#9CA3AF', marginTop: 16, marginBottom: 8, marginLeft: 16, letterSpacing: 0.5 },
  emptyState: { padding: 32, alignItems: 'center', justifyContent: 'center' },
  emptyText: { marginTop: 12, color: Colors.light.text, fontSize: 15, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: Colors.light.text },
  modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  linkBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 16, padding: 16, marginBottom: 24, backgroundColor: '#F9FAFB' },
  linkText: { fontSize: 14, fontWeight: '500', color: Colors.light.text },
  copyText: { fontSize: 14, fontWeight: '700', color: Colors.light.primary },
  shareList: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, overflow: 'hidden' },
  shareRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  shareRowBorder: { borderBottomWidth: 1, borderColor: '#E5E7EB' },
  shareRowLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.light.text },
  shareRowChevron: { fontSize: 20, color: '#D1D5DB' },
});