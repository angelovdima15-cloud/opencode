import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Search, SlidersHorizontal, MapPin, Star, Clock, Zap, ChevronRight, Wifi, Trophy } from "lucide-react";
import { mockClubs, Club, Zone } from "../../data/mockClubs";
import { useAuth } from "../../context/AuthContext";
import { StarRating } from "../shared/StarRating";
import { BadgeChip } from "../shared/BadgeChip";
import { GlowCard } from "../shared/GlowCard";
import { ImageWithFallback } from "../figma/ImageWithFallback";

type SortOption = "rating" | "distance" | "price" | "seats";
type ZoneFilter = Zone | "All";

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{
        background: "rgba(26, 26, 46, 0.9)",
        border: "1px solid rgba(124, 58, 237, 0.2)",
      }}
    >
      <Search size={18} color="#8888AA" />
      <input
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: "#F1F1F1" }}
        placeholder="Search clubs, zones, locations..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FilterBar({
  sort,
  setSort,
  zone,
  setZone,
}: {
  sort: SortOption;
  setSort: (s: SortOption) => void;
  zone: ZoneFilter;
  setZone: (z: ZoneFilter) => void;
}) {
  const sorts: { key: SortOption; label: string }[] = [
    { key: "rating", label: "Top Rated" },
    { key: "distance", label: "Nearby" },
    { key: "price", label: "Cheapest" },
    { key: "seats", label: "Available" },
  ];
  const zones: ZoneFilter[] = ["All", "VIP", "Pro", "Standard"];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {sorts.map((s) => (
          <button
            key={s.key}
            onClick={() => setSort(s.key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: sort === s.key ? "rgba(124, 58, 237, 0.25)" : "rgba(26,26,46,0.8)",
              color: sort === s.key ? "#A78BFA" : "#8888AA",
              border: sort === s.key ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.08)",
              whiteSpace: "nowrap",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {zones.map((z) => (
          <button
            key={z}
            onClick={() => setZone(z)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: zone === z
                ? z === "VIP" ? "rgba(124,58,237,0.25)" : z === "Pro" ? "rgba(6,182,212,0.2)" : z === "Standard" ? "rgba(255,255,255,0.1)" : "rgba(124,58,237,0.15)"
                : "rgba(26,26,46,0.8)",
              color: zone === z
                ? z === "VIP" ? "#A78BFA" : z === "Pro" ? "#22D3EE" : z === "Standard" ? "#D0D0E8" : "#A78BFA"
                : "#8888AA",
              border: zone === z ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.08)",
              whiteSpace: "nowrap",
            }}
          >
            {z}
          </button>
        ))}
      </div>
    </div>
  );
}

function FeaturedBanner() {
  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{ height: "140px" }}
    >
      <ImageWithFallback
        src="https://images.unsplash.com/photo-1701281941392-fd6c2d8d652b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
        alt="Featured gaming club"
        className="w-full h-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, rgba(124,58,237,0.85) 0%, rgba(6,182,212,0.4) 100%)",
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.2)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            🔥 WEEKEND DEAL
          </span>
        </div>
        <p className="text-white font-bold text-lg leading-tight">30% OFF VIP seats</p>
        <p className="text-white/70 text-xs mt-0.5">This weekend only · Use code <span className="text-[#22D3EE] font-bold">LEVEL30</span></p>
      </div>
    </div>
  );
}

function ClubCard({ club, index }: { club: Club; index: number }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      onClick={() => navigate(`/club/${club.id}`)}
    >
      <GlowCard padding="p-0" className="overflow-hidden cursor-pointer active:scale-[0.99]" style={{ transition: "transform 0.1s" }}>
        {/* Photo */}
        <div className="relative" style={{ height: "140px" }}>
          <ImageWithFallback
            src={club.photos[0]}
            alt={club.name}
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(13,13,26,0.9) 100%)" }}
          />
          {/* Availability badge */}
          <div className="absolute top-3 right-3">
            <span
              className="text-xs px-2 py-1 rounded-lg font-semibold"
              style={{
                background: club.availableSeats > 10 ? "rgba(16,185,129,0.85)" : club.availableSeats > 3 ? "rgba(245,158,11,0.85)" : "rgba(239,68,68,0.85)",
                color: "#FFFFFF",
                backdropFilter: "blur(4px)",
              }}
            >
              {club.availableSeats} seats
            </span>
          </div>
          {/* Zone badges */}
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            {club.zones.map((z) => (
              <BadgeChip key={z} variant={z} size="sm" />
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-start justify-between mb-1.5">
            <div>
              <h3 className="text-white font-semibold text-sm leading-tight">{club.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={11} color="#8888AA" />
                <span className="text-xs" style={{ color: "#8888AA" }}>{club.address}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <StarRating rating={club.rating} size={11} showValue />
              <span className="text-xs" style={{ color: "#8888AA" }}>{club.reviewCount} reviews</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <MapPin size={11} color="#06B6D4" />
                <span className="text-xs font-semibold" style={{ color: "#06B6D4" }}>{club.distance}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={11} color="#8888AA" />
                <span className="text-xs" style={{ color: "#8888AA" }}>{club.openingHours[0].hours}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs" style={{ color: "#8888AA" }}>from</span>
              <span className="text-sm font-bold" style={{ color: "#A78BFA" }}>${club.minPricePerHour}/hr</span>
              <ChevronRight size={14} color="#7C3AED" />
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {club.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-md"
                style={{ background: "rgba(255,255,255,0.06)", color: "#8888AA", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
}

export function HomeScreen() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("rating");
  const [zone, setZone] = useState<ZoneFilter>("All");

  const filtered = useMemo(() => {
    let clubs = [...mockClubs];
    if (search) clubs = clubs.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.address.toLowerCase().includes(search.toLowerCase()));
    if (zone !== "All") clubs = clubs.filter((c) => c.zones.includes(zone as Zone));
    if (sort === "rating") clubs.sort((a, b) => b.rating - a.rating);
    else if (sort === "price") clubs.sort((a, b) => a.minPricePerHour - b.minPricePerHour);
    else if (sort === "seats") clubs.sort((a, b) => b.availableSeats - a.availableSeats);
    else clubs.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    return clubs;
  }, [search, sort, zone]);

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: "#8888AA" }}>Good gaming, {user?.name.split(" ")[0] ?? "Player"} 👾</p>
          <h1 className="text-white" style={{ fontSize: "22px", fontWeight: 700 }}>Find Your Arena</h1>
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(124, 58, 237, 0.15)", border: "1px solid rgba(124, 58, 237, 0.3)" }}
        >
          <Trophy size={20} color="#A78BFA" />
        </div>
      </div>

      {/* Featured banner */}
      <FeaturedBanner />

      {/* Search */}
      <SearchBar value={search} onChange={setSearch} />

      {/* Filters */}
      <FilterBar sort={sort} setSort={setSort} zone={zone} setZone={setZone} />

      {/* Results count */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{filtered.length} clubs found</span>
        <div className="flex items-center gap-1">
          <Wifi size={12} color="#10B981" />
          <span className="text-xs" style={{ color: "#10B981" }}>Live availability</span>
        </div>
      </div>

      {/* Club list */}
      <div className="flex flex-col gap-3">
        {filtered.map((club, i) => (
          <ClubCard key={club.id} club={club} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Zap size={40} color="#2A2A3E" />
            <p className="text-sm text-center" style={{ color: "#8888AA" }}>No clubs match your filters.<br />Try adjusting the search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
