import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Clock, Star, Monitor, Cpu, Zap, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { mockClubs, Zone, PCSpec, Review } from "../../data/mockClubs";
import { ScreenHeader } from "../shared/ScreenHeader";
import { StarRating } from "../shared/StarRating";
import { BadgeChip } from "../shared/BadgeChip";
import { GlowCard } from "../shared/GlowCard";
import { GamingButton } from "../shared/GamingButton";
import { useBooking } from "../../context/BookingContext";
import { ImageWithFallback } from "../figma/ImageWithFallback";

function PhotoGallery({ photos }: { photos: string[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden" style={{ height: "220px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <ImageWithFallback
              src={photos[active]}
              alt={`Club photo ${active + 1}`}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(to bottom, transparent 60%, rgba(13,13,26,0.8) 100%)" }}
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className="rounded-full transition-all"
              style={{
                width: i === active ? "20px" : "6px",
                height: "6px",
                background: i === active ? "#7C3AED" : "rgba(255,255,255,0.4)",
              }}
            />
          ))}
        </div>
      </div>
      {/* Thumbnail strip */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className="flex-shrink-0 rounded-xl overflow-hidden"
            style={{
              width: "60px",
              height: "44px",
              border: i === active ? "2px solid #7C3AED" : "2px solid transparent",
              opacity: i === active ? 1 : 0.6,
            }}
          >
            <ImageWithFallback src={photo} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function PCSpecCard({ pc }: { pc: PCSpec }) {
  const [expanded, setExpanded] = useState(false);
  const zoneColor = pc.zone === "VIP" ? "#A78BFA" : pc.zone === "Pro" ? "#22D3EE" : "#8888AA";
  const isAvail = pc.status === "available";

  return (
    <GlowCard glow={pc.zone === "VIP" ? "purple" : pc.zone === "Pro" ? "cyan" : "none"} padding="p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Monitor size={16} color={zoneColor} />
          <span className="text-white font-semibold text-sm">{pc.seatNumber}</span>
          <BadgeChip variant={pc.zone} size="sm" />
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-bold"
            style={{ color: isAvail ? "#10B981" : "#EF4444" }}
          >
            {isAvail ? "● Available" : "● Occupied"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <Zap size={12} color="#A78BFA" />
          <span className="text-xs" style={{ color: "#D0D0E8" }}>{pc.gpu}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Monitor size={12} color="#22D3EE" />
          <span className="text-xs" style={{ color: "#D0D0E8" }}>{pc.hz}Hz</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu size={12} color="#FCD34D" />
          <span className="text-xs" style={{ color: "#D0D0E8" }}>{pc.ram}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Cpu size={12} color="#F87171" />
          <span className="text-xs" style={{ color: "#D0D0E8" }}>{pc.cpu}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: zoneColor }}>${pc.pricePerHour}/hr</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs"
          style={{ color: "#8888AA" }}
        >
          Peripherals {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-2 mt-2 border-t flex flex-col gap-1" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
              {pc.peripherals.map((p) => (
                <div key={p} className="flex items-center gap-1.5">
                  <CheckCircle2 size={11} color="#10B981" />
                  <span className="text-xs" style={{ color: "#8888AA" }}>{p}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlowCard>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
          style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)", color: "#FFFFFF" }}
        >
          {review.userName[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">{review.userName}</span>
            <BadgeChip variant="purple" size="sm">Lvl {review.userLevel}</BadgeChip>
          </div>
          <div className="flex items-center gap-2">
            <StarRating rating={review.rating} size={11} showValue={false} />
            <span className="text-xs" style={{ color: "#8888AA" }}>{review.date}</span>
          </div>
        </div>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "#C0C0D8" }}>{review.text}</p>
      <div className="h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

export function ClubProfileScreen() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { setClub, setZone } = useBooking();
  const [activeZone, setActiveZone] = useState<Zone | "All">("All");
  const [showAllReviews, setShowAllReviews] = useState(false);

  const club = mockClubs.find((c) => c.id === clubId);

  if (!club) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ color: "#8888AA" }}>Club not found</p>
      </div>
    );
  }

  const filteredPCs = activeZone === "All" ? club.pcs : club.pcs.filter((p) => p.zone === activeZone);
  const displayedReviews = showAllReviews ? club.reviews : club.reviews.slice(0, 3);

  const handleBookNow = () => {
    setClub(club.id, club.name);
    if (activeZone !== "All") setZone(activeZone);
    navigate(`/club/${club.id}/book`);
  };

  return (
    <div className="flex flex-col pb-28" style={{ background: "#0F0F0F" }}>
      {/* Photos overlay header */}
      <div className="relative">
        <PhotoGallery photos={club.photos} />
        <div className="absolute top-0 left-0 right-0 z-10">
          <ScreenHeader title={club.name} transparent />
        </div>
      </div>

      <div className="flex flex-col gap-5 px-4 pt-4">
        {/* Club info */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-white" style={{ fontSize: "20px", fontWeight: 700 }}>{club.name}</h1>
              <div className="flex items-center gap-1 mt-1">
                <MapPin size={13} color="#8888AA" />
                <span className="text-sm" style={{ color: "#8888AA" }}>{club.address}</span>
              </div>
            </div>
            <div className="text-right">
              <StarRating rating={club.rating} size={14} />
              <span className="text-xs mt-0.5 block" style={{ color: "#8888AA" }}>{club.reviewCount} reviews</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap mt-2">
            {club.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2.5 py-1 rounded-lg"
                style={{ background: "rgba(255,255,255,0.06)", color: "#A0A0B8", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Opening hours */}
        <GlowCard glow="none">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} color="#7C3AED" />
            <span className="text-white font-semibold text-sm">Opening Hours</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {club.openingHours.map((h) => (
              <div key={h.day} className="flex justify-between items-center">
                <span className="text-sm" style={{ color: "#8888AA" }}>{h.day}</span>
                <span className="text-sm font-semibold text-white">{h.hours}</span>
              </div>
            ))}
          </div>
        </GlowCard>

        {/* PC Zone tabs */}
        <div>
          <h2 className="text-white font-semibold mb-3" style={{ fontSize: "16px" }}>Available PCs</h2>
          <div
            className="flex rounded-xl p-1 mb-4 gap-1 overflow-x-auto"
            style={{ background: "rgba(13,13,26,0.8)" }}
          >
            {(["All", ...club.zones] as const).map((z) => (
              <button
                key={z}
                onClick={() => setActiveZone(z as Zone | "All")}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: activeZone === z
                    ? z === "VIP" ? "#7C3AED" : z === "Pro" ? "#06B6D4" : z === "Standard" ? "#2A2A3E" : "#7C3AED"
                    : "transparent",
                  color: activeZone === z
                    ? z === "Standard" ? "#D0D0E8" : "#FFFFFF"
                    : "#8888AA",
                  boxShadow: activeZone === z ? "0 0 10px rgba(124,58,237,0.3)" : "none",
                }}
              >
                {z}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {filteredPCs.slice(0, 6).map((pc) => (
              <PCSpecCard key={pc.id} pc={pc} />
            ))}
          </div>
        </div>

        {/* Pricing summary */}
        <GlowCard glow="cyan">
          <h3 className="text-white font-semibold mb-3" style={{ fontSize: "14px" }}>Pricing Overview</h3>
          <div className="flex flex-col gap-2">
            {club.zones.map((zone) => {
              const pc = club.pcs.find((p) => p.zone === zone);
              const color = zone === "VIP" ? "#A78BFA" : zone === "Pro" ? "#22D3EE" : "#8888AA";
              return (
                <div key={zone} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BadgeChip variant={zone} />
                    <span className="text-sm" style={{ color: "#C0C0D8" }}>{zone} seats</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color }}>${pc?.pricePerHour ?? "—"}/hr</span>
                </div>
              );
            })}
          </div>
        </GlowCard>

        {/* Reviews */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold" style={{ fontSize: "16px" }}>Reviews</h2>
            <div className="flex items-center gap-1">
              <Star size={14} fill="#F59E0B" color="#F59E0B" />
              <span className="text-sm font-bold text-white">{club.rating}</span>
              <span className="text-xs" style={{ color: "#8888AA" }}>({club.reviewCount})</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {displayedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          {club.reviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="w-full mt-3 py-2 rounded-xl text-sm font-semibold"
              style={{
                background: "rgba(124,58,237,0.1)",
                color: "#A78BFA",
                border: "1px solid rgba(124,58,237,0.2)",
              }}
            >
              {showAllReviews ? "Show less" : `See all ${club.reviews.length} reviews`}
            </button>
          )}
        </div>
      </div>

      {/* Sticky Book Now CTA */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full px-4 py-4"
        style={{
          maxWidth: "430px",
          background: "linear-gradient(to top, rgba(13,13,26,0.98) 60%, transparent)",
          zIndex: 30,
        }}
      >
        <GamingButton variant="purple" size="lg" fullWidth onClick={handleBookNow}>
          <Zap size={18} />
          Book Now — from ${club.minPricePerHour}/hr
        </GamingButton>
      </div>
    </div>
  );
}
