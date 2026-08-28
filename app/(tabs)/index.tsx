import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MapPin,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Star,
  Clock,
  ShieldAlert,
} from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { ServiceCard } from '../../components/ServiceCard';
import { AIProblemIntakeCard } from '../../components/AIProblemIntakeCard';
import { fetchServices, fetchWorkers } from '../../services/api';
import { Service, Worker, AIAnalysisResult } from '../../types';

export default function HomeScreen() {
  const router = useRouter();
  const { user, activeBooking, setProblemDraft, t } = useApp();
  const [services, setServices] = useState<Service[]>([]);
  const [trustedWorkers, setTrustedWorkers] = useState<Worker[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const serviceList = await fetchServices();
    setServices(serviceList);
    const workerList = await fetchWorkers(user?.lat || 13.0827, user?.lng || 80.2707, { sort_by: 'rating' });
    setTrustedWorkers(workerList.slice(0, 5));
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSelectService = (service: Service) => {
    setProblemDraft({
      serviceId: service.id,
      categoryName: service.name,
      problemText: `Need ${service.name} service`,
      urgency: 'normal',
      tags: [service.category],
    });
    router.push({
      pathname: '/request',
      params: { serviceId: service.id, serviceName: service.name },
    });
  };

  const handleAIComplete = (result: AIAnalysisResult, rawText: string, imageUri?: string) => {
    setProblemDraft({
      serviceId: result.recommended_service_id,
      categoryName: result.service_name,
      problemText: rawText || result.problem_summary,
      photoUri: imageUri,
      urgency: result.urgency,
      tags: result.suggested_tags,
    });

    if (result.urgency === 'emergency') {
      router.push('/emergency');
    } else {
      router.push({
        pathname: '/workers',
        params: { serviceId: result.recommended_service_id, problem: rawText || result.problem_summary },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Location Bar with 🚨 Red Shield SOS Button */}
      <View style={styles.topHeader}>
        <View style={styles.locationContainer}>
          <MapPin size={20} color="#2563EB" />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationSub}>{t('delivering_to')}</Text>
            <TouchableOpacity style={styles.locationSelectorRow} activeOpacity={0.7}>
              <Text style={styles.locationTitle} numberOfLines={1}>
                {user?.address || user?.home_address || 'Anna Nagar West, Chennai'}
              </Text>
              <ChevronDown size={16} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* 🚨 Red SOS Shield Icon Button on Top Bar */}
          <TouchableOpacity
            style={styles.sosIconButton}
            activeOpacity={0.8}
            onPress={() => router.push('/emergency')}
          >
            <ShieldAlert size={22} color="#FFFFFF" />
            <Text style={styles.sosBtnText}>{t('sos')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Active Booking Tracker Banner */}
        {activeBooking && (
          <TouchableOpacity
            style={styles.activeTrackerBanner}
            activeOpacity={0.9}
            onPress={() => router.push('/booking/tracking')}
          >
            <View style={styles.activeTrackerIcon}>
              <Clock size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.activeTrackerTitle}>
                {activeBooking?.worker?.name || t('worker')} {t('on_the_way')} 🛵
              </Text>
              <Text style={styles.activeTrackerSub}>
                {t('status')}: {activeBooking.status.replace('_', ' ').toUpperCase()} • {activeBooking?.eta || t('on_the_way')}
              </Text>
            </View>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* 🎤 AI Problem Intake */}
        <AIProblemIntakeCard onAnalysisComplete={handleAIComplete} />

        {/* Services Grid Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('what_do_you_need')}</Text>
        </View>

        <View style={styles.servicesGrid}>
          {services.map((srv) => (
            <ServiceCard
              key={srv.id}
              id={srv.id}
              name={t(srv.id) !== srv.id ? t(srv.id) : srv.name}
              iconName={srv.icon}
              onPress={() => handleSelectService(srv)}
            />
          ))}
        </View>

        {/* Trusted Nearby Workers Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('top_rated_workers')}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/workers')}>
            <Text style={styles.seeAllText}>{t('see_all')}</Text>
          </TouchableOpacity>
        </View>

        {trustedWorkers.map((w) => (
          <TouchableOpacity
            key={w.id}
            style={styles.trustedWorkerCard}
            activeOpacity={0.88}
            onPress={() => router.push(`/workers/${w.id}`)}
          >
            {w.photo_url ? (
              <Image source={{ uri: w.photo_url }} style={styles.trustedAvatar} />
            ) : (
              <View style={styles.avatarLetterBadge}>
                <Text style={styles.avatarLetterText}>{(w.name || 'W').charAt(0).toUpperCase()}</Text>
              </View>
            )}

            <View style={styles.trustedInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.trustedName}>👷 {w.name}</Text>
                <ShieldCheck size={14} color="#16A34A" />
              </View>
              <View style={styles.trustedStats}>
                <Star size={12} color="#EAB308" fill="#EAB308" />
                <Text style={styles.trustedRatingText}>{w.rating || 4.8}</Text>
                <Text style={styles.trustedMeta}>
                  • {w.category || 'Specialist'} • ₹{w.price_min || 300}–₹{w.price_max || 800}
                </Text>
              </View>
            </View>

            <View style={styles.bookAgainBadge}>
              <Text style={styles.bookAgainText}>{t('book')}</Text>
            </View>
          </TouchableOpacity>
        ))}
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
  topHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  locationSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  locationSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginRight: 4,
    maxWidth: '85%',
  },
  sosIconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sosBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  activeTrackerBanner: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  activeTrackerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTrackerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  activeTrackerSub: {
    color: '#DBEAFE',
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563EB',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trustedWorkerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  trustedAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  avatarLetterBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetterText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  trustedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  trustedName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  trustedStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  trustedRatingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 4,
  },
  trustedMeta: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  bookAgainBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  bookAgainText: {
    color: '#2563EB',
    fontSize: 13,
    fontWeight: '700',
  },
});
