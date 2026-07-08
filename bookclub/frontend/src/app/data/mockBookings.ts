export type BookingStatus = "upcoming" | "active" | "past" | "cancelled";

export interface Booking {
  id: string;
  clubId: string;
  clubName: string;
  clubPhoto: string;
  date: string;
  startTime: string;
  endTime: string;
  seatId: string;
  seatNumber: string;
  zone: "VIP" | "Standard" | "Pro";
  totalPrice: number;
  status: BookingStatus;
  qrCode: string;
  duration: number;
}

export const mockBookings: Booking[] = [
  {
    id: "bk-001",
    clubId: "club-1",
    clubName: "Nexus Gaming Arena",
    clubPhoto: "https://images.unsplash.com/photo-1701281941392-fd6c2d8d652b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    date: "2026-07-10",
    startTime: "18:00",
    endTime: "21:00",
    seatId: "club-1-1",
    seatNumber: "V1",
    zone: "VIP",
    totalPrice: 24,
    status: "upcoming",
    qrCode: "BK-001-NEXUS-V1",
    duration: 3,
  },
  {
    id: "bk-002",
    clubId: "club-2",
    clubName: "HyperZone Lounge",
    clubPhoto: "https://images.unsplash.com/photo-1715279240000-9a50953e327d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    date: "2026-07-08",
    startTime: "14:00",
    endTime: "16:00",
    seatId: "club-2-7",
    seatNumber: "P3",
    zone: "Pro",
    totalPrice: 10,
    status: "active",
    qrCode: "BK-002-HYPER-P3",
    duration: 2,
  },
  {
    id: "bk-003",
    clubId: "club-4",
    clubName: "Omega Gaming Hub",
    clubPhoto: "https://images.unsplash.com/photo-1726442125314-c70f9753c0ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    date: "2026-07-05",
    startTime: "20:00",
    endTime: "23:00",
    seatId: "club-4-3",
    seatNumber: "V3",
    zone: "VIP",
    totalPrice: 21,
    status: "past",
    qrCode: "BK-003-OMEGA-V3",
    duration: 3,
  },
  {
    id: "bk-004",
    clubId: "club-3",
    clubName: "ProPlay Station",
    clubPhoto: "https://images.unsplash.com/photo-1679766900523-d8e1a1393d1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    date: "2026-06-30",
    startTime: "15:00",
    endTime: "17:00",
    seatId: "club-3-12",
    seatNumber: "S4",
    zone: "Standard",
    totalPrice: 6,
    status: "past",
    qrCode: "BK-004-PRO-S4",
    duration: 2,
  },
  {
    id: "bk-005",
    clubId: "club-5",
    clubName: "CyberArena Elite",
    clubPhoto: "https://images.unsplash.com/photo-1632603093711-0d93a0bcc6cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    date: "2026-06-25",
    startTime: "11:00",
    endTime: "13:00",
    seatId: "club-5-2",
    seatNumber: "V2",
    zone: "VIP",
    totalPrice: 16,
    status: "cancelled",
    qrCode: "BK-005-CYBER-V2",
    duration: 2,
  },
  {
    id: "bk-006",
    clubId: "club-1",
    clubName: "Nexus Gaming Arena",
    clubPhoto: "https://images.unsplash.com/photo-1701281941392-fd6c2d8d652b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    date: "2026-07-12",
    startTime: "10:00",
    endTime: "14:00",
    seatId: "club-1-5",
    seatNumber: "P2",
    zone: "Pro",
    totalPrice: 20,
    status: "upcoming",
    qrCode: "BK-006-NEXUS-P2",
    duration: 4,
  },
];
