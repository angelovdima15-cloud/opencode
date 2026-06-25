const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function geocode(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    'accept-language': 'ru',
  });

  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'User-Agent': 'BookClub/1.0' },
  });

  if (!res.ok) throw new Error('Geocoding failed');

  const data = await res.json();
  return data.map((r) => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    displayName: r.display_name,
  }));
}
