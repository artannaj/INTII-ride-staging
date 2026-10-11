import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <BrandMark compact />
        <Button label="Log out" variant="ghost" onPress={() => void signOut()} />
      </View>

      <View style={styles.body}>
        <Text style={styles.greeting}>
          Hi{user?.username ? `, ${user.username}` : ''}
        </Text>
        <Text style={styles.empty}>Home is empty for now.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: Spacing.four,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.two,
  },
  greeting: {
    fontFamily: Fonts.sansBold,
    fontSize: 28,
    letterSpacing: -0.8,
    color: Colors.light.text,
  },
  empty: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
});
