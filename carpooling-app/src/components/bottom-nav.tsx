import {
  Home,
  Mail,
  MessageCircle,
  Bookmark,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

export type NavTab = 'home' | 'inbox' | 'chat' | 'bookings' | 'account';

type NavItem = {
  key: NavTab;
  label: string;
  Icon: LucideIcon;
  path: string;
};

const ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', Icon: Home, path: '/(app)' },
  { key: 'inbox', label: 'Inbox', Icon: Mail, path: '/(app)/inbox' },
  { key: 'chat', label: 'Chat', Icon: MessageCircle, path: '/(app)/chat' },
  { key: 'bookings', label: 'Bookings', Icon: Bookmark, path: '/(app)/bookings' },
  { key: 'account', label: 'Account', Icon: User, path: '/(app)/account' },
];

type BottomNavProps = {
  active: NavTab;
};

export function BottomNav({ active }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {ITEMS.map(({ key, label, Icon, path }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => router.push(path as any)}
            style={styles.item}>
            <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
              <Icon
                size={22}
                color={isActive ? Colors.light.primary : '#FFFFFFCC'}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                ]}>
                {label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    gap: 4,
    borderRadius: 12,
  },
  iconWrapActive: {
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  labelActive: {
    color: Colors.light.primary,
  },
});