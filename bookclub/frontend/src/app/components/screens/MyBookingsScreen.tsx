import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Clock, MapPin, QrCode, X, ChevronRight } from "lucide-react";
import { mockBookings, Booking, BookingStatus } from "../../data/mockBookings";
import { BadgeChip } from "../shared/BadgeChip";
import { GlowCard } from "../shared/GlowCard";
import { GamingButton } from "../shared/GamingButton";
import { QRCodePlaceholder } from "../shared/QRCodePlaceholder";
import { ImageWithFallback } from "../figma/ImageWithFallback";

type Tab = "upcoming" | "active" | "past";

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: () => void }) {
  const [showQR, setShowQR] = useState(false);
  const isActive = booking.status === "active";
  const isUpcoming = booking.status === "upcoming";

  return (
    <GlowCard glow={isActive ? "cyan" : isUpcoming ? "purple" : "none"} padding="p-0" className="overflow-hidden">
      {/* Club photo header */}
      <div className="relative" style={{ height: "90px" }}>
        <ImageWithFallback
          src={booking.clubPhoto}
          alt={booking.clubName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(13,13,26,0.9) 0%, rgba(13,13,26,0.4) 100%)" }} />
        <div className="absolute inset-0 flex items-center justify-between px-4">
          <div>
            <p className="text-white font-bold text-sm">{booking.clubName}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <BadgeChip variant={booking.zone} size="sm" />
              <span className="text-xs font-semibold" style={{ color: "#F1F1F1" }}>Seat {booking.seatNumber}</span>
            </div>
          </div>
          <BadgeChip variant={booking.status} size="sm">
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </BadgeChip>
        </div>
      </div>

      {/* Details */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={14} color="#7C3AED" />
            <span className="text-xs text-white">{booking.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock size={14} color="#06B6D4" />
            <span className="text-xs text-white">{booking.startTime} – {booking.endTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} color="#8888AA" />
            <span className="text-xs" style={{ color: "#8888AA" }}>{booking.duration}h session</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: "#A78BFA" }}>${booking.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {(isActive || isUpcoming) && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowQR(!showQR)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: "rgba(124,58,237,0.15)",
                color: "#A78BFA",
                border: "1px solid rgba(124,58,237,0.3)",
              }}
            >
              <QrCode size={16} />
              Check-in QR
            </motion.button>
          )}
          {isUpcoming && (
            <GamingButton variant="destructive" size="sm" onClick={onCancel}>
              <X size={14} />
              Cancel
            </GamingButton>
          )}
          {booking.status === "past" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                background: "rgba(255,255,255,0.05)",
                color: "#8888AA",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Book Again
              <ChevronRight size={14} />
            </motion.button>
          )}
        </div>

        {/* QR Code */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 flex justify-center">
                <QRCodePlaceholder code={booking.qrCode} />
              </div>
              <p className="text-center text-xs mt-2" style={{ color: "#8888AA" }}>
                Show this QR at the reception to check in
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GlowCard>
  );
}

export function MyBookingsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [bookings, setBookings] = useState(mockBookings);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "upcoming", label: "Upcoming", count: bookings.filter((b) => b.status === "upcoming").length },
    { key: "active", label: "Active", count: bookings.filter((b) => b.status === "active").length },
    { key: "past", label: "Past", count: bookings.filter((b) => b.status === "past" || b.status === "cancelled").length },
  ];

  const filtered = bookings.filter((b) =>
    activeTab === "upcoming" ? b.status === "upcoming" :
    activeTab === "active" ? b.status === "active" :
    b.status === "past" || b.status === "cancelled"
  );

  const handleCancel = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => b.id === id ? { ...b, status: "cancelled" as BookingStatus } : b)
    );
  };

  return (
    <div className="flex flex-col px-4 pt-4 pb-4 gap-4">
      {/* Header */}
      <div>
        <h1 className="text-white" style={{ fontSize: "22px", fontWeight: 700 }}>My Bookings</h1>
        <p className="text-sm" style={{ color: "#8888AA" }}>Track and manage your sessions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all relative"
            style={{
              background: activeTab === tab.key ? "rgba(124,58,237,0.2)" : "rgba(26,26,46,0.8)",
              color: activeTab === tab.key ? "#A78BFA" : "#8888AA",
              border: activeTab === tab.key ? "1px solid rgba(124,58,237,0.4)" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: "#7C3AED", color: "#FFFFFF" }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Booking list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col gap-3"
        >
          {filtered.length > 0 ? (
            filtered.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={() => handleCancel(booking.id)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center py-16 gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
              >
                <Calendar size={32} color="#2A2A3E" />
              </div>
              <p className="text-sm text-center" style={{ color: "#8888AA" }}>
                No {activeTab} bookings yet.<br />
                {activeTab === "upcoming" ? "Find a club and book a session!" : "Your sessions will appear here."}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
