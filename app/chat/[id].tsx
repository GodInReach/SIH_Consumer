import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';

interface Message {
  id: string;
  text: string;
  sender_type: string;
  created_at: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, activeBooking } = useApp();
  
  const bookingId = params.id as string;
  const workerName = activeBooking?.worker?.name || activeBooking?.workers?.name || 'Worker';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!bookingId) return;

    // Load existing messages
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };

    loadMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`public:messages:booking_id=eq.${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !user || !bookingId) return;
    
    setInputText('');
    await supabase.from('messages').insert([{
      booking_id: bookingId,
      sender_type: 'customer',
      sender_id: user.id,
      text: text.trim(),
    }]);
  };

  const QUICK_REPLIES = ['When will you arrive?', 'Please hurry', 'I am home now', 'Call me please'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Chat with {workerName}</Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          style={styles.chatContainer} 
          ref={scrollViewRef}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => {
            const isMe = msg.sender_type === 'customer';
            return (
              <View key={msg.id} style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <Text style={[styles.messageText, isMe && { color: '#FFFFFF' }]}>{msg.text}</Text>
                <Text style={[styles.messageTime, isMe && { color: '#DBEAFE' }]}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Quick Replies */}
        <View style={styles.quickRepliesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {QUICK_REPLIES.map((reply, i) => (
              <TouchableOpacity key={i} style={styles.quickReplyBtn} onPress={() => sendMessage(reply)}>
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Input area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage(inputText)}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={() => sendMessage(inputText)}>
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 15,
    color: '#1E293B',
  },
  messageTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  quickRepliesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  quickReplyBtn: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickReplyText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 12,
  },
  sendBtn: {
    backgroundColor: '#2563EB',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
