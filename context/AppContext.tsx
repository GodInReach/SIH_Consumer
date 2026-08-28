import React, { createContext, useContext, useState, useEffect } from 'react';
import { Booking, UserProfile, UrgencyLevel } from '../types';
import { DEFAULT_LOCATION, DEFAULT_ADDRESS } from '../services/location';
import { supabase, safeStorage } from '../services/supabase';

export type SupportedLanguage = 'en' | 'ta' | 'hi';

export interface ProblemDraft {
  serviceId?: string;
  categoryName?: string;
  problemText: string;
  photoUri?: string;
  urgency: UrgencyLevel;
  tags: string[];
}

interface AppContextType {
  user: UserProfile | null;
  language: SupportedLanguage;
  problemDraft: ProblemDraft | null;
  activeBooking: Booking | null;
  savedLocations: Array<{ title: string; address: string; lat: number; lng: number }>;
  isLoading: boolean;
  isAuthenticated: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  setUser: (user: UserProfile | null) => void;
  setProblemDraft: (draft: ProblemDraft | null) => void;
  setActiveBooking: (booking: Booking | null) => void;
  addSavedLocation: (location: { title: string; address: string; lat: number; lng: number }) => void;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  logout: () => Promise<void>;
  t: (key: string) => string;
}

const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    welcome: 'What service do you need today?',
    emergency_title: 'EMERGENCY HELP',
    emergency_subtitle: 'Tap for rapid 5-min dispatch',
    tell_problem: 'Tell Us Your Problem',
    voice_photo_hint: 'Speak, type or upload a photo',
    services: 'Services',
    find_workers: 'Find Workers',
    book_worker: 'Book Worker',
    on_the_way: 'is on the way',
    confirm_booking: 'Confirm Booking',
    booking_confirmed: 'Booking Confirmed!',
    my_bookings: 'My Bookings',
    profile: 'Profile',
    workers: 'Workers',
    home: 'Home',
    electrician: 'Electrician',
    plumber: 'Plumber',
    tailor: 'Tailor',
    carpenter: 'Carpenter',
    cleaner: 'Cleaner',
    mechanic: 'Mechanic',
    ac_repair: 'AC Repair',
    computer_repair: 'Computer Repair',
    emergency: 'Emergency',
  },
  ta: {
    welcome: 'இன்று உங்களுக்கு என்ன சேவை வேண்டும்?',
    emergency_title: 'அவசர உதவி',
    emergency_subtitle: '5 நிமிடத்தில் சேவையைப் பெற அழுத்தவும்',
    tell_problem: 'உங்கள் பிரச்சனையைச் சொல்லுங்கள்',
    voice_photo_hint: 'பேசலாம், தட்டச்சு செய்யலாம் அல்லது புகைப்படம் பதிவேற்றலாம்',
    services: 'சேவைகள்',
    find_workers: 'பணியாளர்களைக் கண்டறியவும்',
    book_worker: 'பணியாளரை முன்பதிவு செய்',
    on_the_way: 'வந்து கொண்டு இருக்கிறார்',
    confirm_booking: 'முன்பதிவை உறுதிசெய்',
    booking_confirmed: 'முன்பதிவு உறுதிசெய்யப்பட்டது!',
    my_bookings: 'என் முன்பதிவுகள்',
    profile: 'சுயவிவரம்',
    workers: 'பணியாளர்கள்',
    home: 'முகப்பு',
    electrician: 'மின் பணியாளர்',
    plumber: 'குழாய் பணியாளர்',
    tailor: 'தையல்காரர்',
    carpenter: 'தச்சர்',
    cleaner: 'தூய்மைப் பணியாளர்',
    mechanic: 'மெக்கானிக்',
    ac_repair: 'ஏசி பழுது',
    computer_repair: 'கணினி பழுது',
    emergency: 'அவசரம்',
  },
  hi: {
    welcome: 'आज आपको किस सेवा की आवश्यकता है?',
    emergency_title: 'आपातकालीन सहायता',
    emergency_subtitle: '5 मिनट में तुरंत मदद पाएं',
    tell_problem: 'अपनी समस्या बताएं',
    voice_photo_hint: 'बोलें, टाइप करें या फोटो अपलोड करें',
    services: 'सेवाएं',
    find_workers: 'कारीगर ढूंढें',
    book_worker: 'कारीगर बुक करें',
    on_the_way: 'रास्ते में हैं',
    confirm_booking: 'बुकिंग की पुष्टि करें',
    booking_confirmed: 'बुकिंग की पुष्टि हो गई!',
    my_bookings: 'मेरी बुकिंग',
    profile: 'प्रोफाइल',
    workers: 'कारीगर',
    home: 'होम',
    electrician: 'इलेक्ट्रीशियन',
    plumber: 'प्लंबर',
    tailor: 'दर्जी',
    carpenter: 'बढ़ई',
    cleaner: 'सफाईकर्मी',
    mechanic: 'मैकेनिक',
    ac_repair: 'एसी मरम्मत',
    computer_repair: 'कंप्यूटर मरम्मत',
    emergency: 'आपातकालीन',
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [problemDraft, setProblemDraft] = useState<ProblemDraft | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedLocations, setSavedLocations] = useState([
    { title: 'Home', address: 'Anna Nagar West, Chennai', lat: 13.0827, lng: 80.2707 },
    { title: 'Work', address: 'T. Nagar, Chennai', lat: 13.0418, lng: 80.2341 }
  ]);

  useEffect(() => {
    safeStorage.getItem('@user_lang').then(lang => {
      if (lang && (lang === 'en' || lang === 'ta' || lang === 'hi')) {
        setLanguageState(lang as SupportedLanguage);
      }
    });

    const loadUserProfile = async (userId: string) => {
      const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', userId).single();
      if (data) {
        setUser(data as UserProfile);
      } else {
        const { data: userAuth } = await supabase.auth.getUser();
        const email = userAuth.user?.email;
        const newProfile = {
          id: userId, // Assuming id and user_id might match or using user_id for insert
          user_id: userId,
          email: email,
          name: 'New User',
          phone: '',
          photo_url: '',
          preferred_language: 'en',
          home_address: DEFAULT_ADDRESS,
          home_lat: DEFAULT_LOCATION.latitude,
          home_lng: DEFAULT_LOCATION.longitude
        };
        const { data: inserted, error: insertError } = await supabase.from('user_profiles').insert([newProfile]).select().single();
        if (inserted) {
          setUser(inserted as UserProfile);
        }
      }
      setIsLoading(false);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });
    
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        loadUserProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (user) {
      setUser({ ...user, preferred_language: lang } as any);
    }
    safeStorage.setItem('@user_lang', lang);
  };

  const addSavedLocation = (loc: { title: string; address: string; lat: number; lng: number }) => {
    setSavedLocations(prev => [...prev, loc]);
  };

  const updateBookingStatus = async (bookingId: string, status: Booking['status']) => {
    if (activeBooking && activeBooking.id === bookingId) {
      setActiveBooking({
        ...activeBooking,
        status,
        updated_at: new Date().toISOString()
      });
    }
    await supabase.from('bookings').update({ status }).eq('id', bookingId);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveBooking(null);
    setProblemDraft(null);
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        language,
        problemDraft,
        activeBooking,
        savedLocations,
        isLoading,
        isAuthenticated: !!user,
        setLanguage,
        setUser,
        setProblemDraft,
        setActiveBooking,
        addSavedLocation,
        updateBookingStatus,
        logout,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
