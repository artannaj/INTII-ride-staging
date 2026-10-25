import { MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { distanceKm, formatDistance } from '@/lib/geo';
import type { RideMapProps } from './ride-map';

/**
 * react-native-maps has no web implementation. On web we show a plain summary
 * so the tracking screens still work in the browser during development.
 */
export function RideMap({ origin, destination, driver, style }: RideMapProps) {
  const toDestination = driver && destination ? formatDistance(distanceKm(driver, destination)) : null;

  return (
    <View style={[styles.box, style]}>
      <MapPin size={28} color={Colors.light.primary} />
      <Text style={styles.title}>Live map is available in the mobile app</Text>
      {driver ? (
        <Text style={styles.sub}>
          Driver at {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
          {toDestination ? ` · ${toDestination} from destination` : ''}
        </Text>
      ) : origin && destination ? (
        <Text style={styles.sub}>Route is {formatDistance(distanceKm(origin, destination))} straight-line</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: '#E5E7EB',
  },
  title: { fontSize: 15, fontWeight: '700', color: Colors.light.text, textAlign: 'center' },
  sub: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
});
