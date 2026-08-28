import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  IndianRupee,
  Briefcase,
  CheckCircle,
  PhoneCall,
  MessageSquare,
  Award,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { fetchWorkerById, fetchReviewsForWorker } from '../../services/api';
import { Worker, Review } from '../../types';

export default function WorkerProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user, problemDraft } = useApp();

  const [worker, setWorker] = useState<Worker | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (id) {
        const w = await fetchWorkerById(id as string, user?.lat || 13.0827, user?.lng || 80.2707);
        setWorker(w);
        const r = await fetchReviewsForWorker(id as string);
        setReviews(r);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading || !worker) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </SafeAreaView>
    );
  }

  const handleBookNow = () => {
    router.push({
      pathname: '/booking/confirm',
      params: {
        workerId: worker.id,
        serviceId: worker.service_ids?.[0] || 'electrician',
        problem: problemDraft?.problemText || 'General repair service',
        price: worker.price_min,
        eta: `${worker.calculated_eta || 8} mins`,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Worker Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header Profile Section */}
        <View style={styles.headerCard}>
          <Image source={{ uri: worker.photo_url }} style={styles.avatar} />

          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>👷 {worker.name}</Text>
              {worker.verified && (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={14} color="#16A34A" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>

            <View style={styles.ratingRow}>
              <Star size={16} color="#EAB308" fill="#EAB308" />
              <Text style={styles.ratingValue}>{worker.rating.toFixed(1)}</Text>
              <Text style={styles.ratingSub}>
                • {worker.completed_jobs} Jobs Completed
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsBar}>
          <View style={styles.statBox}>
            <Clock size={18} color="#0284C7" />
            <Text style={styles.statVal}>
              {worker.calculated_eta || worker.response_time_mins} min
            </Text>
            <Text style={styles.statLbl}>Response ETA</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <Briefcase size={18} color="#7C3AED" />
            <Text style={styles.statVal}>{worker.experience}</Text>
            <Text style={styles.statLbl}>Experience</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statBox}>
            <IndianRupee size={18} color="#16A34A" />
            <Text style={styles.statVal}>
              ₹{worker.price_min}–₹{worker.price_max}
            </Text>
            <Text style={styles.statLbl}>Estimated Price</Text>
          </View>
        </View>

        {/* Guarantee Banner */}
        <View style={styles.guaranteeCard}>
          <Award size={22} color="#2563EB" />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.guaranteeTitle}>Service Guarantee</Text>
            <Text style={styles.guaranteeSub}>
              {worker.service_guarantee || '30-Day Money Back & Free Re-visit Guarantee'}
            </Text>
          </View>
        </View>

        {/* About Bio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Worker</Text>
          <Text style={styles.bioText}>{worker.about}</Text>
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Expertise</Text>
          <View style={styles.skillsGrid}>
            {worker.skills?.map((skill, idx) => (
              <View key={idx} style={styles.skillBadge}>
                <CheckCircle size={14} color="#2563EB" />
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Reviews ({reviews.length})</Text>
          {reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewName}>{r.customer_name || 'Customer'}</Text>
                <View style={styles.starsRow}>
                  <Star size={12} color="#EAB308" fill="#EAB308" />
                  <Text style={styles.reviewRating}>{r.rating}.0</Text>
                </View>
              </View>
              <Text style={styles.reviewText}>{r.review}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Footer Book Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.bookBtn} onPress={handleBookNow}>
          <Text style={styles.bookBtnText}>Book Worker Now • ₹{worker.price_min}</Text>
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
    paddingBottom: 40,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
  },
  nameSection: {
    marginLeft: 14,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
    marginLeft: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 4,
  },
  ratingSub: {
    fontSize: 13,
    color: '#64748B',
    marginLeft: 4,
  },
  statsBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBox: {
    alignItems: 'center',
  },
  statVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  statLbl: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  guaranteeCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  guaranteeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
  },
  guaranteeSub: {
    fontSize: 12,
    color: '#1E3A8A',
    marginTop: 2,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  bioText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  skillText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewRating: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  bookBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
