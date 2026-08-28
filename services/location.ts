import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Default location (Anna Nagar, Chennai)
export const DEFAULT_LOCATION: Coordinates = {
  latitude: 13.0827,
  longitude: 80.2707,
};

export const DEFAULT_ADDRESS = 'Anna Nagar West, Chennai, Tamil Nadu';

// Calculate Haversine distance in kilometers between two lat/lng points
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

// Calculate estimated travel time in minutes based on distance (avg speed 20 km/h in city + 5 min prep)
export function calculateETA(distanceKm: number): number {
  const travelMins = (distanceKm / 20) * 60;
  return Math.max(5, Math.round(travelMins + 4));
}

// Request location permission & get current coordinates
export async function getCurrentLocation(): Promise<{
  coords: Coordinates;
  address: string;
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { coords: DEFAULT_LOCATION, address: DEFAULT_ADDRESS };
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coords = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };

    // Reverse geocode to get human readable address
    const reverse = await Location.reverseGeocodeAsync(coords);
    let address = DEFAULT_ADDRESS;
    if (reverse && reverse.length > 0) {
      const place = reverse[0];
      const parts = [
        place.name || place.street,
        place.subregion || place.district || place.city,
        place.region,
      ].filter(Boolean);
      address = parts.join(', ') || DEFAULT_ADDRESS;
    }

    return { coords, address };
  } catch (error) {
    console.warn('Location retrieval error, using default:', error);
    return { coords: DEFAULT_LOCATION, address: DEFAULT_ADDRESS };
  }
}
