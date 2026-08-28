import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, Filter, Star, MapPin, IndianRupee, Zap, Check } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { fetchWorkers } from '../../services/api';
import { WorkerCard } from '../../components/WorkerCard';
import { Worker, FilterOptions } from '../../types';

export default function WorkerResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, problemDraft, setProblemDraft, setActiveBooking } = useApp();

  const serviceId = (params.serviceId as string) || problemDraft?.serviceId;
  const initialProblem = (params.problem as string) || problemDraft?.problemText || 'Home service repair';

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState<'distance' | 'rating' | 'price' | 'eta'>('distance');
  const [availableOnly, setAvailableOnly] = useState(false);

  const loadWorkers = async (sort: 'distance' | 'rating' | 'price' | 'eta') => {
    setLoading(true);
    const options: FilterOptions = {
      service_id: serviceId,
      sort_by: sort,
      available_only: availableOnly,
    };
    const list = await fetchWorkers(user?.lat || 13.0827, user?.lng || 80.2707, options);
    setWorkers(list);
    setLoading(false);
  };

  useEffect(() => {
    loadWorkers(activeSort);
  }, [serviceId, activeSort, availableOnly]);

  const handleSortChange = (sort: 'distance' | 'rating' | 'price' | 'eta') => {
    setActiveSort(sort);
  };

  const handleBookWorker = (worker: Worker) => {
    router.push({
      pathname: '/booking/confirm',
      params: {
        workerId: worker.id,
        serviceId: serviceId || worker.service_ids?.[0] || 'electrician',
        problem: initialProblem,
        price: worker.price_min,
        eta: `${worker.calculated_eta || 8} mins`,
      },
    });
  };

  const filteredWorkers = workers.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Select Worker</Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            Problem: {initialProblem}
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by worker name or skill..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View style={styles.filterBarContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { id: 'distance', label: '📍 Nearest', icon: MapPin },
            { id: 'rating', label: '⭐ Highest Rated', icon: Star },
            { id: 'price', label: '💰 Lowest Price', icon: IndianRupee },
            { id: 'eta', label: '⚡ Fastest ETA', icon: Zap },
          ]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSel = activeSort === item.id;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isSel && styles.filterChipActive]}
                onPress={() => handleSortChange(item.id as any)}
              >
                <Text style={[styles.filterText, isSel && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Workers List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Fetching available technicians...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <WorkerCard
              worker={item}
              onPress={() => router.push(`/workers/${item.id}`)}
              onBookDirect={() => handleBookWorker(item)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>No workers match your filter</Text>
              <Text style={styles.emptySub}>
                Try resetting filters or searching for another keyword
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  filterBarContainer: {
    marginBottom: 8,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
});
