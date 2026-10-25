import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

type AppHeaderProps = {
  title: string;
  showBack?: boolean;
  right?: ReactNode;
};

/** Red header bar used across the ride, driver and chat screens. */
export function AppHeader({ title, showBack = true, right }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
      <View style={styles.side}>
        {showBack ? (
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconBtn}>
            <ChevronLeft size={26} color="#FFFFFF" strokeWidth={2.5} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: { width: 44 },
  sideRight: { alignItems: 'flex-end' },
  iconBtn: { width: 36, height: 36, justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', color: '#FFFFFF', fontSize: 18, fontWeight: '800' },
});
