import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';

type ScreenHeaderProps = {
  title: string;
  showBack?: boolean;
  right?: ReactNode;
};

export function ScreenHeader({ title, showBack = false, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      {showBack ? (
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={8}>
          <ChevronLeft size={20} color="#FFFFFF" strokeWidth={2.5} />
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.light.primary,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  right: {
    width: 30,
    alignItems: 'flex-end',
  },
});