export type PlaceIcon = 'campus' | 'mall' | 'train' | 'building' | 'pin';

export type KnownPlace = {
  name: string;
  sub: string;
  icon: PlaceIcon;
  lat: number;
  lng: number;
};

/**
 * Pickup / drop-off points riders can choose from. Coordinates are approximate
 * (good to ~100 m) and are what rides store so the map and ETA can work.
 */
export const KNOWN_PLACES: KnownPlace[] = [
  { name: 'INTI International University', sub: 'Campus · Nilai', icon: 'campus', lat: 2.8126, lng: 101.7586 },
  { name: 'Nilai AEON Mall', sub: 'Shopping mall · Nilai', icon: 'mall', lat: 2.8183, lng: 101.7962 },
  { name: 'Nilai Sentral (KTM)', sub: 'Train station · Nilai', icon: 'train', lat: 2.8027, lng: 101.7993 },
  { name: 'Giant Nilai', sub: 'Hypermarket · Nilai', icon: 'mall', lat: 2.8167, lng: 101.7983 },
  { name: 'Bandar Baru Nilai', sub: 'Town centre · Nilai', icon: 'pin', lat: 2.8161, lng: 101.8020 },
  { name: 'KL Sentral', sub: 'Transit hub · Kuala Lumpur', icon: 'train', lat: 3.1340, lng: 101.6865 },
  { name: 'KLCC Kiosk', sub: 'Landmark · Kuala Lumpur', icon: 'pin', lat: 3.1579, lng: 101.7116 },
  { name: 'Bukit Bintang', sub: 'Shopping district · Kuala Lumpur', icon: 'mall', lat: 3.1466, lng: 101.7108 },
  { name: 'Pavilion Kuala Lumpur', sub: 'Shopping mall · Kuala Lumpur', icon: 'mall', lat: 3.1490, lng: 101.7134 },
  { name: 'Mid Valley Megamall', sub: 'Shopping mall · Kuala Lumpur', icon: 'mall', lat: 3.1182, lng: 101.6773 },
  { name: 'Sunway Pyramid', sub: 'Shopping mall · Subang Jaya', icon: 'mall', lat: 3.0730, lng: 101.6070 },
  { name: 'Bandar Tasik Selatan (TBS)', sub: 'Bus terminal & KTM · Kuala Lumpur', icon: 'train', lat: 3.0762, lng: 101.7108 },
  { name: 'KLIA 2', sub: 'Airport · Sepang', icon: 'pin', lat: 2.7438, lng: 101.6855 },
  { name: 'KLIA 1', sub: 'Airport · Sepang', icon: 'pin', lat: 2.7559, lng: 101.7058 },
  { name: 'Cyberjaya', sub: 'Town · Selangor', icon: 'building', lat: 2.9213, lng: 101.6559 },
  { name: 'Monash University Malaysia', sub: 'Campus · Bandar Sunway', icon: 'campus', lat: 3.0640, lng: 101.6008 },
  { name: "Taylor's University", sub: 'Campus · Subang Jaya', icon: 'campus', lat: 3.0629, lng: 101.6168 },
  { name: 'University Malaya', sub: 'Campus · Kuala Lumpur', icon: 'campus', lat: 3.1209, lng: 101.6538 },
];

export function findPlace(name: string): KnownPlace | undefined {
  const needle = name.trim().toLowerCase();
  return KNOWN_PLACES.find((p) => p.name.toLowerCase() === needle);
}

export function filterPlaces(query: string): KnownPlace[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return KNOWN_PLACES.filter((p) => p.name.toLowerCase().includes(needle));
}
