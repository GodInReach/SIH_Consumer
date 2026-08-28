import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, ShieldCheck, MapPin, Clock, IndianRupee } from 'lucide-react-native';
import { Worker } from '../types';

interface WorkerCardProps {
  worker: Worker;
  onPress: () => void;
  onBookDirect?: () => void;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({
  worker,
  onPress,
  onBookDirect,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={onPress}
    >
      <View style={styles.headerRow}>
        {worker.photo_url ? (
          <Image source={{ uri: worker.photo_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>{(worker.name || 'W').charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              👷 {worker.name}
            </Text>
            {worker.verified && (
              <View style={styles.verifiedBadge}>
                <ShieldCheck size={14} color="#16A34A" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.ratingBox}>
              <Star size={14} color="#EAB308" fill="#EAB308" />
              <Text style={styles.ratingText}>{worker.rating.toFixed(1)}</Text>
              <Text style={styles.jobsText}>({worker.completed_jobs} jobs)</Text>
            </View>
            <View style={styles.expBadge}>
              <Text style={styles.expText}>{worker.experience}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MapPin size={14} color="#64748B" />
          <Text style={styles.metaText}>{worker.distance_km || 0.8} km</Text>
        </View>

        <View style={styles.metaItem}>
          <Clock size={14} color="#0284C7" />
          <Text style={[styles.metaText, { color: '#0284C7', fontWeight: '600' }]}>
            {worker.calculated_eta || worker.response_time_mins || 8} min away
          </Text>
        </View>

        <View style={styles.metaItem}>
          <IndianRupee size={14} color="#16A34A" />
          <Text style={[styles.metaText, { color: '#16A34A', fontWeight: '700' }]}>
            ₹{worker.price_min}–₹{worker.price_max}
          </Text>
        </View>
      </View>

      {worker.skills && worker.skills.length > 0 && (
        <View style={styles.skillsRow}>
          {worker.skills.slice(0, 3).map((skill, idx) => (
            <View key={idx} style={styles.skillChip}>
              <Text style={styles.skillText}>{skill}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.profileBtn} onPress={onPress}>
          <Text style={styles.profileBtnText}>View Profile</Text>
        </TouchableOpacity>

        {onBookDirect && (
          <TouchableOpacity style={styles.bookBtn} onPress={onBookDirect}>
            <Text style={styles.bookBtnText}>Book Worker</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
  },
  avatarBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginLeft: 4,
  },
  jobsText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  expBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 10,
  },
  expText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    marginTop: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    marginLeft: 4,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  skillChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  skillText: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
    gap: 10,
  },
  profileBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  profileBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  bookBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  bookBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
