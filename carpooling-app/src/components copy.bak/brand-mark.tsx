import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing } from '@/constants/theme';

type Props = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.mark}>
        <View style={styles.markBar} />
        <View style={styles.markDot} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.name, compact && styles.nameCompact]}>INTI Ride</Text>
        {!compact ? (
          <Text style={styles.tagline}>Campus carpooling for INTI students</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  wrapCompact: {
    gap: Spacing.two,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBar: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  markDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginTop: 5,
    alignSelf: 'flex-start',
    marginLeft: 13,
  },
  copy: {
    gap: 2,
  },
  name: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    letterSpacing: -0.8,
    color: Colors.light.text,
  },
  nameCompact: {
    fontSize: 18,
    letterSpacing: -0.4,
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
