import { ReactNode } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Colors, Radii, Spacing } from '@/constants/theme';

type CardProps = {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  padded?: boolean;
};

export function Card({ children, style, padded = true }: CardProps) {
  return (
    <View style={[styles.card, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  padded: {
    padding: Spacing.three,
  },
});