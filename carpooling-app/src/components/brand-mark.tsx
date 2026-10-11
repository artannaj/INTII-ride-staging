import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type Props = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.mark, compact && styles.markCompact]}>
        <CarIcon size={compact ? 26 : 32} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.name, compact && styles.nameCompact]}>INTI Ride</Text>
        {!compact ? (
          <Text style={styles.tagline}>Campus carpooling for INTI</Text>
        ) : null}
      </View>
    </View>
  );
}

/* Smooth car icon — pure View composition for crisp rendering at any size */
function CarIcon({ size = 32 }: { size?: number }) {
  const S = (v: number) => (v / 32) * size;
  const white = '#FFFFFF';
  const red = Colors.light.primary;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Cabin (roof) */}
      <View
        style={{
          position: 'absolute',
          top: S(4),
          left: S(7),
          width: S(18),
          height: S(8),
          borderTopLeftRadius: S(4),
          borderTopRightRadius: S(4),
          backgroundColor: white,
        }}
      />
      {/* Left window */}
      <View
        style={{
          position: 'absolute',
          top: S(5.5),
          left: S(8.5),
          width: S(7),
          height: S(4.5),
          backgroundColor: red,
          borderTopLeftRadius: S(2),
        }}
      />
      {/* Right window */}
      <View
        style={{
          position: 'absolute',
          top: S(5.5),
          left: S(16.5),
          width: S(7),
          height: S(4.5),
          backgroundColor: red,
          borderTopRightRadius: S(2),
        }}
      />
      {/* Main body */}
      <View
        style={{
          position: 'absolute',
          top: S(12),
          left: S(2),
          width: S(28),
          height: S(11),
          borderRadius: S(3),
          backgroundColor: white,
        }}
      />
      {/* Red star/asterisk left door */}
      <View
        style={{
          position: 'absolute',
          top: S(14),
          left: S(9),
          width: S(4),
          height: S(4),
          borderRadius: S(2),
          backgroundColor: red,
        }}
      />
      {/* Red star/asterisk right door */}
      <View
        style={{
          position: 'absolute',
          top: S(14),
          left: S(19),
          width: S(4),
          height: S(4),
          borderRadius: S(2),
          backgroundColor: red,
        }}
      />
      {/* Headlight (yellow) */}
      <View
        style={{
          position: 'absolute',
          top: S(13),
          left: S(27),
          width: S(3),
          height: S(3),
          borderRadius: S(1.5),
          backgroundColor: '#FACC15',
        }}
      />
      {/* Left wheel */}
      <View
        style={{
          position: 'absolute',
          top: S(21),
          left: S(5),
          width: S(6),
          height: S(6),
          borderRadius: S(3),
          backgroundColor: red,
          borderWidth: S(1.5),
          borderColor: white,
        }}
      />
      {/* Right wheel */}
      <View
        style={{
          position: 'absolute',
          top: S(21),
          left: S(21),
          width: S(6),
          height: S(6),
          borderRadius: S(3),
          backgroundColor: red,
          borderWidth: S(1.5),
          borderColor: white,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  wrapCompact: { gap: 10 },
  mark: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  markCompact: {
    width: 48,
    height: 48,
    borderRadius: 14,
  },
  copy: { gap: 2 },
  name: {
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    letterSpacing: -0.6,
    color: Colors.light.text,
  },
  nameCompact: {
    fontSize: 18,
    letterSpacing: -0.4,
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});