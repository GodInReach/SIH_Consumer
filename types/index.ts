export type ServiceCategory =
  | 'Electrical'
  | 'Plumbing'
  | 'Tailoring'
  | 'Carpentry'
  | 'Cleaning'
  | 'Automotive'
  | 'Appliances'
  | 'IT'
  | 'Other';

export interface Service {
  id: string;
  name: string;
  icon: string;
  category: ServiceCategory;
  description: string;
}

export interface Worker {
  id: string;
  name: string;
  photo_url: string;
  phone: string;
  lat: number;
  lng: number;
  rating: number;
  completed_jobs: number;
  experience: string;
  verified: boolean;
  available: boolean;
  service_radius: number;
  price_min: number;
  price_max: number;
  response_time_mins: number;
  skills: string[];
  about: string;
  service_guarantee: string;
  service_ids: string[];
  category?: string;
  beckn_did?: string;
  working_hours?: string;
  completion_rate?: number;
  response_rate?: number;
  distance_km?: number;
  calculated_eta?: number;
}

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type UrgencyLevel = 'normal' | 'emergency';

export interface Booking {
  id: string;
  customer_id: string;
  worker_id?: string;
  service_id: string;
  problem: string;
  photo_url?: string;
  urgency: UrgencyLevel;
  address: string;
  lat: number;
  lng: number;
  status: BookingStatus;
  price?: number;
  payment_method?: string;
  payment_status?: string;
  eta?: string;
  created_at: string;
  updated_at: string;
  worker?: Worker;
  workers?: Worker;
  service?: Service;
}

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  worker_id: string;
  rating: number;
  review: string;
  tags: string[];
  created_at: string;
  customer_name?: string;
}

export interface UserProfile {
  id: string;
  user_id?: string;
  username?: string;
  name: string;
  phone: string;
  email?: string;
  photo_url?: string;
  language: 'en' | 'ta' | 'hi';
  preferred_language?: string;
  address: string;
  home_address?: string;
  work_address?: string;
  lat: number;
  lng: number;
  home_lat?: number;
  home_lng?: number;
}

export interface AIAnalysisResult {
  recommended_service_id: string;
  service_name: string;
  problem_summary: string;
  urgency: UrgencyLevel;
  confidence: number;
  suggested_tags: string[];
}

export interface FilterOptions {
  service_id?: string;
  category?: string;
  min_rating?: number;
  max_price?: number;
  max_distance?: number;
  available_only?: boolean;
  sort_by?: 'rating' | 'distance' | 'price' | 'eta';
}
