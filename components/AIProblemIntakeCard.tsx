import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { Mic, Camera, Sparkles, ArrowRight, CheckCircle2, Volume2, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { analyzeProblemText } from '../services/ai';
import { AIAnalysisResult } from '../types';

const SpeechModule: any = requireOptionalNativeModule('ExpoSpeechRecognition');

interface AIProblemIntakeCardProps {
  onAnalysisComplete: (result: AIAnalysisResult, rawText: string, imageUri?: string) => void;
}

export const AIProblemIntakeCard: React.FC<AIProblemIntakeCardProps> = ({
  onAnalysisComplete,
}) => {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  const handleVoiceInput = async () => {
    if (SpeechModule) {
      try {
        const supported = await SpeechModule.isRecognitionAvailable();
        if (supported) {
          const { granted } = await SpeechModule.requestPermissionsAsync();
          if (granted) {
            setIsRecording(true);
            setText('');
            SpeechModule.start({
              lang: 'en-IN',
              interimResults: true,
              maxAlternatives: 1,
              continuous: false,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Native STT start error:', err);
      }
    }

    // Fallback to Voice Assistant Modal
    setShowVoiceModal(true);
  };

  const handleStopRecording = () => {
    try {
      SpeechModule?.stop();
    } catch (_) {}
    setIsRecording(false);
  };

  // Listen for STT results via useSpeechRecognitionEvent safely if available
  if (SpeechModule) {
    try {
      const speech = require('expo-speech-recognition');
      if (speech?.useSpeechRecognitionEvent) {
        speech.useSpeechRecognitionEvent('result', (event: any) => {
          const transcript = event.results[0]?.transcript || '';
          setText(transcript);
          if (event.isFinal && transcript.trim()) {
            setIsRecording(false);
            runAI(transcript, imageUri || undefined);
          }
        });

        speech.useSpeechRecognitionEvent('error', (event: any) => {
          console.warn('STT error:', event.error);
          setIsRecording(false);
        });

        speech.useSpeechRecognitionEvent('end', () => {
          setIsRecording(false);
        });
      }
    } catch (e) {}
  }

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Camera roll access is needed to upload photo of problem');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setImageUri(uri);
        runAI(text || 'Photo of damaged service fixture', uri);
      }
    } catch (err) {
      console.warn('Image picker error:', err);
    }
  };

  const runAI = async (inputStr: string, photoPath?: string) => {
    setLoading(true);
    try {
      const res = await analyzeProblemText(inputStr || 'General repair issue');
      setAnalysis(res);
    } catch (e) {
      console.warn('AI analysis error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceOptionSelect = (voicePrompt: string) => {
    setShowVoiceModal(false);
    setText(voicePrompt);
    runAI(voicePrompt, imageUri || undefined);
  };

  const handleTextSubmit = () => {
    if (!text.trim() && !imageUri) return;
    runAI(text, imageUri || undefined);
  };

  const handleProceed = () => {
    if (analysis) {
      onAnalysisComplete(analysis, text || analysis.problem_summary, imageUri || undefined);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.sparkleIcon}>
          <Sparkles size={20} color="#7C3AED" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Tell Us Your Problem 🎤 📷</Text>
          <Text style={styles.subtitle}>Speak, type or upload a photo of the defect</Text>
        </View>
      </View>

      {/* Input Box */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="e.g. 'My fan is making noise' or 'Bathroom tap leaking'"
          placeholderTextColor="#94A3B8"
          value={text}
          onChangeText={(val) => {
            setText(val);
            if (analysis) setAnalysis(null);
          }}
          multiline
          numberOfLines={2}
        />

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.iconBtn, isRecording && styles.recordingBtn]}
            onPress={isRecording ? handleStopRecording : handleVoiceInput}
          >
            {isRecording ? (
              <ActivityIndicator size="small" color="#DC2626" />
            ) : (
              <Mic size={20} color="#2563EB" />
            )}
            <Text style={[styles.iconBtnText, isRecording && { color: '#DC2626' }]}>
              {isRecording ? 'Listening...' : 'Voice'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={handlePickImage}>
            <Camera size={20} color="#0284C7" />
            <Text style={styles.iconBtnText}>Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.analyzeBtn, (!text.trim() && !imageUri) && styles.disabledBtn]}
            disabled={!text.trim() && !imageUri}
            onPress={handleTextSubmit}
          >
            <Text style={styles.analyzeBtnText}>Analyze</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Preview if selected */}
      {imageUri && (
        <View style={styles.imagePreviewContainer}>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
          <Text style={styles.imageTag}>Photo attached</Text>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#7C3AED" />
          <Text style={styles.loadingText}>AI is categorizing your issue...</Text>
        </View>
      )}

      {/* AI Analysis Result Card */}
      {analysis && !loading && (
        <View style={styles.resultBox}>
          <View style={styles.resultHeader}>
            <CheckCircle2 size={18} color="#16A34A" />
            <Text style={styles.resultTitle}>AI Recognized Problem:</Text>
            <View style={styles.confBadge}>
              <Text style={styles.confText}>{Math.round(analysis.confidence * 100)}% Match</Text>
            </View>
          </View>

          <Text style={styles.resultService}>
            Service: <Text style={styles.highlightText}>{analysis.service_name}</Text>
          </Text>

          <Text style={styles.resultProblem}>
            Problem: <Text style={styles.highlightText}>{analysis.problem_summary}</Text>
          </Text>

          <Text style={styles.resultUrgency}>
            Urgency:{' '}
            <Text
              style={{
                color: analysis.urgency === 'emergency' ? '#DC2626' : '#16A34A',
                fontWeight: '700',
              }}
            >
              {analysis.urgency.toUpperCase()}
            </Text>
          </Text>

          <TouchableOpacity style={styles.findWorkersBtn} onPress={handleProceed}>
            <Text style={styles.findWorkersBtnText}>Find {analysis.service_name} Workers</Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Voice Assistant Modal */}
      <Modal visible={showVoiceModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.voiceCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Volume2 size={22} color="#2563EB" />
                <Text style={styles.voiceTitle}>AI Voice Assistant 🎤</Text>
              </View>
              <TouchableOpacity onPress={() => setShowVoiceModal(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.voiceSub}>Tap your problem in Tamil, English or Hindi:</Text>

            <View style={styles.voiceChipsContainer}>
              {[
                { title: '🚰 Water Leakage in Tap / Pipe', sub: 'குழாய் தண்ணீர் கசிவு' },
                { title: '⚡ Electrical Tripping / Fan Issue', sub: 'மின்சார கோளாறு / ஃபேன் பழுது' },
                { title: '❄️ AC Not Cooling Properly', sub: 'ஏசி குளுமை அளிக்கவில்லை' },
                { title: '🚪 Main Door Lock Broken', sub: 'கதவு பூட்டு உடைந்திருக்கிறது' },
                { title: '🧹 Deep House / Bathroom Wash', sub: 'வீடு சுத்தம் செய்தல்' },
                { title: '🎨 Wall Painting & Touchup', sub: 'வீட்டு பெயிண்டிங்' },
              ].map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.voiceChip}
                  onPress={() => handleVoiceOptionSelect(opt.title)}
                >
                  <Text style={styles.chipTitleText}>{opt.title}</Text>
                  <Text style={styles.chipSubText}>{opt.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sparkleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  inputContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textInput: {
    fontSize: 14,
    color: '#1E293B',
    minHeight: 40,
    textAlignVertical: 'top',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  iconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 4,
  },
  recordingBtn: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  iconBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  analyzeBtn: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  disabledBtn: {
    backgroundColor: '#CBD5E1',
  },
  analyzeBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  previewImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  imageTag: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#581C87',
    marginLeft: 4,
    flex: 1,
  },
  confBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  resultService: {
    fontSize: 13,
    color: '#475569',
  },
  resultProblem: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  resultUrgency: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
  },
  highlightText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  findWorkersBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginTop: 10,
    gap: 6,
  },
  findWorkersBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  voiceCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  voiceTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  voiceSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  voiceChipsContainer: {
    gap: 10,
  },
  voiceChip: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  chipSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});
