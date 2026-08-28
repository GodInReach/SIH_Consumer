import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider, useApp } from '../context/AppContext';
import { View, ActivityIndicator } from 'react-native';
import { ClerkProvider } from '@clerk/clerk-expo';
import { tokenCache } from '../services/tokenCache';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const CLERK_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  'pk_test_Y2xldmVyLWFpcmVkYWxlLTk2OTQuY2xlcmsuYWNjb3VudHMuZGV2JA';

function LayoutContent() {
  const { isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F8FAFC' },
      }}
    >
      <Stack.Screen name="(auth)/login" options={{ animation: 'fade' }} />
      <Stack.Screen name="(auth)/setup" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="request/index" options={{ presentation: 'modal' }} />
      <Stack.Screen name="emergency/index" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="workers/index" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="workers/[id]" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="booking/confirm" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="booking/tracking" options={{ animation: 'fade' }} />
      <Stack.Screen name="booking/payment" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="rating/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="chat/[id]" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <AppProvider>
          <StatusBar style="dark" />
          <LayoutContent />
        </AppProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
