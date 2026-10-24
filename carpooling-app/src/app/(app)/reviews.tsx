import { StatusBar } from 'expo-status-bar';
import { Star } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenScroll, SectionGroup } from '@/components';
import { ScreenHeader } from '@/components/screen-header';
import { Colors } from '@/constants/theme';

type Review = {
  name: string;
  stars: number;
  text: string;
};

const RECEIVED: Review[] = [
  { name: 'Max Verstappen', stars: 5, text: 'Friendly and always on time.' },
  { name: 'Siti Lim', stars: 5, text: 'Polite passenger, easy pickup.' },
];

const GIVEN: Review[] = [
  { name: 'Max Verstappen', stars: 5, text: 'Take the way he drives, 5 stars!' },
  { name: 'Daniel Kumar', stars: 3, text: 'Ok ride but a bit late.' },
];

type Tab = 'Received' | 'Given';

export default function ReviewsScreen() {
  const [tab, setTab] = useState<Tab>('Received');
  const list = tab === 'Received' ? RECEIVED : GIVEN;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScreenHeader title="My reviews" showBack />

      <ScreenScroll>
        {/* Segmented tabs */}
        <View style={styles.segment}>
          {(['Received', 'Given'] as Tab[]).map((t) => {
            const on = tab === t;
            return (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                style={[styles.segmentBtn, on && styles.segmentBtnOn]}>
                <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Review list */}
        {list.length > 0 ? (
          <SectionGroup title="">
            {list.map((r, i) => (
              <View
                key={`${r.name}-${i}`}
                style={[styles.row, i < list.length - 1 && styles.divider]}>
                <View style={styles.rowHead}>
                  <Text style={styles.name}>{r.name}</Text>
                  <Stars count={r.stars} />
                </View>
                <Text style={styles.text}>{r.text}</Text>
              </View>
            ))}
          </SectionGroup>
        ) : (
          <Text style={styles.empty}>No reviews yet.</Text>
        )}

        <Text style={styles.hint}>
          {tab === 'Received'
            ? 'Ratings you received from drivers and passengers.'
            : 'Ratings you gave to drivers and passengers.'}
        </Text>
      </ScreenScroll>
    </SafeAreaView>
  );
}

function Stars({ count }: { count: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          color={i <= count ? '#FACC15' : '#D1D5DB'}
          fill={i <= count ? '#FACC15' : 'transparent'}
          strokeWidth={1.5}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },

  segment: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    padding: 3,
    borderRadius: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentBtnOn: {
    backgroundColor: Colors.light.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  segmentTextOn: {
    color: Colors.light.text,
  },

  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  text: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 17,
  },

  empty: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  hint: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    paddingHorizontal: 4,
    textAlign: 'center',
  },
});