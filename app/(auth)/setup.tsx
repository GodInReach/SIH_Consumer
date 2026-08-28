import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, ArrowRight, Camera, User, Phone, MapPin } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../services/supabase';
import { useApp } from '../../context/AppContext';

export default function CustomerSetupScreen() {
  const router = useRouter();
  const { user, setUser } = useApp();

  const [name, setName] = useState(user?.name && user.name !== 'New User' ? user.name : '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.home_address || 'Anna Nagar West, Chennai');
  const [photoUri, setPhotoUri] = useState<string | null>(user?.photo_url || null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Photo access is needed for your profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('Image picker error:', e);
    }
  };

  const handleSaveProfile = async () => {
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Please provide your Full Name and Mobile Phone number.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const { data: authData } = await supabase.auth.getUser();
      const currentUserId = user?.user_id || authData?.user?.id || user?.id;

      if (!currentUserId) {
        setErrorMsg('User authentication session invalid. Please sign in again.');
        setLoading(false);
        return;
      }

      const profilePayload = {
        user_id: currentUserId,
        name: name.trim(),
        phone: phone.trim(),
        home_address: address.trim(),
        photo_url: photoUri || '',
        preferred_language: user?.preferred_language || 'en',
        home_lat: user?.home_lat || 13.0827,
        home_lng: user?.home_lng || 80.2707,
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profilePayload, { onConflict: 'user_id' })
        .select()
        .single();

      setLoading(false);

      if (error) {
        // Fallback update by user_id or id
        const { data: updated } = await supabase
          .from('user_profiles')
          .update(profilePayload)
          .eq('user_id', currentUserId)
          .select()
          .single();

        if (updated) {
          setUser(updated);
          router.replace('/(tabs)');
        } else {
          setErrorMsg(error.message);
        }
      } else {
        if (data) setUser(data);
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setLoading(false);
      setErrorMsg(e.message || 'Failed to save profile.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complete Customer Profile</Text>
        <Text style={styles.headerSub}>Enter your details to request instant home services</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Profile Photo Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarCircle} onPress={handlePickPhoto}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <User size={40} color="#64748B" />
                  <View style={styles.cameraBadge}>
                    <Camera size={14} color="#FFFFFF" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to upload profile photo</Text>
          </View>

          {/* Full Name */}
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputRow}>
            <User size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Anand Kumar"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Mobile Phone */}
          <Text style={styles.label}>Mobile Phone Number *</Text>
          <View style={styles.inputRow}>
            <Phone size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* Home Address */}
          <Text style={styles.label}>Default Home Address</Text>
          <View style={styles.inputRow}>
            <MapPin size={18} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. 12th Main Road, Anna Nagar, Chennai"
              placeholderTextColor="#94A3B8"
              value={address}
              onChangeText={setAddress}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveProfile} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>Save Profile & Continue</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 13, color: '#64748B', marginTop: 4 },
  content: { padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  errorBox: { backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10, marginBottom: 14, borderWidth: 1, borderColor: '#FCA5A5' },
  errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600' },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#EFF6FF', overflow: 'hidden', borderWidth: 2, borderColor: '#BFDBFE' },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraBadge: { position: 'absolute', bottom: 4, right: 4, backgroundColor: '#2563EB', borderRadius: 12, padding: 4 },
  avatarHint: { fontSize: 12, color: '#64748B', marginTop: 6, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', color: '#334155', marginTop: 12, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1.5, borderColor: '#CBD5E1', paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, fontSize: 15, fontWeight: '600', color: '#0F172A' },
  footer: { padding: 20, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  primaryBtn: { backgroundColor: '#2563EB', borderRadius: 12, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
