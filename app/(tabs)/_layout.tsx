import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Home, ClipboardList, Users, User } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { t, isAuthenticated, user, isLoading } = useApp();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
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

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 60 + (insets.bottom > 0 ? insets.bottom - 4 : 0),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: t('my_bookings'),
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="workers"
        options={{
          title: t('workers'),
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile'),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
