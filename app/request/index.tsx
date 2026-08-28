import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Mic,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useApp } from '../../context/AppContext';
import { analyzeProblemText } from '../../services/ai';
import { UrgencyLevel } from '../../types';

export default function ProblemRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { setProblemDraft } = useApp();

  const serviceName = (params.serviceName as string) || 'Electrician';
  const serviceId = (params.serviceId as string) || 'electrician';

  const [problemText, setProblemText] = useState('My fan is making loud noise and not spinning at full speed.');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [urgency, setUrgency] = useState<UrgencyLevel>('normal');
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  const handleVoicePress = () => {
    setIsVoiceRecording(true);
    setTimeout(() => {
      setIsVoiceRecording(false);
      setProblemText('Ceiling fan regulator switch is broken and fan stopped completely');
    }, 1800);
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
        setPhotoUri(img.assets[0].uri);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleFindWorkers = () => {
    setProblemDraft({
      serviceId,
      categoryName: serviceName,
      problemText,
      photoUri: photoUri || undefined,
      urgency,
      tags: [serviceName],
    });

    if (urgency === 'emergency') {
      router.push('/emergency');
    } else {
      router.push({
        pathname: '/workers',
        params: { serviceId, problem: problemText },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Describe Problem</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Selected Service Badge */}
        <View style={styles.serviceBadge}>
          <Text style={styles.serviceBadgeText}>Service: {serviceName}</Text>
        </View>

        <Text style={styles.heading}>What is the problem?</Text>
        <Text style={styles.subheading}>
          Describe the issue, speak by voice, or attach a photo
        </Text>

        {/* Input Box */}
        <View style={styles.inputCard}>
          <TextInput
            style={styles.textInput}
            value={problemText}
            onChangeText={setProblemText}
            placeholder="Type your issue here..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
          />

          <View style={styles.inputActions}>
            <TouchableOpacity
              style={[styles.mediaBtn, isVoiceRecording && styles.mediaBtnActive]}
              onPress={handleVoicePress}
            >
              <Mic size={18} color={isVoiceRecording ? '#DC2626' : '#2563EB'} />
              <Text
                style={[
                  styles.mediaBtnText,
                  isVoiceRecording && { color: '#DC2626' },
                ]}
              >
                {isVoiceRecording ? 'Recording...' : 'Speak Problem'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaBtn} onPress={handlePickPhoto}>
              <Camera size={18} color="#0284C7" />
              <Text style={styles.mediaBtnText}>Upload Photo</Text>
            </TouchableOpacity>
          </View>

          {photoUri && (
            <View style={styles.photoContainer}>
              <Image source={{ uri: photoUri }} style={styles.attachedImage} />
              <Text style={styles.attachedText}>Photo Attached</Text>
            </View>
          )}
        </View>

        {/* Urgency Selector */}
        <Text style={styles.sectionLabel}>Urgency Level</Text>
        <View style={styles.urgencyRow}>
          <TouchableOpacity
            style={[
              styles.urgencyChip,
              urgency === 'normal' && styles.urgencyChipActiveNormal,
            ]}
            onPress={() => setUrgency('normal')}
          >
            <CheckCircle2
              size={18}
              color={urgency === 'normal' ? '#16A34A' : '#64748B'}
            />
            <Text
              style={[
                styles.urgencyText,
                urgency === 'normal' && styles.urgencyTextActive,
              ]}
            >
              Normal Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.urgencyChip,
              urgency === 'emergency' && styles.urgencyChipActiveEmergency,
            ]}
            onPress={() => setUrgency('emergency')}
          >
            <AlertTriangle
              size={18}
              color={urgency === 'emergency' ? '#DC2626' : '#64748B'}
            />
            <Text
              style={[
                styles.urgencyText,
                urgency === 'emergency' && styles.urgencyTextActiveEmergency,
              ]}
            >
              🚨 Emergency
            </Text>
          </TouchableOpacity>
        </View>

        {/* AI Summary Box */}
        <View style={styles.aiSummaryCard}>
          <View style={styles.aiSummaryHeader}>
            <Sparkles size={18} color="#7C3AED" />
            <Text style={styles.aiSummaryTitle}>Booking Summary Preview</Text>
          </View>
          <Text style={styles.summaryItem}>
            • <Text style={styles.bold}>Service:</Text> {serviceName}
          </Text>
          <Text style={styles.summaryItem}>
            • <Text style={styles.bold}>Problem:</Text> {problemText || 'Standard Repair'}
          </Text>
          <Text style={styles.summaryItem}>
            • <Text style={styles.bold}>Urgency:</Text>{' '}
            <Text
              style={{
                color: urgency === 'emergency' ? '#DC2626' : '#16A34A',
                fontWeight: '700',
              }}
            >
              {urgency.toUpperCase()}
            </Text>
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleFindWorkers}>
          <Text style={styles.primaryBtnText}>Find {serviceName} Workers</Text>
          <ArrowRight size={20} color="#FFFFFF" />
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
    padding: 20,
  },
  serviceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  serviceBadgeText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 13,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  subheading: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginBottom: 20,
  },
  textInput: {
    fontSize: 15,
    color: '#0F172A',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  mediaBtnActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  mediaBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  attachedImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  attachedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 10,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  urgencyChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  urgencyChipActiveNormal: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  urgencyChipActiveEmergency: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  urgencyTextActive: {
    color: '#15803D',
    fontWeight: '700',
  },
  urgencyTextActiveEmergency: {
    color: '#DC2626',
    fontWeight: '700',
  },
  aiSummaryCard: {
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  aiSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B21A8',
  },
  summaryItem: {
    fontSize: 13,
    color: '#475569',
    marginTop: 3,
  },
  bold: {
    fontWeight: '700',
    color: '#1E293B',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
