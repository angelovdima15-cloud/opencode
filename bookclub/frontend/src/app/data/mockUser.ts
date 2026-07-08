export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
  level: number;
  bonusPoints: number;
  pointsToNextLevel: number;
  totalBookings: number;
  totalHours: number;
  favoriteClub: string;
  memberSince: string;
  rank: string;
}

export const mockUser: User = {
  id: "user-1",
  name: "Alex Thunder",
  email: "alex.thunder@gmail.com",
  phone: "+1 (555) 247-8931",
  avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200",
  level: 42,
  bonusPoints: 3200,
  pointsToNextLevel: 5000,
  totalBookings: 47,
  totalHours: 184,
  favoriteClub: "Nexus Gaming Arena",
  memberSince: "March 2025",
  rank: "Diamond",
};
