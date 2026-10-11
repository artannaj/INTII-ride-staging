import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

type MenuRowProps = {
  Icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  right?: ReactNode;
  last?: boolean;
};

export function MenuRow({
  Icon,
  title,
  subtitle,
  onPress,
  right,
  last = false,
}: MenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !last && styles.divider,
        pressed && styles.pressed,
      ]}>
      <View style={styles.iconWrap}>
        <Icon size={18} color={Colors.light.textSecondary} strokeWidth={2} />
      </View>

      <View style={styles.middle}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        {right ?? (
          <ChevronRight size={16} color="#D1D5DB" strokeWidth={2.5} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  pressed: {
    backgroundColor: '#F9FAFB',
  },
  iconWrap: {
    width: 22,
    alignItems: 'center',
  },
  middle: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  right: {
    alignItems: 'flex-end',
  },
});