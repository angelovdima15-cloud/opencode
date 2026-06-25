export interface CreateBookingRequest {
  club_id: number;
  workstation_id: string;
  user_phone: string;
  user_name?: string;
  start_time: string;   // ISO, например "2026-06-25T17:00:00.000Z"
  end_time: string;     // ISO, например "2026-06-25T21:00:00.000Z"
}

export interface BookingResponse {
  booking_id: string;
  status: string;
  club_id: number;
  club_name?: string;
  club_phone?: string;
  workstation_name: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  total_price: number;
  created_at: string;
}

export interface CancelBookingResponse {
  booking_id: string;
  status: string;
}

export interface WorkstationStatus {
  id: string;
  name: string;
  status: 'free' | 'busy' | 'offline' | 'booked';
  zone: string;
  specs: {
    cpu?: string;
    gpu?: string;
    ram?: string;
    monitor?: string;
  };
  position: { x: number; y: number };
  booked_until?: string;
}

export interface ClubResponse {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  description: string;
  schedule: string;
  price_per_hour: number;
  total_pcs: number;
  free_pcs?: number;
  zones: ZoneInfo[];
  amenities: string[];
  has_live_status: boolean;
  distance_km?: number;
  workstations_updated_at: string;
}

export interface ZoneInfo {
  name: string;
  pcs_count: number;
  price_per_hour?: number;
  free_pcs?: number;
}
