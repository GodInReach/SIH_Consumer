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
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, MapPin, Star, IndianRupee, Zap, ShieldCheck } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { fetchWorkers } from '../../services/api';
import { WorkerCard } from '../../components/WorkerCard';
import { Worker, FilterOptions } from '../../types';

export default function WorkersTab() {
  const router = useRouter();
  const { user } = useApp();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'price' | 'eta'>('rating');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const list = await fetchWorkers(user?.lat || 13.0827, user?.lng || 80.2707, { sort_by: sortBy });
      setWorkers(list);
      setLoading(false);
    }
    load();
  }, [sortBy]);

  const filtered = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.skills?.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Verified Workers</Text>
        <Text style={styles.headerSub}>Find electricians, plumbers, tailors & carpenters near you</Text>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workers by name or skill..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter bar */}
      <View style={styles.filterRow}>
        {[
          { id: 'rating', label: '⭐ Rating' },
          { id: 'distance', label: '📍 Distance' },
          { id: 'price', label: '💰 Price' },
          { id: 'eta', label: '⚡ Fastest ETA' },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.filterChip, sortBy === item.id && styles.filterChipActive]}
            onPress={() => setSortBy(item.id as any)}
          >
            <Text style={[styles.filterText, sortBy === item.id && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <WorkerCard
              worker={item}
              onPress={() => router.push(`/workers/${item.id}`)}
              onBookDirect={() =>
                router.push({
                  pathname: '/booking/confirm',
                  params: {
                    workerId: item.id,
                    serviceId: item.service_ids?.[0] || 'electrician',
                    problem: 'General home service',
                    price: item.price_min,
                  },
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterText: {
    fontSize: 12,
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
