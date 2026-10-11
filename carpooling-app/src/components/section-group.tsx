import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radii } from '@/constants/theme';

type SectionGroupProps = {
  title?: string;
  children: ReactNode;
};

export function SectionGroup({ title, children }: SectionGroupProps) {
  return (
    <View style={styles.wrap}>
      {title ? <Text style={styles.title}>{title.toUpperCase()}</Text> : null}
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  title: {
    fontSize: 10.5,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: Radii.md,
    overflow: 'hidden',
  },
});