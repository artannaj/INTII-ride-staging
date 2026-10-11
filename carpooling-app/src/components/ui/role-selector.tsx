import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Brand, Colors, Fonts, Radii, Spacing } from '@/constants/theme';
import type { Role } from '@/types/auth';

type Props = {
  value: Role;
  onChange: (role: Role) => void;
};

const OPTIONS: { role: Role; title: string; subtitle: string }[] = [
  {
    role: 'PASSENGER',
    title: 'Passenger',
    subtitle: 'Find rides to campus',
  },
  {
    role: 'DRIVER',
    title: 'Driver',
    subtitle: 'Offer seats on your route',
  },
];

export function RoleSelector({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>I am joining as</Text>
      <View style={styles.row}>
        {OPTIONS.map((option) => {
          const selected = value === option.role;
          return (
            <Pressable
              key={option.role}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.role)}
              style={[styles.card, selected && styles.cardSelected]}>
              <Text style={[styles.title, selected && styles.titleSelected]}>
                {option.title}
              </Text>
              <Text style={[styles.subtitle, selected && styles.subtitleSelected]}>
                {option.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  label: {
    fontFamily: Fonts.sansMedium,
    fontSize: 13,
    color: Colors.light.textSecondary,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  card: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    borderRadius: Radii.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    gap: 4,
  },
  cardSelected: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primarySoft,
  },
  title: {
    fontFamily: Fonts.sansSemiBold,
    fontSize: 15,
    color: Colors.light.text,
  },
  titleSelected: {
    color: Colors.light.primary,
  },
  subtitle: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    color: Colors.light.textMuted,
    lineHeight: 16,
  },
  subtitleSelected: {
    color: Brand.primaryText,
  },
});
