import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Zap,
  Droplets,
  Key,
  Flame,
  Clock,
  Star,
  CheckCircle2,
  ShieldAlert,
  PhoneCall,
  XCircle,
  PhoneOff,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { fetchWorkers, createBooking } from '../../services/api';
import { Worker } from '../../types';
import { supabase } from '../../services/supabase';

export default function EmergencyScreen() {
  const router = useRouter();
  const { user, setActiveBooking } = useApp();

  const [selectedIssue, setSelectedIssue] = useState('Water leak (Plumbing)');
  const [availableWorkers, setAvailableWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);

  // Round Robin State
  const [isRinging, setIsRinging] = useState(false);
  const [currentWorkerIndex, setCurrentWorkerIndex] = useState(0);
  const [countdown, setCountdown] = useState(30);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  useEffect(() => {
    async function loadCategoryWorkers() {
      setLoading(true);
      const cat = getCategoryFromIssue(selectedIssue);
      const list = await fetchWorkers(user?.lat || 13.0827, user?.lng || 80.2707, {
        sort_by: 'distance',
        category: cat,
      });
      setAvailableWorkers(list);
      setLoading(false);
    }
    loadCategoryWorkers();
  }, [selectedIssue, user]);

  const getCategoryFromIssue = (issue: string) => {
    if (issue.includes('Water') || issue.includes('Plumbing')) return 'Plumbing';
    if (issue.includes('Electrical')) return 'Electrical';
    if (issue.includes('Locked')) return 'Carpentry';
    return 'Electrical';
  };

  const startSequentialRinging = async () => {
    if (!user) return;
    if (availableWorkers.length === 0) {
      Alert.alert(
        'No Technicians Online',
        `No verified ${getCategoryFromIssue(selectedIssue)} workers are currently available near your location.`
      );
      return;
    }

    setIsRinging(true);
    setCurrentWorkerIndex(0);
    setCountdown(30);

    await ringWorkerAtIndex(0);
  };

  const ringWorkerAtIndex = async (index: number) => {
    if (index >= availableWorkers.length) {
      // Ringed all workers
      setIsRinging(false);
      if (timerRef.current) clearInterval(timerRef.current);
      Alert.alert(
        'All Technicians Busy',
        'We ringed all nearby emergency technicians, but none accepted within 30s. Please try again in 1 minute.'
      );
      return;
    }

    const targetWorker = availableWorkers[index];

    // Create booking assigned to targetWorker
    const created = await createBooking({
      customer_id: user?.id || 'u_guest',
      worker_id: targetWorker.id,
      service_id: getCategoryFromIssue(selectedIssue).toLowerCase(),
      price: targetWorker.price_min + 150,
      address: user?.address || user?.home_address || 'Chennai Central, Tamil Nadu',
      lat: user?.lat || 13.0827,
      lng: user?.lng || 80.2707,
      problem_text: `🚨 EMERGENCY 30s RING DISPATCH: ${selectedIssue}`,
      urgency: 'emergency',
    });

    if (!created) return;

    setActiveBookingId(created.id);
    setCountdown(30);

    // Subscribe to realtime booking update to detect acceptance/rejection
    if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);

    realtimeChannelRef.current = supabase
      .channel(`emergency_dispatch_${created.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${created.id}` },
        (payload) => {
          const updated = payload.new;
          if (updated.status === 'accepted') {
            // Worker accepted!
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRinging(false);
            created.worker = targetWorker;
            created.status = 'accepted';
            setActiveBooking(created);
            router.replace('/booking/tracking');
          } else if (updated.status === 'cancelled') {
            // Worker declined → Ring next worker immediately!
            advanceToNextWorker(index + 1);
          }
        }
      )
      .subscribe();

    // Start 30s Countdown Timer
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Timeout reached → Cancel current booking and advance to next worker!
          supabase.from('bookings').update({ status: 'cancelled' }).eq('id', created.id);
          advanceToNextWorker(index + 1);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const advanceToNextWorker = (nextIndex: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentWorkerIndex(nextIndex);
    ringWorkerAtIndex(nextIndex);
  };

  const cancelEmergencyDispatch = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (activeBookingId) {
      supabase.from('bookings').update({ status: 'cancelled' }).eq('id', activeBookingId);
    }
    setIsRinging(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (realtimeChannelRef.current) supabase.removeChannel(realtimeChannelRef.current);
    };
  }, []);

  const currentWorker = availableWorkers[currentWorkerIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#7F1D1D" />

      {/* Top Header */}
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>🚨 EMERGENCY DISPATCH MODE</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Banner */}
        <View style={styles.emergencyBanner}>
          <ShieldAlert size={36} color="#FFFFFF" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.bannerTitle}>30-Second Round-Robin Dispatch</Text>
            <Text style={styles.bannerSub}>
              Each nearby technician is ringed sequentially for 30s. If unaccepted, system automatically rings the next nearest technician!
            </Text>
          </View>
        </View>

        {/* Quick Issues Grid */}
        <Text style={styles.sectionTitle}>Select Emergency Issue</Text>
        <View style={styles.issuesGrid}>
          {[
            { label: 'Water leak (Plumbing)', icon: Droplets, color: '#0284C7' },
            { label: 'Electrical problem', icon: Zap, color: '#EAB308' },
            { label: 'Locked out (Locksmith)', icon: Key, color: '#D97706' },
            { label: 'Gas / Fire risk', icon: Flame, color: '#DC2626' },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isSel = selectedIssue === item.label;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.issueChip, isSel && styles.issueChipSelected]}
                disabled={isRinging}
                onPress={() => setSelectedIssue(item.label)}
              >
                <Icon size={20} color={isSel ? '#DC2626' : item.color} />
                <Text style={[styles.issueText, isSel && styles.issueTextSelected]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Ringing Overlay / Controls */}
        {isRinging ? (
          <View style={styles.ringingBox}>
            <View style={styles.pulseHeader}>
              <PhoneCall size={28} color="#DC2626" />
              <Text style={styles.ringingTitle}>
                RINGING TECHNICIAN {currentWorkerIndex + 1} OF {availableWorkers.length}
              </Text>
            </View>

            {/* Countdown Badge */}
            <View style={styles.timerCircle}>
              <Text style={styles.timerNumber}>{countdown}</Text>
              <Text style={styles.timerUnit}>seconds remaining</Text>
            </View>

            {/* Worker Details Being Ringed */}
            {currentWorker && (
              <View style={styles.workerRingCard}>
                {currentWorker.photo_url ? (
                  <Image source={{ uri: currentWorker.photo_url }} style={styles.ringAvatar} />
                ) : (
                  <View style={styles.ringAvatarBadge}>
                    <Text style={styles.ringAvatarText}>
                      {(currentWorker.name || 'W').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={styles.ringWorkerName}>👷 {currentWorker.name}</Text>
                  <Text style={styles.ringWorkerSub}>
                    {currentWorker.category} • ⭐ {currentWorker.rating.toFixed(1)} ({currentWorker.completed_jobs} jobs)
                  </Text>
                  <Text style={styles.ringEta}>
                    ⏱️ Distance: {currentWorker.distance_km || 1.2} km away
                  </Text>
                </View>
              </View>
            )}

            <Text style={styles.autoAdvanceNote}>
              If {currentWorker?.name || 'Technician'} doesn't respond in {countdown}s, the call will automatically transfer to Technician {currentWorkerIndex + 2}!
            </Text>

            <TouchableOpacity style={styles.cancelCallBtn} onPress={cancelEmergencyDispatch}>
              <PhoneOff size={20} color="#FFFFFF" />
              <Text style={styles.cancelCallText}>Cancel Emergency Ringing</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.radarCard}>
            <View style={styles.responseHeader}>
              <CheckCircle2 size={20} color="#16A34A" />
              <Text style={styles.responseText}>
                Found {availableWorkers.length} active verified {getCategoryFromIssue(selectedIssue)} technicians nearby!
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#DC2626" style={{ marginVertical: 20 }} />
            ) : availableWorkers.length > 0 ? (
              <View>
                {availableWorkers.slice(0, 3).map((w, index) => (
                  <View key={w.id} style={styles.workerPreviewRow}>
                    {w.photo_url ? (
                      <Image source={{ uri: w.photo_url }} style={styles.prevAvatar} />
                    ) : (
                      <View style={styles.prevAvatarBadge}>
                        <Text style={styles.prevAvatarText}>
                          {(w.name || 'W').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}

                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={styles.prevName}>#{index + 1} 👷 {w.name}</Text>
                      <Text style={styles.prevMeta}>⭐ {w.rating.toFixed(1)} • {w.completed_jobs} jobs</Text>
                    </View>

                    <View style={styles.prevPrice}>
                      <Text style={styles.prevPriceText}>₹{w.price_min + 150}</Text>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.dispatchMainBtn}
                  onPress={startSequentialRinging}
                >
                  <PhoneCall size={22} color="#FFFFFF" />
                  <Text style={styles.dispatchMainBtnText}>
                    START 30s EMERGENCY RINGING DISPATCH
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.noWorkersText}>
                No online {getCategoryFromIssue(selectedIssue)} workers in your location right now.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7F1D1D',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#991B1B',
  },
  backBtn: {
    padding: 4,
    marginRight: 10,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  content: {
    padding: 16,
  },
  emergencyBanner: {
    backgroundColor: '#B91C1C',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  bannerSub: {
    color: '#FCA5A5',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  issuesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  issueChip: {
    width: '48%',
    backgroundColor: '#991B1B',
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#B91C1C',
  },
  issueChipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  issueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FEE2E2',
    flex: 1,
  },
  issueTextSelected: {
    color: '#991B1B',
  },
  ringingBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EF4444',
  },
  pulseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ringingTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  timerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FEF2F2',
    borderWidth: 4,
    borderColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  timerNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: '#DC2626',
  },
  timerUnit: {
    fontSize: 9,
    fontWeight: '800',
    color: '#991B1B',
  },
  workerRingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginVertical: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ringAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  ringAvatarBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  ringWorkerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  ringWorkerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  ringEta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    marginTop: 2,
  },
  autoAdvanceNote: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  cancelCallBtn: {
    backgroundColor: '#991B1B',
    borderRadius: 14,
    height: 50,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cancelCallText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  radarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  responseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },
  workerPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
  },
  prevAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  prevAvatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  prevName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  prevMeta: {
    fontSize: 12,
    color: '#64748B',
  },
  prevPrice: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  prevPriceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  dispatchMainBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 16,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  dispatchMainBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  noWorkersText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
