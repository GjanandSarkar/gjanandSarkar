/**
 * Robust Geolocation & Reverse Geocoding Utility
 * Supports GPS with automatic fallback to IP-based location and Nominatim reverse geocoding.
 */

export interface LocationResult {
  lat: number;
  lng: number;
  address?: string;
  source: 'gps' | 'network' | 'ip';
  city?: string;
}

export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    }
  } catch (err) {
    console.warn('Nominatim reverse geocode failed, falling back:', err);
  }

  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export async function fetchIPLocation(): Promise<LocationResult | null> {
  // 1. Try ipapi.co
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const address = await reverseGeocodeCoords(data.latitude, data.longitude);
        return {
          lat: data.latitude,
          lng: data.longitude,
          city: data.city || data.region,
          address: address || `${data.city || ''}, ${data.region || ''}, ${data.country_name || 'India'}`,
          source: 'ip',
        };
      }
    }
  } catch (e) {
    // try fallback
  }

  // 2. Try freeipapi.com
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const address = await reverseGeocodeCoords(data.latitude, data.longitude);
        return {
          lat: data.latitude,
          lng: data.longitude,
          city: data.cityName || data.regionName,
          address: address || `${data.cityName || ''}, ${data.regionName || ''}, ${data.countryName || 'India'}`,
          source: 'ip',
        };
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}

export async function getCurrentUserLocation(): Promise<LocationResult> {
  // 1. Attempt Browser Geolocation
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false, // low accuracy works reliably on desktops, Wi-Fi and phones
            timeout: 6000,
            maximumAge: 60000,
          }
        );
      });

      const { latitude, longitude } = pos.coords;
      const address = await reverseGeocodeCoords(latitude, longitude);

      return {
        lat: latitude,
        lng: longitude,
        address,
        source: 'gps',
      };
    } catch (browserGeoError: any) {
      console.warn('Browser GPS geolocation failed/denied, trying IP geolocation fallback...', browserGeoError?.message);
    }
  }

  // 2. Fallback to IP Geolocation
  const ipResult = await fetchIPLocation();
  if (ipResult) {
    return ipResult;
  }

  // 3. Fallback default coordinates (Delhi, India) if everything is blocked
  const fallbackCoords = { lat: 28.6139, lng: 77.2090 };
  const fallbackAddr = await reverseGeocodeCoords(fallbackCoords.lat, fallbackCoords.lng);
  return {
    lat: fallbackCoords.lat,
    lng: fallbackCoords.lng,
    address: fallbackAddr || 'New Delhi, Delhi, India',
    source: 'ip',
  };
}
