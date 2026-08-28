import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  HeartHandshake,
  QrCode,
  Banknote,
  ArrowRight,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setActiveBooking } = useApp();

  const workerName = (params.workerName as string) || 'Worker';
  const price = parseInt((params.price as string) || '400', 10);
  const bookingId = (params.bookingId as string) || 'b1';

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash'>('upi');
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    
    await supabase.from('bookings').update({ 
      status: 'completed', 
      payment_status: 'paid', 
      payment_method: paymentMethod, 
      paid_at: new Date().toISOString() 
    }).eq('id', bookingId);
    
    setProcessing(false);
    
    router.replace({
      pathname: '/rating/[id]',
      params: { id: bookingId, workerName, price: price.toString() },
    } as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Service Payment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Service Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Summary</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Worker Charge</Text>
            <Text style={styles.val}>₹{price}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Platform Fee</Text>
            <Text style={styles.freeVal}>₹0 (Zero Fee)</Text>
          </View>

          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalVal}>₹{price}</Text>
          </View>
        </View>

        {/* 🌟 Direct Worker Payout Banner */}
        <View style={styles.directWorkerBanner}>
          <HeartHandshake size={24} color="#15803D" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.directWorkerTitle}>100% Direct Payout</Text>
            <Text style={styles.directWorkerSub}>
              ₹{price} goes directly to {workerName} without middleman cuts.
            </Text>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        <TouchableOpacity
          style={[styles.methodCard, paymentMethod === 'upi' && styles.methodCardActive]}
          onPress={() => setPaymentMethod('upi')}
        >
          <QrCode size={24} color={paymentMethod === 'upi' ? '#2563EB' : '#64748B'} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.methodTitle}>UPI (GPay / PhonePe / Paytm)</Text>
            <Text style={styles.methodSub}>Instant direct bank transfer</Text>
          </View>
          {paymentMethod === 'upi' && <CheckCircle2 size={20} color="#2563EB" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.methodCard, paymentMethod === 'cash' && styles.methodCardActive]}
          onPress={() => setPaymentMethod('cash')}
        >
          <Banknote size={24} color={paymentMethod === 'cash' ? '#16A34A' : '#64748B'} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.methodTitle}>Cash on Completion</Text>
            <Text style={styles.methodSub}>Hand cash directly to technician</Text>
          </View>
          {paymentMethod === 'cash' && <CheckCircle2 size={20} color="#16A34A" />}
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.payBtn} disabled={processing} onPress={handlePay}>
          {processing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.payBtnText}>
                {paymentMethod === 'upi' ? `Pay ₹${price} via UPI` : `Confirm Cash Payment ₹${price}`}
              </Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </>
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
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#475569',
  },
  val: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  freeVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2563EB',
  },
  directWorkerBanner: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  directWorkerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
  },
  directWorkerSub: {
    fontSize: 12,
    color: '#166534',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  methodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  methodSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  payBtn: {
    backgroundColor: '#16A34A',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
