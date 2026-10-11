import {
    Bookmark,
    Home,
    Mail,
    MessageCircle,
    User,
    type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';

export type NavTab = 'home' | 'inbox' | 'chat' | 'bookings' | 'account';

type NavItem = {
  key: NavTab;
  label: string;
  Icon: LucideIcon;
};

const ITEMS: NavItem[] = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'inbox', label: 'Inbox', Icon: Mail },
  { key: 'chat', label: 'Chat', Icon: MessageCircle },
  { key: 'bookings', label: 'Bookings', Icon: Bookmark },
  { key: 'account', label: 'Account', Icon: User },
];

type BottomNavProps = {
  active: NavTab;
  onNavigate: (tab: NavTab) => void;
};

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {ITEMS.map(({ key, label, Icon }) => {
        const isActive = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => onNavigate(key)}
            style={[styles.item, isActive && styles.itemActive]}>
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
    paddingHorizontal: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 2,
    borderRadius: 8,
  },
  itemActive: {
    backgroundColor: '#FFFFFF',
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFFCC',
  },
  labelActive: {
    color: Colors.light.primary,
  },
});