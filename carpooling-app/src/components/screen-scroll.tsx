import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

type ScreenScrollProps = {
  children: ReactNode;
};

export function ScreenScroll({ children }: ScreenScrollProps) {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#EFEFEF', // Matches the gray background
  },
  content: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.five,
  },
});