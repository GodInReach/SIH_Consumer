import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Star,
  Camera,
  ArrowRight,
  PartyPopper,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';

export default function RatingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, activeBooking, setActiveBooking } = useApp();

  const workerName = (params.workerName as string) || activeBooking?.worker?.name || activeBooking?.workers?.name || 'Worker';
  const bookingId = (params.id as string) || activeBooking?.id;
  const workerId = activeBooking?.worker_id || activeBooking?.worker?.id;

  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'On time',
    'Good work',
    'Fair price',
    'Polite',
  ]);
  const [reviewText, setReviewText] = useState('');
  const [completedPhotoUri, setCompletedPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handlePickPhoto = async () => {
    try {
      const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!res.granted) return;

      const img = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!img.canceled && img.assets.length > 0) {
        setCompletedPhotoUri(img.assets[0].uri);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !bookingId || !workerId) {
      setActiveBooking(null);
      router.replace('/(tabs)');
      return;
    }

    setSubmitting(true);
    try {
      // Save review to Supabase
      await supabase.from('reviews').insert([
        {
          booking_id: bookingId,
          customer_id: user.id,
          worker_id: workerId,
          rating: rating,
          review: reviewText || 'Excellent doorstep service!',
          tags: selectedTags,
        },
      ]);
      
      setActiveBooking(null);
      Alert.alert('Thank You! 🎉', 'Your feedback helps build trust in local workers.');
      router.replace('/(tabs)');
    } catch (err) {
      console.warn('Rating save error:', err);
      Alert.alert('Error', 'Could not submit review at this time.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.celebrationIcon}>
          <PartyPopper size={40} color="#7C3AED" />
        </View>

        <Text style={styles.title}>How was your service?</Text>
        <Text style={styles.subtitle}>Rate your experience with {workerName}</Text>

        {/* 5-Star Rating Control */}
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((starNum) => (
            <TouchableOpacity
              key={starNum}
              style={styles.starTouchable}
              onPress={() => setRating(starNum)}
            >
              <Star
                size={38}
                color={starNum <= rating ? '#EAB308' : '#CBD5E1'}
                fill={starNum <= rating ? '#EAB308' : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingLabelText}>
          {rating === 5
            ? '⭐⭐⭐⭐⭐ Outstanding Work!'
            : rating === 4
            ? '⭐⭐⭐⭐ Great Service'
            : rating === 3
            ? '⭐⭐⭐ Average'
            : 'Poor Service'}
        </Text>

        {/* Quick Feedback Chips */}
        <Text style={styles.sectionLabel}>Was the worker:</Text>
        <View style={styles.tagsGrid}>
          {['On time', 'Good work', 'Fair price', 'Polite', 'Cleaned up', 'Expert tools'].map(
            (tag) => {
              const isSel = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  style={[styles.tagChip, isSel && styles.tagChipActive]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[styles.tagText, isSel && styles.tagTextActive]}>
                    {isSel ? '☑ ' : '☐ '} {tag}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        {/* Optional Review Text */}
        <Text style={styles.sectionLabel}>Write a comment (optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="Share your experience to help future customers..."
          placeholderTextColor="#94A3B8"
          value={reviewText}
          onChangeText={setReviewText}
          multiline
          numberOfLines={3}
        />

        {/* Upload Completed Work Photo */}
        <Text style={styles.sectionLabel}>Upload photo of completed work (optional)</Text>
        <TouchableOpacity style={styles.uploadPhotoBtn} onPress={handlePickPhoto}>
          <Camera size={20} color="#0284C7" />
          <Text style={styles.uploadPhotoText}>
            {completedPhotoUri ? 'Photo Attached (Tap to change)' : 'Attach Before/After Photo'}
          </Text>
        </TouchableOpacity>

        {completedPhotoUri && (
          <Image source={{ uri: completedPhotoUri }} style={styles.attachedImagePreview} />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitBtn}
          disabled={submitting}
          onPress={handleSubmitReview}
        >
          <Text style={styles.submitBtnText}>Submit Feedback</Text>
          <ArrowRight size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  celebrationIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    marginTop: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  starTouchable: {
    padding: 4,
  },
  ratingLabelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    alignSelf: 'flex-start',
    marginBottom: 10,
    marginTop: 10,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tagChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  tagTextActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
  textInput: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: 14,
    color: '#0F172A',
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  uploadPhotoBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 8,
    marginBottom: 12,
  },
  uploadPhotoText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },
  attachedImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 16,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    width: '100%',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
