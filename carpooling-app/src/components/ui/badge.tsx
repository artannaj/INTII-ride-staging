import { ReactNode } from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Colors } from '@/constants/theme';

type BadgeVariant = 'success' | 'danger' | 'dark' | 'neutral' | 'warning';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  icon?: ReactNode;
  style?: ViewStyle;
};

export function Badge({ label, variant = 'dark', icon, style }: BadgeProps) {
  const v = styles[variant];
  return (
    <View style={[styles.base, v.container, style]}>
      {icon}
      <Text style={[styles.label, v.text]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  success: {
    container: { backgroundColor: '#DCFCE7' },
    text: { color: '#15803D' },
  },
  danger: {
    container: { backgroundColor: '#FEE2E2' },
    text: { color: '#B91C1C' },
  },
  dark: {
    container: { backgroundColor: Colors.light.text },
    text: { color: '#FFFFFF' },
  },
  neutral: {
    container: { backgroundColor: Colors.light.backgroundElement },
    text: { color: '#444444' },
  },
  warning: {
    container: { backgroundColor: '#FEF3C7' },
    text: { color: '#92400E' },
  },
});