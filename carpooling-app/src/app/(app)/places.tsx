import { StatusBar } from 'expo-status-bar';
import { Home, MapPin, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { AppHeader } from '@/components/app-header'; // <-- Use the perfect header
import { Button, ScreenScroll, SectionGroup } from '@/components';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';
import {
    ApiError,
    createPlace,
    deletePlace,
    listPlaces,
    updatePlace,
    type Place,
} from '@/lib/api';

const LOCATIONS = [
  'INTI International University',
  'Main Gate',
  'Library Bus Stop',
  'Nilai AEON Mall',
  'Nilai Sentral',
  'Giant Nilai',
  'Bandar Baru Nilai',
  'KL Sentral',
  'KLCC Kiosk',
  'Mid Valley Megamall',
  'KLIA 2',
  'Sepang Circuit',
  'Cyberjaya',
];

export default function SavedPlacesScreen() {
  const { token } = useAuth();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPlaces(token);
      setPlaces(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load places.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function openAdd() {
    setEditing(null);
    setLabel('');
    setAddress('');
    setModalVisible(true);
  }

  function openEdit(p: Place) {
    setEditing(p);
    setLabel(p.label);
    setAddress(p.address);
    setModalVisible(true);
  }

  async function onSave() {
    if (!token) return;
    if (!label.trim() || !address.trim()) {
      setError('Enter a label and address.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await updatePlace(token, editing.id, {
          label: label.trim(),
          address: address.trim(),
        });
      } else {
        await createPlace(token, {
          label: label.trim(),
          address: address.trim(),
          icon: 'pin',
        });
      }
      setModalVisible(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save place.');
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!token || !editing) return;
    try {
      await deletePlace(token, editing.id);
      setModalVisible(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete place.');
    }
  }

  return (
    <View style={styles.safe}>
      <StatusBar style="light" />
      <AppHeader title="Saved places" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScreenScroll>
          {places.length === 0 && !loading ? (
            <View style={styles.empty}>
              <MapPin size={32} color="#9CA3AF" strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No saved places yet</Text>
              <Text style={styles.emptySub}>
                Add your home, campus or favourite stops.
              </Text>
            </View>
          ) : (
            <SectionGroup title="">
              {places.map((p, i) => (
                <Pressable
                  key={p.id}
                  onPress={() => openEdit(p)}
                  style={({ pressed }) => [
                    styles.row,
                    i < places.length - 1 && styles.rowDivider,
                    pressed && styles.rowPressed,
                  ]}>
                  <View style={styles.iconWrap}>
                    <Home size={18} color={Colors.light.textSecondary} strokeWidth={2} />
                  </View>
                  <View style={styles.middle}>
                    <Text style={styles.rowTitle}>{p.label}</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {p.address}
                    </Text>
                  </View>
                  <Text style={styles.chev}>›</Text>
                </Pressable>
              ))}
            </SectionGroup>
          )}

          <Pressable onPress={openAdd} style={styles.addRow}>
            <View style={styles.addIconWrap}>
              <Plus size={18} color={Colors.light.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.addText}>Add a place</Text>
          </Pressable>

          <Text style={styles.hint}>
            Saved places appear first when you search for a ride.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScreenScroll>
      </KeyboardAvoidingView>

      {/* Add / Edit modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              {editing ? `Edit ${editing.label}` : 'Add a place'}
            </Text>

            <View>
              <Text style={styles.label}>Label</Text>
              <TextInput
                value={label}
                onChangeText={setLabel}
                placeholder="Home, Campus, Gym..."
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
            </View>

            <View>
              <Text style={styles.label}>Address</Text>
              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Search for a place"
                placeholderTextColor="#9CA3AF"
                style={styles.input}
              />
              <View style={styles.suggestions}>
                {LOCATIONS.slice(0, 5).map((loc) => (
                  <Pressable
                    key={loc}
                    onPress={() => setAddress(loc)}
                    style={styles.suggestion}>
                    <MapPin size={14} color="#9CA3AF" strokeWidth={2} />
                    <Text style={styles.suggestionText}>{loc}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Button label="Save place" onPress={onSave} loading={saving} />

            {editing ? (
              <Pressable onPress={onDelete} style={styles.deleteRow}>
                <Text style={styles.deleteText}>Remove this place</Text>
              </Pressable>
            ) : null}

            <Pressable onPress={() => setModalVisible(false)} style={styles.cancelRow}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  flex: { flex: 1 },

  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowPressed: {
    backgroundColor: '#F9FAFB',
  },
  iconWrap: {
    width: 22,
    alignItems: 'center',
  },
  middle: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  rowSub: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  chev: {
    fontSize: 20,
    color: '#D1D5DB',
    fontWeight: '300',
  },

  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  addIconWrap: {
    width: 22,
    alignItems: 'center',
  },
  addText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.primary,
  },

  hint: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    paddingHorizontal: 4,
  },
  error: {
    fontSize: 12,
    color: Colors.light.primary,
    textAlign: 'center',
  },

  // modal
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalSheet: {
    backgroundColor: Colors.light.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 32,
    gap: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: Colors.light.text,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: Colors.light.text,
  },
  suggestions: {
    marginTop: 8,
    gap: 4,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  deleteRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  cancelRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
});