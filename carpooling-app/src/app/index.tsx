import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { Colors } from '@/constants/theme';

export default function SplashScreenRoute() {
  const insets = useSafeAreaInsets();

  return (
    <Pressable style={styles.root} onPress={() => router.replace('/login')}>
      <StatusBar style="dark" />

      <View style={[styles.content, { paddingTop: insets.top + 80 }]}>
        <BrandMark />
        <Text style={styles.title}>INTI Ride</Text>
        <Text style={styles.subtitle}>Share Rides. A Greener Campus</Text>
      </View>

      <View style={styles.illustration}>
        <SplashIllustration />
      </View>
    </Pressable>
  );
}

function SplashIllustration() {
  return (
    <View style={styles.scene}>
      <View style={styles.sky} />

      {/* Distant buildings */}
      <View style={[styles.building, { left: 26, top: 40, width: 70, height: 58, backgroundColor: '#B8302A' }]} />
      <View style={[styles.building, { left: 110, top: 58, width: 46, height: 46, backgroundColor: '#A8286C' }]} />

      {/* Trees */}
      <View style={[styles.treeTrunk, { left: 302, top: 40 }]} />
      <View style={[styles.treeTop, { left: 288, top: 18, backgroundColor: '#E58A4B' }]} />
      <View style={[styles.treeTrunk, { left: 346, top: 58 }]} />
      <View style={[styles.treeTop, { left: 334, top: 36, backgroundColor: '#C2410C' }]} />

      {/* Hills */}
      <View style={styles.hillBack} />
      <View style={styles.hillFront} />
      <View style={styles.roadCurve} />

      {/* Car */}
      <View style={styles.car}>
        <View style={styles.carTop} />
        <View style={styles.carBody} />
        <View style={[styles.carWheel, { left: 4 }]} />
        <View style={[styles.carWheel, { right: 4 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  title: {
    fontSize: 42,
    lineHeight: 44,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: Colors.light.text,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  illustration: {
    flex: 1,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  scene: {
    width: '100%',
    aspectRatio: 390 / 420,
    position: 'relative',
  },
  sky: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.background,
  },
  building: {
    position: 'absolute',
    borderRadius: 4,
  },
  treeTrunk: {
    position: 'absolute',
    width: 6,
    height: 40,
    backgroundColor: '#7F1D1D',
  },
  treeTop: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  hillBack: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: 0,
    height: '55%',
    backgroundColor: '#D0342B',
    borderTopLeftRadius: 300,
    borderTopRightRadius: 200,
  },
  hillFront: {
    position: 'absolute',
    left: -20,
    right: -20,
    bottom: 0,
    height: '38%',
    backgroundColor: '#E9483E',
    borderTopLeftRadius: 400,
    borderTopRightRadius: 200,
  },
  roadCurve: {
    position: 'absolute',
    left: '15%',
    right: '-10%',
    bottom: '12%',
    height: '14%',
    backgroundColor: '#FFFFFF',
    borderRadius: 200,
    transform: [{ rotate: '-6deg' }],
    opacity: 0.9,
  },
  car: {
    position: 'absolute',
    right: '18%',
    bottom: '14%',
    width: 72,
    height: 26,
  },
  carBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  carTop: {
    position: 'absolute',
    left: 12,
    right: 18,
    bottom: 12,
    height: 10,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  carWheel: {
    position: 'absolute',
    bottom: -4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1F2937',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
});