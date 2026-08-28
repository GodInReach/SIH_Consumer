import { fetchWorkers, fetchWorkerById, createBooking } from './api';
import { Booking, FilterOptions, Worker } from '../types';

export interface BecknSearchIntent {
  category: string;
  location: {
    lat: number;
    lng: number;
  };
  urgency?: 'normal' | 'emergency';
}

export interface BecknCatalogItem {
  id: string;
  descriptor: {
    name: string;
    images: string[];
    short_desc: string;
  };
  price: {
    currency: string;
    value: string;
  };
  provider: {
    id: string;
    name: string;
    rating: number;
  };
}

/**
 * Beckn Protocol Adapter Layer
 * Translates standard Beckn BAP actions into home services backend actions.
 */
export class BecknAdapter {
  private static bAPId = 'consumer-app.beckn.local';
  private static bAPUri = 'https://consumer-app.beckn.local/bap';

  // Beckn /search implementation
  public static async search(intent: BecknSearchIntent): Promise<Worker[]> {
    console.log('[Beckn BAP] Sending /search intent:', intent);
    const filterOptions: FilterOptions = {
      service_id: intent.category.toLowerCase(),
      sort_by: intent.urgency === 'emergency' ? 'eta' : 'distance',
    };

    const workers = await fetchWorkers(intent.location.lat, intent.location.lng, filterOptions);
    console.log(`[Beckn BAP] Received /on_search with ${workers.length} provider catalogs`);
    return workers;
  }

  // Beckn /select implementation
  public static async select(providerId: string, itemId: string): Promise<{ provider: Worker | null; estimate: number }> {
    console.log(`[Beckn BAP] Sending /select for Provider: ${providerId}, Service: ${itemId}`);
    const worker = await fetchWorkerById(providerId);
    return {
      provider: worker,
      estimate: worker ? worker.price_min : 300,
    };
  }

  // Beckn /confirm implementation
  public static async confirm(bookingDetails: {
    customerId: string;
    workerId: string;
    serviceId: string;
    problem: string;
    urgency: 'normal' | 'emergency';
    address: string;
    lat: number;
    lng: number;
    price: number;
  }): Promise<Booking | null> {
    console.log('[Beckn BAP] Sending /confirm to Beckn Provider Gateway:', bookingDetails);

    const newBooking = await createBooking({
      customer_id: bookingDetails.customerId,
      worker_id: bookingDetails.workerId,
      service_id: bookingDetails.serviceId,
      problem: bookingDetails.problem,
      urgency: bookingDetails.urgency,
      address: bookingDetails.address,
      lat: bookingDetails.lat,
      lng: bookingDetails.lng,
      status: 'accepted',
      price: bookingDetails.price,
      payment_method: 'UPI',
      payment_status: 'unpaid',
      eta: '8 mins',
    });

    if (newBooking) {
      console.log('[Beckn BAP] Received /on_confirm:', newBooking.id);
    }
    return newBooking || null;
  }

  // Beckn /status implementation
  public static async getStatus(bookingId: string): Promise<string> {
    console.log(`[Beckn BAP] Polling /status for Order: ${bookingId}`);
    return 'on_the_way';
  }
}
