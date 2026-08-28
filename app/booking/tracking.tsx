import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  XCircle,
  Clock,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { MapViewComponent } from '../../components/MapViewComponent';
import { BookingStatusTracker } from '../../components/BookingStatusTracker';
import { BookingStatus } from '../../types';
import { supabase } from '../../services/supabase';

export default function BookingTrackingScreen() {
  const router = useRouter();
  const { activeBooking, setActiveBooking, user } = useApp();

  const worker = activeBooking?.worker || {
    id: 'w1',
    name: 'Worker',
    photo_url: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400',
    phone: '+91 98765 43210',
    rating: 4.8,
    lat: 13.0850,
    lng: 80.2720,
    price_min: 400,
  };

  const [status, setStatus] = useState<BookingStatus>(activeBooking?.status || 'pending');
  const [workerLat, setWorkerLat] = useState(worker.lat || 13.0850);
  const [workerLng, setWorkerLng] = useState(worker.lng || 80.2720);

  useEffect(() => {
    if (!activeBooking) return;

    // Realtime Booking Status
    const bookingChannel = supabase
      .channel(`public:bookings:id=eq.${activeBooking.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bookings',
          filter: `id=eq.${activeBooking.id}`,
        },
        (payload) => {
          setStatus(payload.new.status);
          setActiveBooking({ ...activeBooking, status: payload.new.status });
        }
      )
      .subscribe();

    // Poll worker locations every 15 seconds
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('worker_locations')
        .select('lat, lng')
        .eq('booking_id', activeBooking.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setWorkerLat(data.lat);
        setWorkerLng(data.lng);
      }
    }, 15000);

    return () => {
      supabase.removeChannel(bookingChannel);
      clearInterval(interval);
    };
  }, [activeBooking]);

  const handleCall = () => {
    Linking.openURL(`tel:${worker.phone}`);
  };

  const handleChat = () => {
    if (activeBooking) {
      router.push(
        `/chat/${activeBooking.id}` as any
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel Booking?',
      'Are you sure you want to cancel this booking request?',
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            if (activeBooking) {
              await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', activeBooking.id);
            }
            setActiveBooking(null);
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  const handleCompleteService = () => {
    router.push({
      pathname: '/booking/payment',
      params: {
        workerName: worker.name,
        price: activeBooking?.price || 400,
        bookingId: activeBooking?.id || 'b1',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(tabs)')}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.navTitle}>{worker.name} is on the way</Text>
          <Text style={styles.navSub}>Tracking ETA & Technician GPS</Text>
        </View>
        <View style={styles.etaBadge}>
          <Clock size={14} color="#0284C7" />
          <Text style={styles.etaText}>{activeBooking?.eta || 'ETA 7 min'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Interactive GPS Map */}
        <MapViewComponent
          userLat={user?.lat || 13.0827}
          userLng={user?.lng || 80.2707}
          workerLat={workerLat}
          workerLng={workerLng}
          workerName={worker.name}
        />

        {/* Worker Contact Card */}
        <View style={styles.workerCard}>
          <View style={styles.workerRow}>
            <Image source={{ uri: worker.photo_url }} style={styles.avatar} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.workerName}>👷 {worker.name}</Text>
                <ShieldCheck size={14} color="#16A34A" />
              </View>
              <Text style={styles.workerMeta}>⭐ {worker.rating} • Verified Technician</Text>
            </View>
          </View>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={styles.callBtn} onPress={handleCall}>
              <Phone size={16} color="#FFFFFF" />
              <Text style={styles.callBtnText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
              <MessageSquare size={16} color="#2563EB" />
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <XCircle size={16} color="#DC2626" />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Status Step Tracker */}
        <BookingStatusTracker currentStatus={status} workerName={worker.name} eta={activeBooking?.eta} />

        {/* Complete & Pay Action if job finished */}
        {status === 'completed' && (
          <TouchableOpacity style={styles.completePayBtn} onPress={handleCompleteService}>
            <CheckCircle size={20} color="#FFFFFF" />
            <Text style={styles.completePayBtnText}>Job Completed • Proceed to Pay</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  navSub: {
    fontSize: 12,
    color: '#64748B',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0369A1',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  workerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  callBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 6,
  },
  chatBtnText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 6,
  },
  cancelBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  completePayBtn: {
    backgroundColor: '#16A34A',
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 16,
  },
  completePayBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
