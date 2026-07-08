export type Zone = "VIP" | "Standard" | "Pro";
export type SeatStatus = "available" | "occupied" | "maintenance";

export interface PCSpec {
  id: string;
  seatNumber: string;
  gpu: string;
  hz: number;
  ram: string;
  cpu: string;
  peripherals: string[];
  pricePerHour: number;
  zone: Zone;
  status: SeatStatus;
  row: number;
  col: number;
}

export interface Review {
  id: string;
  userName: string;
  userLevel: number;
  rating: number;
  text: string;
  date: string;
  helpful: number;
}

export interface Club {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  reviewCount: number;
  photos: string[];
  openingHours: { day: string; hours: string }[];
  zones: Zone[];
  pcs: PCSpec[];
  reviews: Review[];
  minPricePerHour: number;
  tags: string[];
  availableSeats: number;
  totalSeats: number;
}

const generatePCs = (clubId: string): PCSpec[] => {
  const configs: Record<string, Partial<PCSpec>> = {
    vip1: { gpu: "RTX 4090", hz: 360, ram: "64GB DDR5", cpu: "i9-14900K", peripherals: ["Razer DeathAdder V3", "SteelSeries Apex Pro", "HyperX Cloud III", "ASUS ROG 360Hz"], pricePerHour: 8, zone: "VIP" },
    vip2: { gpu: "RTX 4080 Super", hz: 280, ram: "32GB DDR5", cpu: "i9-14900K", peripherals: ["Logitech G Pro X", "Corsair K100", "SteelSeries Arctis Nova Pro"], pricePerHour: 7, zone: "VIP" },
    pro1: { gpu: "RTX 4070 Ti", hz: 240, ram: "32GB DDR5", cpu: "i7-14700K", peripherals: ["Logitech G502 X", "Corsair K95", "HyperX Cloud Alpha"], pricePerHour: 5, zone: "Pro" },
    pro2: { gpu: "RTX 4070", hz: 165, ram: "32GB DDR4", cpu: "i7-13700K", peripherals: ["Razer Viper V2", "Logitech G815", "Corsair HS80"], pricePerHour: 4, zone: "Pro" },
    std1: { gpu: "RTX 3080", hz: 144, ram: "16GB DDR4", cpu: "i5-13600K", peripherals: ["Logitech G203", "Redragon K552", "HyperX Cloud Stinger"], pricePerHour: 3, zone: "Standard" },
    std2: { gpu: "RTX 3070", hz: 144, ram: "16GB DDR4", cpu: "i5-12600K", peripherals: ["Razer DeathAdder Essential", "Corsair K55", "Kingston HyperX"], pricePerHour: 2.5, zone: "Standard" },
  };

  const seats: PCSpec[] = [];
  let id = 1;

  // VIP row
  for (let col = 0; col < 4; col++) {
    const cfg = col < 2 ? configs.vip1 : configs.vip2;
    seats.push({
      id: `${clubId}-${id++}`,
      seatNumber: `V${col + 1}`,
      gpu: cfg.gpu!, hz: cfg.hz!, ram: cfg.ram!, cpu: cfg.cpu!,
      peripherals: cfg.peripherals!, pricePerHour: cfg.pricePerHour!,
      zone: "VIP", row: 0, col,
      status: Math.random() > 0.4 ? "available" : "occupied",
    });
  }
  // Pro row
  for (let col = 0; col < 6; col++) {
    const cfg = col < 3 ? configs.pro1 : configs.pro2;
    seats.push({
      id: `${clubId}-${id++}`,
      seatNumber: `P${col + 1}`,
      gpu: cfg.gpu!, hz: cfg.hz!, ram: cfg.ram!, cpu: cfg.cpu!,
      peripherals: cfg.peripherals!, pricePerHour: cfg.pricePerHour!,
      zone: "Pro", row: 1, col,
      status: Math.random() > 0.3 ? "available" : "occupied",
    });
  }
  // Standard rows
  for (let row = 2; row < 4; row++) {
    for (let col = 0; col < 8; col++) {
      const cfg = col < 4 ? configs.std1 : configs.std2;
      seats.push({
        id: `${clubId}-${id++}`,
        seatNumber: `S${(row - 2) * 8 + col + 1}`,
        gpu: cfg.gpu!, hz: cfg.hz!, ram: cfg.ram!, cpu: cfg.cpu!,
        peripherals: cfg.peripherals!, pricePerHour: cfg.pricePerHour!,
        zone: "Standard", row, col,
        status: Math.random() > 0.3 ? "available" : "occupied",
      });
    }
  }

  return seats;
};

const reviews: Review[] = [
  { id: "r1", userName: "Alex Thunder", userLevel: 42, rating: 5, text: "Best gaming club in the city! RTX 4090 setup is insane, 360Hz monitors are buttery smooth. Staff is super friendly.", date: "2026-06-28", helpful: 24 },
  { id: "r2", userName: "ShadowWolf99", userLevel: 31, rating: 4, text: "Great equipment and atmosphere. VIP section is worth the extra cost. Could use better soundproofing though.", date: "2026-06-20", helpful: 15 },
  { id: "r3", userName: "CyberNova", userLevel: 18, rating: 5, text: "Came for a weekend session, stayed for 6 hours. The Pro zone has amazing setups for competitive play!", date: "2026-06-15", helpful: 9 },
  { id: "r4", userName: "NightRaider", userLevel: 55, rating: 3, text: "Good place overall. Booking system works well. Wish they had more VIP seats available.", date: "2026-06-10", helpful: 7 },
  { id: "r5", userName: "PixelQueen", userLevel: 27, rating: 5, text: "Love the vibe! RGB lighting everywhere, comfy chairs, and the LAN events are legendary.", date: "2026-06-05", helpful: 31 },
];

export const mockClubs: Club[] = [
  {
    id: "club-1",
    name: "Nexus Gaming Arena",
    address: "42 Cyber Street, Tech District",
    distance: "0.8 km",
    rating: 4.9,
    reviewCount: 312,
    photos: [
      "https://images.unsplash.com/photo-1701281941392-fd6c2d8d652b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1723792306904-c417c0da40e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1632603093711-0d93a0bcc6cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    ],
    openingHours: [
      { day: "Mon–Fri", hours: "09:00 – 02:00" },
      { day: "Sat–Sun", hours: "08:00 – 04:00" },
    ],
    zones: ["VIP", "Pro", "Standard"],
    pcs: generatePCs("club-1"),
    reviews: reviews,
    minPricePerHour: 2.5,
    tags: ["24/7", "LAN Events", "Free Parking", "Café"],
    availableSeats: 18,
    totalSeats: 28,
  },
  {
    id: "club-2",
    name: "HyperZone Lounge",
    address: "17 Neon Blvd, Downtown",
    distance: "1.2 km",
    rating: 4.7,
    reviewCount: 189,
    photos: [
      "https://images.unsplash.com/photo-1715279240000-9a50953e327d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1726442131094-4fe2fa8e7d94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    ],
    openingHours: [
      { day: "Mon–Thu", hours: "10:00 – 00:00" },
      { day: "Fri–Sun", hours: "10:00 – 03:00" },
    ],
    zones: ["VIP", "Standard"],
    pcs: generatePCs("club-2"),
    reviews: reviews.slice(0, 3),
    minPricePerHour: 3,
    tags: ["Tournaments", "Snack Bar", "Air Conditioned"],
    availableSeats: 12,
    totalSeats: 24,
  },
  {
    id: "club-3",
    name: "ProPlay Station",
    address: "88 Arena Road, West Side",
    distance: "2.1 km",
    rating: 4.5,
    reviewCount: 94,
    photos: [
      "https://images.unsplash.com/photo-1679766900523-d8e1a1393d1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1629148769165-069e8a9e8a30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    ],
    openingHours: [
      { day: "Mon–Sun", hours: "11:00 – 23:00" },
    ],
    zones: ["Pro", "Standard"],
    pcs: generatePCs("club-3"),
    reviews: reviews.slice(1, 4),
    minPricePerHour: 2,
    tags: ["Student Discount", "WiFi", "Coaching"],
    availableSeats: 9,
    totalSeats: 20,
  },
  {
    id: "club-4",
    name: "Omega Gaming Hub",
    address: "5 Pixel Plaza, North Quarter",
    distance: "3.4 km",
    rating: 4.8,
    reviewCount: 241,
    photos: [
      "https://images.unsplash.com/photo-1726442125314-c70f9753c0ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1701281941392-fd6c2d8d652b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    ],
    openingHours: [
      { day: "Mon–Fri", hours: "08:00 – 02:00" },
      { day: "Sat–Sun", hours: "00:00 – 00:00 (24/7)" },
    ],
    zones: ["VIP", "Pro", "Standard"],
    pcs: generatePCs("club-4"),
    reviews: reviews,
    minPricePerHour: 2.5,
    tags: ["24/7 Weekends", "VR Room", "Streamer Setup"],
    availableSeats: 21,
    totalSeats: 32,
  },
  {
    id: "club-5",
    name: "CyberArena Elite",
    address: "109 Voltage Lane, East Mall",
    distance: "1.7 km",
    rating: 4.6,
    reviewCount: 158,
    photos: [
      "https://images.unsplash.com/photo-1632603093711-0d93a0bcc6cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1715279240000-9a50953e327d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    ],
    openingHours: [
      { day: "Mon–Sun", hours: "09:00 – 01:00" },
    ],
    zones: ["VIP", "Standard"],
    pcs: generatePCs("club-5"),
    reviews: reviews.slice(2, 5),
    minPricePerHour: 3,
    tags: ["Premium Chairs", "Cold Brew", "Console Area"],
    availableSeats: 7,
    totalSeats: 22,
  },
  {
    id: "club-6",
    name: "Quantum LAN Center",
    address: "33 Bit Street, Techno Park",
    distance: "0.5 km",
    rating: 4.4,
    reviewCount: 77,
    photos: [
      "https://images.unsplash.com/photo-1726442131094-4fe2fa8e7d94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      "https://images.unsplash.com/photo-1629148769165-069e8a9e8a30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
    ],
    openingHours: [
      { day: "Mon–Fri", hours: "12:00 – 22:00" },
      { day: "Sat–Sun", hours: "10:00 – 23:00" },
    ],
    zones: ["Pro", "Standard"],
    pcs: generatePCs("club-6"),
    reviews: reviews.slice(0, 2),
    minPricePerHour: 2,
    tags: ["Budget Friendly", "Group Bookings", "LAN Parties"],
    availableSeats: 14,
    totalSeats: 18,
  },
];
