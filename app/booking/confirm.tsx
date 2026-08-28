import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Wrench,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { fetchWorkerById, createBooking } from '../../services/api';
import { Worker } from '../../types';

export default function BookingConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, setActiveBooking, problemDraft } = useApp();

  const workerId = params.workerId as string;
  const serviceId = (params.serviceId as string) || 'electrician';
  const problem = (params.problem as string) || 'Fan Repair & Maintenance';
  const price = parseInt((params.price as string) || '400', 10);

  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadWorker() {
      if (workerId && user) {
        const w = await fetchWorkerById(workerId, user.lat, user.lng);
        setWorker(w);
      }
      setLoading(false);
    }
    loadWorker();
  }, [workerId, user]);

  const handleConfirm = async () => {
    if (!user || !workerId) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const newBooking = await createBooking({
        customer_id: user.id,
        worker_id: workerId || worker?.id || 'w1',
        service_id: serviceId,
        problem_text: problem,
        urgency: problemDraft?.urgency || 'normal',
        address: user.address || user.home_address || '',
        lat: user.lat || user.home_lat || 13.0827,
        lng: user.lng || user.home_lng || 80.2707,
        price: price,
      });

      if (!newBooking) {
        setErrorMsg('Failed to create booking. Please try again.');
        setSubmitting(false);
        return;
      }

      if (worker) {
        newBooking.worker = worker;
      }

      setActiveBooking(newBooking);
      setSubmitting(false);

      // Navigate directly to tracking screen
      router.replace('/booking/tracking');
    } catch (err) {
      console.warn('Booking confirmation failed:', err);
      setErrorMsg('Failed to create booking. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading || !worker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Confirm Booking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {errorMsg ? (
          <View style={{ backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 16 }}>
            <Text style={{ color: '#DC2626', fontWeight: '600' }}>{errorMsg}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardHeaderTitle}>Service Details</Text>

          {/* Worker Row */}
          <View style={styles.workerRow}>
            <Image source={{ uri: worker.photo_url }} style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.workerName}>👷 {worker.name}</Text>
                <ShieldCheck size={14} color="#16A34A" />
              </View>
              <Text style={styles.workerMeta}>
                ⭐ {worker.rating} • {worker.completed_jobs} Jobs Completed
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Details list */}
          <View style={styles.detailRow}>
            <Wrench size={18} color="#2563EB" />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Problem Description</Text>
              <Text style={styles.detailValue}>{problem}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <MapPin size={18} color="#0284C7" />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Service Location</Text>
              <Text style={styles.detailValue}>{user?.address || user?.home_address}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Clock size={18} color="#7C3AED" />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Estimated Worker Arrival</Text>
              <Text style={styles.detailValue}>{worker.calculated_eta || 8} mins away</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <IndianRupee size={18} color="#16A34A" />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Estimated Price</Text>
              <Text style={styles.detailValueBold}>₹{worker.price_min} – ₹{worker.price_max}</Text>
            </View>
          </View>
        </View>

        {/* Price Breakdown Preview */}
        <View style={styles.priceBreakdownCard}>
          <Text style={styles.priceBreakdownTitle}>Estimated Bill</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Worker Service Charge</Text>
            <Text style={styles.priceVal}>₹{price}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Platform Convenience Fee</Text>
            <Text style={styles.priceValFree}>₹0 (FREE)</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalVal}>₹{price}</Text>
          </View>
        </View>

        <View style={styles.guaranteeNote}>
          <CheckCircle2 size={16} color="#16A34A" />
          <Text style={styles.guaranteeNoteText}>
            No advance payment needed. Pay directly to worker after job completion.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.confirmBtn}
          disabled={submitting}
          onPress={handleConfirm}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  workerMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  detailTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 2,
  },
  detailValueBold: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16A34A',
    marginTop: 2,
  },
  priceBreakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceBreakdownTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 13,
    color: '#475569',
  },
  priceVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  priceValFree: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2563EB',
  },
  guaranteeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 8,
  },
  guaranteeNoteText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  confirmBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
