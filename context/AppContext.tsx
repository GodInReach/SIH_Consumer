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
    delivering_to: 'DELIVERING SERVICE TO',
    emergency_title: 'EMERGENCY HELP',
    emergency_subtitle: 'Tap for rapid 5-min dispatch',
    tell_problem: 'Tell Us Your Problem 🎤 📷',
    tell_problem_sub: 'Speak, type or upload a photo of the defect',
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
    what_do_you_need: 'What do you need?',
    top_rated_workers: '⭐ Top Rated Nearby Workers',
    see_all: 'See All',
    book: 'Book',
    sos: 'SOS',
    active_booking_in_progress: 'ACTIVE BOOKING IN PROGRESS',
    track_live_map: 'Track Live Map',
    past_history: 'Past Service History',
    no_past_services: 'No past services yet',
    book_technician_sub: 'Book a technician to get started!',
    book_again: 'Book Again',
    completed: 'Completed',
    worker: 'Worker',
    all_verified_workers: 'All Verified Workers',
    all_workers_sub: 'Find electricians, plumbers, tailors & carpenters near you',
    search_workers_placeholder: 'Search workers by name or skill...',
    rating: '⭐ Rating',
    distance: '📍 Distance',
    price: '💰 Price',
    fastest_eta: '⚡ Fastest ETA',
    saved_locations: '📍 Saved Locations',
    add_new: 'Add New',
    language_section: '🌐 Language / மொழி',
    activity_and_settings: 'My Activity & Settings',
    service_history: 'Service History & Bookings',
    favorite_workers: 'Favorite Workers',
    notifications: 'Notifications',
    help_support: 'Help & Customer Support',
    privacy_policy: 'Privacy Policy',
    logout: 'Log Out',
    describe_problem_placeholder: "e.g. 'My fan is making noise' or 'Bathroom tap leaking'",
    listening: 'Listening...',
    voice: 'Voice',
    photo: 'Photo',
    analyze: 'Analyze',
    ai_recognizing: 'AI is categorizing your issue...',
    status: 'Status',
  },
  ta: {
    welcome: 'இன்று உங்களுக்கு என்ன சேவை வேண்டும்?',
    delivering_to: 'சேவை வழங்கும் இடம்',
    emergency_title: 'அவசர உதவி',
    emergency_subtitle: '5 நிமிடத்தில் சேவையைப் பெற அழுத்தவும்',
    tell_problem: 'உங்கள் பிரச்சனையைச் சொல்லுங்கள் 🎤 📷',
    tell_problem_sub: 'பேசலாம், தட்டச்சு செய்யலாம் அல்லது புகைப்படம் பதிவேற்றலாம்',
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
    what_do_you_need: 'உங்களுக்கு என்ன சேவை வேண்டும்?',
    top_rated_workers: '⭐ சிறந்த அருகிலுள்ள பணியாளர்கள்',
    see_all: 'அனைத்தையும் பார்',
    book: 'முன்பதிவு',
    sos: 'அவசரம்',
    active_booking_in_progress: 'நடப்பில் உள்ள முன்பதிவு',
    track_live_map: 'நேரலை வரைபடம்',
    past_history: 'கடந்த கால சேவைகள்',
    no_past_services: 'கடந்த கால சேவைகள் எதுவுமில்லை',
    book_technician_sub: 'தொடங்க ஒரு பணியாளரை முன்பதிவு செய்யுங்கள்!',
    book_again: 'மீண்டும் முன்பதிவு செய்',
    completed: 'நிறைவடைந்தது',
    worker: 'பணியாளர்',
    all_verified_workers: 'சரிபார்க்கப்பட்ட பணியாளர்கள்',
    all_workers_sub: 'மின் பணியாளர்கள், குழாய் பணியாளர்கள், தச்சர்களைக் கண்டறியவும்',
    search_workers_placeholder: 'பெயர் அல்லது திறமை மூலம் தேடவும்...',
    rating: '⭐ மதிப்பீடு',
    distance: '📍 தொலைவு',
    price: '💰 விலை',
    fastest_eta: '⚡ வேகமான சேவை',
    saved_locations: '📍 சேமிக்கப்பட்ட இடங்கள்',
    add_new: 'புதிதாக சேர்',
    language_section: '🌐 மொழி / Language',
    activity_and_settings: 'என் செயல்பாடுகள் & அமைப்புகள்',
    service_history: 'சேவை வரலாறு & முன்பதிவுகள்',
    favorite_workers: 'விருப்பமான பணியாளர்கள்',
    notifications: 'அறிவிப்புகள்',
    help_support: 'உதவி & வாடிக்கையாளர் ஆதரவு',
    privacy_policy: 'தனியுரிமைக் கொள்கை',
    logout: 'வெளியேறு',
    describe_problem_placeholder: "எ.கா. 'ஃபேன் சத்தம் போடுகிறது' அல்லது 'குழாயில் தண்ணீர் கசிகிறது'",
    listening: 'கேட்கிறது...',
    voice: 'குரல்',
    photo: 'படம்',
    analyze: 'ஆராய்க',
    ai_recognizing: 'AI உங்கள் பிரச்சனையை வகைப்படுத்துகிறது...',
    status: 'நிலை',
  },
  hi: {
    welcome: 'आज आपको किस सेवा की आवश्यकता है?',
    delivering_to: 'सेवा का स्थान',
    emergency_title: 'आपातकालीन सहायता',
    emergency_subtitle: '5 मिनट में तुरंत मदद पाएं',
    tell_problem: 'अपनी समस्या बताएं 🎤 📷',
    tell_problem_sub: 'बोलें, टाइप करें या फोटो अपलोड करें',
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
    what_do_you_need: 'आपको क्या चाहिए?',
    top_rated_workers: '⭐ टॉप रेटेड नजदीकी कारीगर',
    see_all: 'सभी देखें',
    book: 'बुक करें',
    sos: 'आपातकालीन',
    active_booking_in_progress: 'सक्रिय बुकिंग जारी है',
    track_live_map: 'लाइव ट्रैक करें',
    past_history: 'पुराना सेवा इतिहास',
    no_past_services: 'कोई पुरानी सेवाएं नहीं हैं',
    book_technician_sub: 'शुरू करने के लिए एक कारीगर बुक करें!',
    book_again: 'दोबारा बुक करें',
    completed: 'पूरा हुआ',
    worker: 'कारीगर',
    all_verified_workers: 'सभी सत्यापित कारीगर',
    all_workers_sub: 'अपने पास इलेक्ट्रीशियन, प्लंबर, बढ़ई ढूंढें',
    search_workers_placeholder: 'नाम या कौशल से खोजें...',
    rating: '⭐ रेटिंग',
    distance: '📍 दूरी',
    price: '💰 कीमत',
    fastest_eta: '⚡ सबसे तेज पहुंचे',
    saved_locations: '📍 सहेजे गए स्थान',
    add_new: 'नया जोड़ें',
    language_section: '🌐 भाषा / Language',
    activity_and_settings: 'मेरी गतिविधि और सेटिंग्स',
    service_history: 'सेवा इतिहास और बुकिंग',
    favorite_workers: 'पसंदीदा कारीगर',
    notifications: 'सूचनाएं',
    help_support: 'सहायता और ग्राहक सहायता',
    privacy_policy: 'गोपनीयता नीति',
    logout: 'लॉग आउट',
    describe_problem_placeholder: "जैसे 'पंखा आवाज कर रहा है' या 'नल लीक हो रहा है'",
    listening: 'सुन रहा है...',
    voice: 'आवाज',
    photo: 'फोटो',
    analyze: 'विश्लेषण करें',
    ai_recognizing: 'AI आपकी समस्या को समझ रहा है...',
    status: 'स्थिति',
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [language, setLanguageState] = useState<SupportedLanguage>('en');
  const [problemDraft, setProblemDraft] = useState<ProblemDraft | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savedLocations, setSavedLocations] = useState([
    { title: 'Home', address: 'Anna Nagar West, Chennai', lat: 13.0827, lng: 80.2707 },
    { title: 'Work', address: 'T. Nagar, Chennai', lat: 13.0418, lng: 80.2341 }
  ]);

  // On mount: restore user from storage using persisted user ID
  useEffect(() => {
    const initUser = async () => {
      try {
        // Restore language preference
        const savedLang = await safeStorage.getItem('@user_lang');
        if (savedLang && (savedLang === 'en' || savedLang === 'ta' || savedLang === 'hi')) {
          setLanguageState(savedLang as SupportedLanguage);
        }

        // Restore logged-in user from persisted user ID
        const storedUserId = await safeStorage.getItem('@user_profile_id');
        if (!storedUserId) {
          setIsLoading(false);
          return;
        }

        // Fetch fresh profile from DB
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', storedUserId)
          .single();

        if (data) {
          setUserState(data as UserProfile);
        } else {
          // Profile not found — clear stale storage
          await safeStorage.removeItem('@user_profile_id');
        }
      } catch (e) {
        console.warn('AppContext init error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, []);

  const setUser = async (userData: UserProfile | null) => {
    setUserState(userData);
    if (userData?.id) {
      await safeStorage.setItem('@user_profile_id', userData.id);
    } else {
      await safeStorage.removeItem('@user_profile_id');
    }
  };

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (user) {
      setUserState({ ...user, preferred_language: lang } as any);
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
    setUserState(null);
    setActiveBooking(null);
    setProblemDraft(null);
    await safeStorage.removeItem('@user_profile_id');
    try { await supabase.auth.signOut(); } catch (_) {}
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
        setUser: setUser as any,
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
