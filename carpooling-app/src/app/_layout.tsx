import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';

import { Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/context/auth';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: 'index',
};

function SplashController() {
  const { isLoading } = useAuth();
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  useEffect(() => {
    if (!isLoading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, fontsLoaded]);

  return null;
}

function RootNavigator() {
  const { token, isLoading } = useAuth();
  const signedIn = !!token;

  // On sign-out, send the user to login. This runs after the render that flips
  // the Stack.Protected guards, so /login is unlocked and the (app) screens are
  // already gone; navigating from inside signOut() raced the guards and left
  // users stuck on Home.
  const wasSignedIn = useRef(signedIn);
  useEffect(() => {
    if (isLoading) return;
    if (wasSignedIn.current && !signedIn) {
      router.replace('/login');
    }
    wasSignedIn.current = signedIn;
  }, [signedIn, isLoading]);

  if (isLoading) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.light.background },
      }}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>

      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="verify-otp" />
        <Stack.Screen name="forgot" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <SplashController />
      <RootNavigator />
    </AuthProvider>
  );
}