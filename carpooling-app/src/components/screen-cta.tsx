import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

type ScreenCTAProps = {
  children: ReactNode;
};

export function ScreenCTA({ children }: ScreenCTAProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom, 16) }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cta: {
    backgroundColor: Colors.light.surface,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 8,
  },
});