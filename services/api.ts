import { supabase } from './supabase';
import { Booking, FilterOptions, Review, Service, Worker, UrgencyLevel } from '../types';
import { calculateDistanceKm, calculateETA } from './location';

export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase.from('services').select('*');
  if (error || !data) return [];
  return data as Service[];
}

export async function fetchWorkers(
  userLat: number = 13.0827,
  userLng: number = 80.2707,
  options?: FilterOptions
): Promise<Worker[]> {
  let query = supabase.from('workers').select('*').eq('available', true);
  
  const { data, error } = await query;
  if (error || !data) return [];
  
  let workersList = data as Worker[];

  let enriched = workersList.map(w => {
    const dist = calculateDistanceKm(userLat, userLng, w.lat, w.lng);
    const eta = calculateETA(dist);
    return {
      ...w,
      distance_km: dist,
      calculated_eta: eta
    };
  });

  if (options?.category) {
    enriched = enriched.filter(w => 
      w.category && w.category.toLowerCase().includes(options.category!.toLowerCase())
    );
  }

  if (options?.service_id) {
    enriched = enriched.filter(w => 
      (w.category && w.category.toLowerCase() === options.service_id!.toLowerCase()) ||
      (w.service_ids && w.service_ids.includes(options.service_id!)) ||
      (w.skills && w.skills.some(s => s.toLowerCase().includes(options.service_id!.toLowerCase())))
    );
  }

  if (options?.available_only) {
    enriched = enriched.filter(w => w.available);
  }

  if (options?.sort_by === 'rating') {
    enriched.sort((a, b) => b.rating - a.rating);
  } else if (options?.sort_by === 'price') {
    enriched.sort((a, b) => a.price_min - b.price_min);
  } else if (options?.sort_by === 'eta') {
    enriched.sort((a, b) => (a.calculated_eta || 10) - (b.calculated_eta || 10));
  } else {
    enriched.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
  }

  return enriched;
}

export async function fetchWorkerById(
  workerId: string,
  userLat: number = 13.0827,
  userLng: number = 80.2707
): Promise<Worker | null> {
  const { data, error } = await supabase.from('workers').select('*').eq('id', workerId).single();
  if (error || !data) return null;
  const w = data as Worker;
  const dist = calculateDistanceKm(userLat, userLng, w.lat, w.lng);
  return {
    ...w,
    distance_km: dist,
    calculated_eta: calculateETA(dist)
  };
}

export async function createBooking(data: {
  customer_id: string;
  worker_id: string;
  service_id: string;
  price: number;
  address: string;
  lat: number;
  lng: number;
  problem_text?: string;
  problem?: string;
  urgency: string;
  status?: string;
  payment_method?: string;
  payment_status?: string;
  eta?: string;
}): Promise<Booking | null> {
  const { data: result, error } = await supabase
    .from('bookings')
    .insert([{
      customer_id: data.customer_id,
      worker_id: data.worker_id,
      service_id: data.service_id,
      price: data.price,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      problem: data.problem || data.problem_text || '',
      urgency: data.urgency,
      status: data.status || 'pending',
      payment_method: data.payment_method || 'cash',
      payment_status: data.payment_status || 'unpaid',
      eta: data.eta,
    }])
    .select()
    .single();

  if (error || !result) {
    console.error('Error creating booking:', error);
    return null;
  }
  return result as Booking;
}

export async function fetchBookings(customerId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, workers(name, photo_url, phone, category)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Booking[];
}

export async function updateBookingStatus(bookingId: string, status: string): Promise<boolean> {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
  if (error) {
    console.error('Error updating booking status:', error);
    return false;
  }
  return true;
}

export async function fetchReviewsForWorker(workerId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('worker_id', workerId);

  if (error || !data) return [];
  return data as Review[];
}

export async function searchWorkersByService(serviceCategory: string, userLat: number, userLng: number): Promise<Worker[]> {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .eq('available', true)
    .eq('category', serviceCategory);

  if (error || !data) return [];
  
  let enriched = (data as Worker[]).map(w => {
    const dist = calculateDistanceKm(userLat, userLng, w.lat, w.lng);
    return {
      ...w,
      distance_km: dist,
      calculated_eta: calculateETA(dist)
    };
  });
  
  enriched.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
  return enriched;
}
