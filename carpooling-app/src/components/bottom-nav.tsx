import {
  Bookmark,
  Car,
  Home,
  MessageCircle,
  PlusCircle,
  User,
  type LucideIcon,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export type NavTab = 'home' | 'post' | 'chat' | 'bookings' | 'account';

type NavItem = {
  key: NavTab;
  label: string;
  Icon: LucideIcon;
  path: string;
};

const PASSENGER_ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', Icon: Home, path: '/(app)' },
  { key: 'bookings', label: 'Bookings', Icon: Bookmark, path: '/(app)/bookings' },
  { key: 'chat', label: 'Chat', Icon: MessageCircle, path: '/(app)/chat' },
  { key: 'account', label: 'Account', Icon: User, path: '/(app)/account' },
];

const DRIVER_ITEMS: NavItem[] = [
  { key: 'home', label: 'My rides', Icon: Car, path: '/(app)/driver' },
  { key: 'post', label: 'Post', Icon: PlusCircle, path: '/(app)/driver/post-ride' },
  { key: 'chat', label: 'Chat', Icon: MessageCircle, path: '/(app)/chat' },
  { key: 'account', label: 'Account', Icon: User, path: '/(app)/account' },
];

type BottomNavProps = {
  active: NavTab;
};

export function BottomNav({ active }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const items = user?.role === 'DRIVER' ? DRIVER_ITEMS : PASSENGER_ITEMS;

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {items.map(({ key, label, Icon, path }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => {
              if (!isActive) router.push(path as any);
            }}
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