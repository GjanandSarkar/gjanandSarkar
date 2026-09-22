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

export interface DetailedAddressLocation {
  area: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: number;
  longitude: number;
  displayName: string;
}

const geocodeCache = new Map<string, { data: DetailedAddressLocation; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

/**
 * Reverse geocodes coordinates into structured address fields.
 * CRITICAL: Flat/house/building numbers are NEVER populated here and must remain manual.
 */
export async function reverseGeocodeDetailed(lat: number, lng: number): Promise<DetailedAddressLocation | null> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'DairyDirect-Ecommerce-App/1.0',
        },
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data) {
        const addr = data.address || {};

        // Extract area (suburb, neighbourhood, residential, etc.)
        const area = (
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.subdistrict ||
          addr.county ||
          ''
        ).trim();

        // Extract street/road
        const street = (
          addr.road ||
          addr.street ||
          addr.pedestrian ||
          addr.footway ||
          addr.path ||
          ''
        ).trim();

        // Extract town/city
        const city = (
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          addr.city_district ||
          ''
        ).trim();

        // Extract state
        const state = (addr.state || '').trim();

        // Extract pincode (clean non-digits)
        const rawPostcode = (addr.postcode || '').trim();
        const pincode = rawPostcode.replace(/\D/g, '').slice(0, 6);

        // Extract country
        const country = (addr.country || 'India').trim();

        const result: DetailedAddressLocation = {
          area,
          street,
          city,
          state,
          pincode,
          country: country || 'India',
          latitude: lat,
          longitude: lng,
          displayName: data.display_name || '',
        };

        geocodeCache.set(cacheKey, { data: result, timestamp: Date.now() });
        return result;
      }
    }
  } catch (err) {
    console.warn('Detailed reverse geocoding failed:', err);
  }

  return null;
}

export async function reverseGeocodeCoords(lat: number, lng: number): Promise<string> {
  const detailed = await reverseGeocodeDetailed(lat, lng);
  if (detailed && detailed.displayName) {
    return detailed.displayName;
  }
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export async function fetchIPLocation(): Promise<LocationResult | null> {
  // 1. Try ipwho.is (fast, unmetered, high quality)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const address = await reverseGeocodeCoords(data.latitude, data.longitude);
        return {
          lat: data.latitude,
          lng: data.longitude,
          city: data.city || data.region,
          address: address || `${data.city || ''}, ${data.region || ''}, ${data.country || 'India'}`,
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

  // 3. Try ipapi.co
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

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
    // ignore
  }

  return null;
}

/**
 * Fetches structured address details via IP Geolocation.
 * Used as automatic fallback whenever device GPS permission is denied or unavailable.
 */
export async function fetchDetailedIPLocation(): Promise<{ location: DetailedAddressLocation; source: 'ip' } | null> {
  // 1. Try ipwho.is
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const detailed = await reverseGeocodeDetailed(data.latitude, data.longitude);
        if (detailed) {
          return {
            location: {
              ...detailed,
              city: detailed.city || data.city || '',
              state: detailed.state || data.region || '',
              pincode: detailed.pincode || (data.postal ? String(data.postal).replace(/\D/g, '').slice(0, 6) : ''),
              country: detailed.country || data.country || 'India',
            },
            source: 'ip',
          };
        }

        return {
          location: {
            area: '',
            street: '',
            city: data.city || '',
            state: data.region || '',
            pincode: data.postal ? String(data.postal).replace(/\D/g, '').slice(0, 6) : '',
            country: data.country || 'India',
            latitude: data.latitude,
            longitude: data.longitude,
            displayName: `${data.city || ''}, ${data.region || ''}, ${data.country || 'India'}`,
          },
          source: 'ip',
        };
      }
    }
  } catch (err) {
    // fallback
  }

  // 2. Try freeipapi.com
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.latitude === 'number' && typeof data.longitude === 'number') {
        const detailed = await reverseGeocodeDetailed(data.latitude, data.longitude);
        if (detailed) {
          return {
            location: {
              ...detailed,
              city: detailed.city || data.cityName || '',
              state: detailed.state || data.regionName || '',
              pincode: detailed.pincode || (data.zipCode ? String(data.zipCode).replace(/\D/g, '').slice(0, 6) : ''),
              country: detailed.country || data.countryName || 'India',
            },
            source: 'ip',
          };
        }

        return {
          location: {
            area: '',
            street: '',
            city: data.cityName || '',
            state: data.regionName || '',
            pincode: data.zipCode ? String(data.zipCode).replace(/\D/g, '').slice(0, 6) : '',
            country: data.countryName || 'India',
            latitude: data.latitude,
            longitude: data.longitude,
            displayName: `${data.cityName || ''}, ${data.regionName || ''}, ${data.countryName || 'India'}`,
          },
          source: 'ip',
        };
      }
    }
  } catch (err) {
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
