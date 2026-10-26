import { useEffect } from 'react';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import { useAuth } from '@/context/auth';

const { width, height } = Dimensions.get('window');

export default function SplashScreenRoute() {
  const { token, user, isLoading } = useAuth();

  useEffect(() => {
    // Wait 1.5 seconds, then route automatically
    const timer = setTimeout(() => {
      if (!isLoading) {
        if (token && user) {
          router.replace('/(app)');
        } else {
          router.replace('/login');
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [isLoading, token, user]);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      
      {/* Make sure this matches your exact file name in the assets/images folder */}
      <Image
        source={require('../../assets/images/splash.jpeg')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#E5E5E5', // Matches the grey background of your image
  },
  image: {
    width: width,
    height: height,
  },
});