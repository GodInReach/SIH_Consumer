import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useApp } from '../context/AppContext';

export default function Index() {
  const { isAuthenticated, user, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (user && (!user.phone || user.name === 'New User')) {
    return <Redirect href="/(auth)/setup" />;
  }

  return <Redirect href="/(tabs)" />;
}
