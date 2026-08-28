import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Wrench, Globe, Check, ArrowRight, ShieldCheck, User, Lock, Phone, Sparkles, AlertCircle, Mail } from 'lucide-react-native';
import { useApp, SupportedLanguage } from '../../context/AppContext';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { supabase } from '../../services/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { language, setLanguage, setUser } = useApp();
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignInLoaded && signIn) {
        try {
          const attempt = await signIn.create({
            identifier: email.trim(),
            password: password.trim(),
          });
          if (attempt.status === 'complete' && setSignInActive) {
            await setSignInActive({ session: attempt.createdSessionId });
          }
        } catch (_) {}
      }

      const cleanEmail = email.trim().toLowerCase();
      const usernamePart = cleanEmail.split('@')[0];

      let { data } = await supabase
        .from('user_profiles')
        .select('*')
        .or(`email.ilike.${cleanEmail},username.ilike.${usernamePart}`)
        .limit(1);

      let userRecord = data && data.length > 0 ? data[0] : null;

      if (!userRecord) {
        // Create customer profile on the fly
        const newId = 'u_' + Date.now();
        const { data: created } = await supabase
          .from('user_profiles')
          .insert([{
            id: newId,
            user_id: newId,
            name: usernamePart,
            username: usernamePart,
            email: cleanEmail,
            password: password.trim(),
            phone: '',
            home_address: 'Anna Nagar West, Chennai',
            home_lat: 13.0827,
            home_lng: 80.2707,
            preferred_language: language,
          }])
          .select()
          .single();
        userRecord = created;
      }

      setLoading(false);
      if (userRecord) {
        setUser(userRecord);
        if (!userRecord.phone || userRecord.name === 'New User') {
          router.replace('/(auth)/setup');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (e: any) {
      setLoading(false);
      setErrorMsg(e.message || 'Sign in failed.');
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg('Please fill in Name, Email, and Password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (isSignUpLoaded && signUp) {
        try {
          await signUp.create({
            emailAddress: email.trim(),
            password: password.trim(),
            firstName: name.trim().split(' ')[0],
            lastName: name.trim().split(' ')[1] || '',
          });
        } catch (_) {}
      }

      await createSupabaseProfile();
    } catch (e: any) {
      await createSupabaseProfile();
    }
  };

  const handleVerifyEmail = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      if (isSignUpLoaded && signUp) {
        const complete = await signUp.attemptEmailAddressVerification({ code: code.trim() });
        if (complete.status === 'complete' && setSignUpActive) {
          await setSignUpActive({ session: complete.createdSessionId });
        }
      }
      await createSupabaseProfile();
    } catch (e: any) {
      setLoading(false);
      setErrorMsg(e.errors?.[0]?.longMessage || e.message || 'Invalid verification code.');
    }
  };

  const createSupabaseProfile = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const usernamePart = cleanEmail.split('@')[0];
    const newId = 'u_' + Date.now();

    const { data } = await supabase
      .from('user_profiles')
      .insert([{
        id: newId,
        user_id: newId,
        name: name.trim(),
        username: usernamePart,
        password: password.trim(),
        email: cleanEmail,
        phone: phone.trim() || '',
        home_address: 'Anna Nagar West, Chennai',
        home_lat: 13.0827,
        home_lng: 80.2707,
        preferred_language: language,
      }])
      .select()
      .single();

    setLoading(false);
    if (data) {
      setUser(data);
      if (!data.phone || data.name === 'New User') {
        router.replace('/(auth)/setup');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      router.replace('/(auth)/setup');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Brand Header */}
          <View style={styles.brandBox}>
            <View style={styles.logoCircle}>
              <Wrench size={38} color="#2563EB" />
            </View>
            <Text style={styles.appName}>Namma Service</Text>
            <Text style={styles.appTagline}>
              Instant Home Services
            </Text>
          </View>

          {/* Language Selector */}
          <View style={styles.langSection}>
            <View style={styles.langGrid}>
              {[
                { code: 'en', label: 'English' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'hi', label: 'हिंदी' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.langChip,
                    language === item.code && styles.langChipActive,
                  ]}
                  onPress={() => setLanguage(item.code as SupportedLanguage)}
                >
                  <Text
                    style={[
                      styles.langText,
                      language === item.code && styles.langTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {language === item.code && (
                    <Check size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Login / Register Toggle */}
          <View style={styles.tabToggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'login' && styles.toggleBtnActive]}
              onPress={() => { setMode('login'); setErrorMsg(''); setPendingVerification(false); }}
            >
              <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, mode === 'register' && styles.toggleBtnActive]}
              onPress={() => { setMode('register'); setErrorMsg(''); setPendingVerification(false); }}
            >
              <Text style={[styles.toggleText, mode === 'register' && styles.toggleTextActive]}>
                New Customer Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* Card */}
          <View style={styles.card}>
            {errorMsg ? (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#DC2626" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {pendingVerification ? (
              <>
                <Text style={styles.cardTitle}>Verify Email Address</Text>
                <Text style={styles.cardSubtitle}>Enter 6-digit code sent to {email}</Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter verification code"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    value={code}
                    onChangeText={setCode}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  disabled={loading}
                  onPress={handleVerifyEmail}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Verify & Complete Signup</Text>
                      <ShieldCheck size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : mode === 'login' ? (
              <>
                <Text style={styles.cardTitle}>Customer Sign In</Text>
                <Text style={styles.cardSubtitle}>
                  Enter your Email and Password
                </Text>

                {/* Email */}
                <View style={styles.inputRow}>
                  <Mail size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address (e.g. name@example.com)"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputRow}>
                  <Lock size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  disabled={loading}
                  onPress={handleLogin}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Sign In</Text>
                      <ArrowRight size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.cardTitle}>Create Account</Text>
                <Text style={styles.cardSubtitle}>
                  Register a new account
                </Text>

                {/* Name */}
                <View style={styles.inputRow}>
                  <User size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name (e.g. Anand Kumar)"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Email */}
                <View style={styles.inputRow}>
                  <Mail size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#94A3B8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputRow}>
                  <Lock size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Choose Password (min 8 chars)"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>

                {/* Phone */}
                <View style={styles.inputRow}>
                  <Phone size={18} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  disabled={loading}
                  onPress={handleRegister}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.primaryBtnText}>Register Account</Text>
                      <ShieldCheck size={18} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#BFDBFE',
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  appTagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  langSection: {
    marginBottom: 16,
  },
  langLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
    alignSelf: 'center',
  },
  langGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  langChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  langText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  tabToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleTextActive: {
    color: '#2563EB',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
    gap: 6,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
