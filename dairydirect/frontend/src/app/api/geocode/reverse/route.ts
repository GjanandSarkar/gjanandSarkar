import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface GeocodeResult {
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const latStr = searchParams.get('lat');
  const lngStr = searchParams.get('lng');

  if (!latStr || !lngStr) {
    return NextResponse.json({ error: 'lat and lng parameters are required' }, { status: 400 });
  }

  const lat = parseFloat(latStr);
  const lng = parseFloat(lngStr);

  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ error: 'Valid latitude (-90 to 90) and longitude (-180 to 180) required' }, { status: 400 });
  }

  // 1. Primary: Try Photon Komoot API (Fast, reliable, OpenStreetMap-based, <300ms)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const photonRes = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'GjanandSarkar-Marketplace/1.0',
      },
    });
    clearTimeout(timeout);

    if (photonRes.ok) {
      const data = await photonRes.json();
      const feature = data?.features?.[0];
      if (feature && feature.properties) {
        const props = feature.properties;

        const street = (props.name || props.street || '').trim();
        const city = (props.city || props.town || props.village || props.district || '').trim();
        const area = (props.suburb || props.district || props.locality || '').trim();
        const state = (props.state || '').trim();
        const rawPostcode = (props.postcode || '').trim();
        const pincode = rawPostcode.replace(/\D/g, '').slice(0, 6);
        const country = (props.country || 'India').trim();

        const parts = [street, area, city, state, pincode, country].filter(Boolean);
        const displayName = parts.join(', ');

        const location: GeocodeResult = {
          area,
          street,
          city,
          state,
          pincode,
          country,
          latitude: lat,
          longitude: lng,
          displayName,
        };

        return NextResponse.json({ success: true, location });
      }
    }
  } catch (err: any) {
    console.warn('[Geocode API] Photon reverse geocoding failed:', err.message);
  }

  // 2. Secondary: Fallback to OpenStreetMap Nominatim
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const osmRes = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en',
          'User-Agent': 'GjanandSarkar-Marketplace/1.0 (contact@gjanandsarkar.com)',
        },
      }
    );
    clearTimeout(timeout);

    if (osmRes.ok) {
      const data = await osmRes.json();
      if (data && data.address) {
        const addr = data.address;

        const area = (
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.subdistrict ||
          addr.county ||
          ''
        ).trim();

        const street = (
          addr.road ||
          addr.street ||
          addr.pedestrian ||
          addr.footway ||
          addr.path ||
          ''
        ).trim();

        const city = (
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          addr.city_district ||
          ''
        ).trim();

        const state = (addr.state || '').trim();
        const rawPostcode = (addr.postcode || '').trim();
        const pincode = rawPostcode.replace(/\D/g, '').slice(0, 6);
        const country = (addr.country || 'India').trim();

        const location: GeocodeResult = {
          area,
          street,
          city,
          state,
          pincode,
          country,
          latitude: lat,
          longitude: lng,
          displayName: data.display_name || '',
        };

        return NextResponse.json({ success: true, location });
      }
    }
  } catch (err: any) {
    console.warn('[Geocode API] Nominatim reverse geocoding failed:', err.message);
  }

  return NextResponse.json(
    { error: 'Unable to reverse geocode coordinates at this time' },
    { status: 502 }
  );
}
