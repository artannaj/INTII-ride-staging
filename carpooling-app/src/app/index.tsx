import { useEffect } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampusScene, LogoTile } from '@/components/illustrations';
import { useAuth } from '@/context/auth';

const BG = '#DADADA';

export default function SplashScreenRoute() {
  const { token, user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = height < 720;
  // Natural height of the artwork, capped so the logo and title always fit
  // (any shortfall crops the empty sky at the top of the drawing)
  const brandSpace = compact ? 230 : 280;
  const sceneHeight = Math.min(width * (509 / 456), height - brandSpace);

  const goNext = () => {
    if (token && user) {
      router.replace('/(app)');
    } else {
      router.replace('/login');
    }
  };

  useEffect(() => {
    // Wait 1.5 seconds, then route automatically
    const timer = setTimeout(() => {
      if (!isLoading) goNext();
    }, 1500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, token, user]);

  return (
    <Pressable style={styles.root} onPress={() => !isLoading && goNext()}>
      <StatusBar style="dark" />

      <View style={[styles.brand, { paddingTop: insets.top + 24 }]}>
        <LogoTile size={compact ? 84 : 104} />
        <Text style={[styles.title, compact && styles.titleCompact]}>INTI Ride</Text>
        <Text style={styles.tagline}>Share Rides. A Greener Campus</Text>
      </View>

      <CampusScene style={{ height: sceneHeight }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    justifyContent: 'space-between',
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
    color: '#1F1F1F',
    marginTop: 18,
  },
  titleCompact: {
    fontSize: 34,
    marginTop: 12,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F1F1F',
  },
});
