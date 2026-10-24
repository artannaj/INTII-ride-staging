import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

import { Colors, Fonts } from '@/constants/theme';

type Props = {
  compact?: boolean;
};

export function BrandMark({ compact = false }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.mark, compact && styles.markCompact]}>
        {/* The exact car icon from the HTML prototype */}
        <Svg viewBox="0 0 40 40" width="60%" height="60%">
          <Path 
            d="M9 20l2.5-8c.5-1.5 1.5-2 3-2h11c1.5 0 2.5.5 3 2l2.5 8c1.5.5 2 1.5 2 3v7h-4v-2H11v2H7v-7c0-1.5.5-2.5 2-3z" 
            fill="#fff" 
          />
          <Path 
            d="M13 20l1.5-5h11l1.5 5z" 
            fill={Colors.light.primary} 
          />
          <Circle cx="13" cy="24.5" r="2" fill={Colors.light.primary} />
          <Circle cx="27" cy="24.5" r="2" fill={Colors.light.primary} />
        </Svg>
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

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wrapCompact: {
    gap: 8,
  },
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
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  copy: {
    gap: 2,
  },
  name: {
    fontFamily: Fonts.sansBold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: Colors.light.text,
  },
  nameCompact: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  tagline: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
});