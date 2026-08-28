import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ClipboardList,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { fetchBookings } from '../../services/api';
import { Booking } from '../../types';
import { supabase } from '../../services/supabase';

export default function BookingsTab() {
  const router = useRouter();
  const { activeBooking, t, user } = useApp();
  const [history, setHistory] = useState<Booking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async () => {
    if (user?.id) {
      const list = await fetchBookings(user.id);
      setHistory(list);
    }
  };

  useEffect(() => {
    loadHistory();

    if (user?.id) {
      const channel = supabase
        .channel(`public:bookings:customer_id=eq.${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `customer_id=eq.${user.id}`,
          },
          () => {
            loadHistory();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('my_bookings')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Active Booking Widget */}
        {activeBooking && (
          <View style={styles.activeCard}>
            <View style={styles.activeBadgeRow}>
              <View style={styles.pulseDot} />
              <Text style={styles.activeBadgeText}>{t('active_booking_in_progress')}</Text>
            </View>

            <View style={styles.bookingMainRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.serviceTitle}>🔧 {activeBooking.problem}</Text>
                <Text style={styles.workerSub}>
                  {t('worker')}: {activeBooking.worker?.name || activeBooking.workers?.name || 'Worker'}
                </Text>
                <Text style={styles.statusText}>
                  {t('status')}: {activeBooking.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => router.push('/booking/tracking')}
              >
                <Text style={styles.trackBtnText}>{t('track_live_map')}</Text>
                <ChevronRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>{t('past_history')}</Text>

        {history.length === 0 ? (
          <View style={styles.emptyCard}>
            <ClipboardList size={36} color="#94A3B8" />
            <Text style={styles.emptyTitle}>{t('no_past_services')}</Text>
            <Text style={styles.emptySub}>{t('book_technician_sub')}</Text>
          </View>
        ) : (
          history.map((b) => (
            <View key={b.id} style={styles.historyCard}>
              <View style={styles.historyTopRow}>
                <Text style={styles.historyProblem}>🔧 {b.problem}</Text>
                <View style={[styles.completedBadge, b.status !== 'completed' && { backgroundColor: '#FEF2F2' }]}>
                  <CheckCircle2 size={12} color={b.status === 'completed' ? "#16A34A" : "#DC2626"} />
                  <Text style={[styles.completedText, b.status !== 'completed' && { color: '#DC2626' }]}>
                    {b.status === 'completed' ? t('completed') : b.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.workerSub}>
                {t('worker')}: {b.workers?.name || b.worker?.name || 'Worker'}
              </Text>
              <Text style={styles.historyDate}>
                {new Date(b.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>

              <View style={styles.historyBottomRow}>
                <Text style={styles.historyPrice}>₹{b.price || 400}</Text>
                <TouchableOpacity
                  style={styles.rebookBtn}
                  onPress={() =>
                    router.push({
                      pathname: '/booking/confirm',
                      params: {
                        workerId: b.worker_id || 'w1',
                        serviceId: b.service_id || 'electrician',
                        problem: b.problem,
                        price: b.price || 400,
                      },
                    })
                  }
                >
                  <RotateCcw size={14} color="#2563EB" />
                  <Text style={styles.rebookText}>{t('book_again')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  header: { paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  content: { padding: 16 },
  activeCard: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', borderWidth: 1.5, borderRadius: 16, padding: 16, marginBottom: 20 },
  activeBadgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' },
  activeBadgeText: { fontSize: 10, fontWeight: '800', color: '#1E40AF', letterSpacing: 0.5 },
  bookingMainRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  workerSub: { fontSize: 13, color: '#475569', marginTop: 2 },
  statusText: { fontSize: 12, fontWeight: '700', color: '#2563EB', marginTop: 4 },
  trackBtn: { backgroundColor: '#2563EB', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  trackBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#475569', marginTop: 10 },
  emptySub: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  historyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  historyTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyProblem: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1 },
  completedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, gap: 4 },
  completedText: { fontSize: 11, fontWeight: '600', color: '#15803D' },
  historyDate: { fontSize: 12, color: '#64748B', marginTop: 4 },
  historyBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  historyPrice: { fontSize: 15, fontWeight: '800', color: '#16A34A' },
  rebookBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  rebookText: { fontSize: 12, fontWeight: '700', color: '#2563EB' },
});
