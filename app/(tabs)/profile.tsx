import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Phone,
  MapPin,
  Bell,
  HelpCircle,
  Shield,
  Heart,
  ClipboardList,
  LogOut,
  ChevronRight,
  Plus,
} from 'lucide-react-native';
import { useApp, SupportedLanguage } from '../../context/AppContext';

export default function ProfileTab() {
  const router = useRouter();
  const { user, language, setLanguage, savedLocations, t, logout } = useApp();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  if (!user) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <View style={styles.profileCard}>
          {user.photo_url ? (
            <Image source={{ uri: user.photo_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarLetterBadge}>
              <Text style={styles.avatarLetterText}>
                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.name || user.username || 'Customer'}</Text>
            <View style={styles.phoneRow}>
              <Phone size={14} color="#64748B" />
              <Text style={styles.userPhone}>{user.phone || 'Phone not set'}</Text>
            </View>
            <View style={styles.locRow}>
              <MapPin size={14} color="#2563EB" />
              <Text style={styles.userLoc} numberOfLines={1}>
                {user.address || user.home_address || 'Chennai, Tamil Nadu'}
              </Text>
            </View>
          </View>
        </View>

        {/* Saved Locations */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>📍 Saved Locations</Text>
            <TouchableOpacity style={styles.addBtn}>
              <Plus size={14} color="#2563EB" />
              <Text style={styles.addBtnText}>Add New</Text>
            </TouchableOpacity>
          </View>

          {savedLocations.map((loc, idx) => (
            <View key={idx} style={styles.locationItem}>
              <MapPin size={18} color="#0284C7" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.locTitle}>{loc.title}</Text>
                <Text style={styles.locAddress}>{loc.address}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Language Preference Switcher */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 Language / மொழி</Text>
          <View style={styles.langRow}>
            {[
              { code: 'en', label: 'English' },
              { code: 'ta', label: 'தமிழ்' },
              { code: 'hi', label: 'हिंदी' },
            ].map((item) => (
              <TouchableOpacity
                key={item.code}
                style={[
                  styles.langBtn,
                  language === item.code && styles.langBtnActive,
                ]}
                onPress={() => setLanguage(item.code as SupportedLanguage)}
              >
                <Text
                  style={[
                    styles.langBtnText,
                    language === item.code && styles.langBtnTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Activity & Settings Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Activity & Settings</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/bookings')}
          >
            <ClipboardList size={20} color="#2563EB" />
            <Text style={styles.menuText}>Service History & Bookings</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => router.push('/(tabs)/workers')}
          >
            <Heart size={20} color="#DC2626" />
            <Text style={styles.menuText}>Favorite Workers</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Notifications', 'Push notifications enabled')}
          >
            <Bell size={20} color="#D97706" />
            <Text style={styles.menuText}>Notifications</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Help & Support', 'Support Helpline: 1800-123-4567')}
          >
            <HelpCircle size={20} color="#0284C7" />
            <Text style={styles.menuText}>Help & Customer Support</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('Privacy', 'Your data is encrypted & secured')}
          >
            <Shield size={20} color="#16A34A" />
            <Text style={styles.menuText}>Privacy Policy</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarLetterBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetterText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  profileInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  userPhone: {
    fontSize: 13,
    color: '#475569',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  userLoc: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  locTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  locAddress: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  langBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  langBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  langBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 8,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 15,
    fontWeight: '700',
  },
});
