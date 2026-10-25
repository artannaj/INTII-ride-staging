import { Car } from 'lucide-react-native';
import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

import { Colors } from '@/constants/theme';
import type { LatLng } from '@/lib/geo';

export type RideMapProps = {
  origin?: LatLng | null;
  destination?: LatLng | null;
  /** Live driver position; drawn as a car marker. */
  driver?: LatLng | null;
  /** Keep the camera centred on the driver as they move. */
  follow?: boolean;
  /** Show the phone's own blue dot (used on the driver's trip screen). */
  showsUserLocation?: boolean;
  style?: StyleProp<ViewStyle>;
};

// Default view: INTI Nilai campus
const FALLBACK_REGION = {
  latitude: 2.8126,
  longitude: 101.7586,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const EDGE_PADDING = { top: 60, right: 50, bottom: 60, left: 50 };

export function RideMap({ origin, destination, driver, follow = false, showsUserLocation = false, style }: RideMapProps) {
  const mapRef = useRef<MapView>(null);
  const hasFitted = useRef(false);

  const points = useMemo(
    () => [origin, destination, driver].filter((p): p is LatLng => !!p),
    [origin, destination, driver]
  );

  // Frame the whole route once, as soon as there is something to show
  useEffect(() => {
    if (hasFitted.current || points.length === 0) return;
    hasFitted.current = true;
    const id = setTimeout(() => {
      if (points.length === 1) {
        mapRef.current?.animateToRegion({ ...points[0], latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400);
      } else {
        mapRef.current?.fitToCoordinates(points, { edgePadding: EDGE_PADDING, animated: true });
      }
    }, 300);
    return () => clearTimeout(id);
  }, [points]);

  useEffect(() => {
    if (follow && driver) {
      mapRef.current?.animateCamera({ center: driver }, { duration: 600 });
    }
  }, [follow, driver]);

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      initialRegion={points[0] ? { ...points[0], latitudeDelta: 0.05, longitudeDelta: 0.05 } : FALLBACK_REGION}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      toolbarEnabled={false}>
      {origin ? <Marker coordinate={origin} title="Pickup" pinColor="#1F2937" /> : null}
      {destination ? <Marker coordinate={destination} title="Destination" pinColor={Colors.light.primary} /> : null}
      {origin && destination ? (
        <Polyline
          coordinates={[origin, destination]}
          strokeColor="#9CA3AF"
          strokeWidth={3}
          lineDashPattern={[8, 6]}
        />
      ) : null}
      {driver ? (
        <Marker coordinate={driver} title="Driver" anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.carMarker}>
            <Car size={18} color="#FFFFFF" strokeWidth={2.5} />
          </View>
        </Marker>
      ) : null}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  carMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.light.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
