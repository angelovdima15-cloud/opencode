import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { Calendar, Clock, Minus, Plus, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { mockClubs, Zone } from "../../data/mockClubs";
import { useBooking } from "../../context/BookingContext";
import { ScreenHeader } from "../shared/ScreenHeader";
import { GlowCard } from "../shared/GlowCard";
import { GamingButton } from "../shared/GamingButton";
import { BadgeChip } from "../shared/BadgeChip";
import { SeatGrid } from "../shared/SeatGrid";

const TIME_SLOTS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00",
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00",
  "21:00", "22:00", "23:00",
];

const zoneColors: Record<Zone, string> = { VIP: "#A78BFA", Pro: "#22D3EE", Standard: "#8888AA" };

export function BookingScreen() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { booking, setDate, setTime, setSeat, setZone, setDuration, totalPrice } = useBooking();

  const club = mockClubs.find((c) => c.id === clubId);

  const today = startOfDay(new Date());
  const dateOptions = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  const [dateScroll, setDateScroll] = useState(0);

  useEffect(() => {
    if (!booking.selectedDate) {
      setDate(format(today, "yyyy-MM-dd"));
    }
    if (!booking.selectedTime) {
      setTime("18:00");
    }
    if (!booking.selectedZone && club) {
      setZone(club.zones[0]);
    }
  }, []);

  if (!club) return null;

  const availableZones = club.zones;
  const endTime = booking.selectedTime
    ? (() => {
        const [h] = booking.selectedTime.split(":").map(Number);
        const endH = (h + booking.duration) % 24;
        return `${String(endH).padStart(2, "0")}:00`;
      })()
    : "";

  const canProceed =
    booking.selectedDate &&
    booking.selectedTime &&
    booking.selectedSeatId &&
    booking.selectedZone;

  return (
    <div className="flex flex-col pb-32" style={{ background: "#0F0F0F" }}>
      <ScreenHeader title="Book a Seat" />

      <div className="flex flex-col gap-5 px-4 pt-4">
        {/* Club name */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.2)" }}
        >
          <Zap size={14} color="#A78BFA" />
          <span className="text-sm font-semibold" style={{ color: "#A78BFA" }}>{club.name}</span>
        </div>

        {/* Zone selector */}
        <GlowCard glow="purple">
          <h3 className="text-white font-semibold mb-3 text-sm">Select Zone</h3>
          <div className="flex gap-2">
            {availableZones.map((z) => (
              <motion.button
                key={z}
                whileTap={{ scale: 0.95 }}
                onClick={() => setZone(z)}
                className="flex-1 py-3 rounded-xl flex flex-col items-center gap-1 transition-all"
                style={{
                  background: booking.selectedZone === z
                    ? z === "VIP" ? "rgba(124,58,237,0.3)" : z === "Pro" ? "rgba(6,182,212,0.25)" : "rgba(255,255,255,0.1)"
                    : "rgba(15,15,15,0.6)",
                  border: `1px solid ${booking.selectedZone === z ? zoneColors[z] : "rgba(255,255,255,0.08)"}`,
                  boxShadow: booking.selectedZone === z ? `0 0 14px ${zoneColors[z]}40` : "none",
                }}
              >
                <BadgeChip variant={z} />
                <span className="text-xs" style={{ color: zoneColors[z], opacity: 0.8 }}>
                  ${club.pcs.find((p) => p.zone === z)?.pricePerHour ?? "—"}/hr
                </span>
              </motion.button>
            ))}
          </div>
        </GlowCard>

        {/* Date picker */}
        <GlowCard glow="none">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar size={16} color="#7C3AED" />
              <h3 className="text-white font-semibold text-sm">Select Date</h3>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setDateScroll(Math.max(0, dateScroll - 3))} className="p-1 rounded-lg" style={{ background: "rgba(124,58,237,0.1)" }}>
                <ChevronLeft size={14} color="#7C3AED" />
              </button>
              <button onClick={() => setDateScroll(Math.min(7, dateScroll + 3))} className="p-1 rounded-lg" style={{ background: "rgba(124,58,237,0.1)" }}>
                <ChevronRight size={14} color="#7C3AED" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {dateOptions.slice(dateScroll, dateScroll + 7).map((date) => {
              const key = format(date, "yyyy-MM-dd");
              const isSelected = booking.selectedDate === key;
              const isToday = format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
              return (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setDate(key)}
                  className="flex-shrink-0 flex flex-col items-center py-2 px-3 rounded-xl transition-all"
                  style={{
                    background: isSelected ? "#7C3AED" : "rgba(15,15,15,0.6)",
                    border: isSelected ? "1px solid #7C3AED" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isSelected ? "0 0 12px rgba(124,58,237,0.4)" : "none",
                    minWidth: "50px",
                  }}
                >
                  <span className="text-[10px] uppercase font-semibold" style={{ color: isSelected ? "rgba(255,255,255,0.8)" : "#8888AA" }}>
                    {format(date, "EEE")}
                  </span>
                  <span className="text-base font-bold" style={{ color: isSelected ? "#FFFFFF" : "#D0D0E8" }}>
                    {format(date, "d")}
                  </span>
                  <span className="text-[10px]" style={{ color: isSelected ? "rgba(255,255,255,0.7)" : "#8888AA" }}>
                    {isToday ? "Today" : format(date, "MMM")}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </GlowCard>

        {/* Time slots */}
        <GlowCard glow="none">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} color="#06B6D4" />
            <h3 className="text-white font-semibold text-sm">Select Time</h3>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {TIME_SLOTS.map((slot) => {
              const isSelected = booking.selectedTime === slot;
              return (
                <motion.button
                  key={slot}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setTime(slot)}
                  className="py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: isSelected ? "rgba(6,182,212,0.25)" : "rgba(15,15,15,0.6)",
                    color: isSelected ? "#22D3EE" : "#8888AA",
                    border: isSelected ? "1px solid #06B6D4" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isSelected ? "0 0 10px rgba(6,182,212,0.3)" : "none",
                  }}
                >
                  {slot}
                </motion.button>
              );
            })}
          </div>
        </GlowCard>

        {/* Duration picker */}
        <GlowCard glow="none">
          <h3 className="text-white font-semibold text-sm mb-3">Duration</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setDuration(Math.max(1, booking.duration - 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
              >
                <Minus size={16} color="#A78BFA" />
              </motion.button>
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{booking.duration}</span>
                <span className="text-xs" style={{ color: "#8888AA" }}>hours</span>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setDuration(Math.min(8, booking.duration + 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
              >
                <Plus size={16} color="#A78BFA" />
              </motion.button>
            </div>

            {booking.selectedTime && (
              <div className="text-right">
                <span className="text-xs" style={{ color: "#8888AA" }}>Session time</span>
                <p className="text-sm font-bold text-white">
                  {booking.selectedTime} – {endTime}
                </p>
              </div>
            )}
          </div>
        </GlowCard>

        {/* Seat selection */}
        <GlowCard glow="purple">
          <h3 className="text-white font-semibold text-sm mb-3">Select Seat</h3>
          <SeatGrid
            pcs={club.pcs}
            selectedZone={booking.selectedZone}
            selectedSeatId={booking.selectedSeatId}
            onSelectSeat={(pc) => setSeat(pc.id, pc.seatNumber, pc.pricePerHour)}
          />
        </GlowCard>

        {/* Price summary */}
        {booking.selectedSeatId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <GlowCard glow="cyan">
              <h3 className="text-white font-semibold text-sm mb-3">Price Summary</h3>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8888AA" }}>Seat {booking.selectedSeatNumber}</span>
                  <span style={{ color: "#D0D0E8" }}>${booking.pricePerHour}/hr</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#8888AA" }}>Duration</span>
                  <span style={{ color: "#D0D0E8" }}>{booking.duration} hours</span>
                </div>
                <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                <div className="flex justify-between">
                  <span className="font-bold text-white">Total</span>
                  <span className="font-bold" style={{ color: "#22D3EE", fontSize: "18px" }}>${totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        )}
      </div>

      {/* Bottom CTA */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full px-4 py-4"
        style={{
          maxWidth: "430px",
          background: "linear-gradient(to top, rgba(13,13,26,0.98) 60%, transparent)",
          zIndex: 30,
        }}
      >
        {totalPrice > 0 && (
          <p className="text-center text-xs mb-2" style={{ color: "#8888AA" }}>
            Total: <span className="font-bold" style={{ color: "#22D3EE" }}>${totalPrice.toFixed(2)}</span>
          </p>
        )}
        <GamingButton
          variant="purple"
          size="lg"
          fullWidth
          disabled={!canProceed}
          onClick={() => navigate(`/club/${clubId}/book/payment`)}
        >
          <Zap size={18} />
          Proceed to Payment
        </GamingButton>
      </div>
    </div>
  );
}
