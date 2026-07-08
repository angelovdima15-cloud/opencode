import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { CreditCard, Wallet, Smartphone, CheckCircle2, Zap, Shield } from "lucide-react";
import { toast } from "sonner";
import { useBooking } from "../../context/BookingContext";
import { ScreenHeader } from "../shared/ScreenHeader";
import { GlowCard } from "../shared/GlowCard";
import { GamingButton } from "../shared/GamingButton";
import { BadgeChip } from "../shared/BadgeChip";

type PaymentMethod = "card" | "applepay" | "googlepay" | "wallet";

interface Method {
  id: PaymentMethod;
  label: string;
  sub: string;
  icon: React.ElementType;
  color: string;
}

const METHODS: Method[] = [
  { id: "card", label: "Credit / Debit Card", sub: "Visa, Mastercard, Amex", icon: CreditCard, color: "#A78BFA" },
  { id: "googlepay", label: "Google Pay", sub: "Pay with Google account", icon: Smartphone, color: "#22D3EE" },
  { id: "applepay", label: "Apple Pay", sub: "Pay with Face ID / Touch ID", icon: Smartphone, color: "#F1F1F1" },
  { id: "wallet", label: "BookPC Wallet", sub: "Balance: $45.00 · 320 pts", icon: Wallet, color: "#34D399" },
];

export function PaymentScreen() {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const { booking, totalPrice, resetBooking } = useBooking();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [loading, setLoading] = useState(false);

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      resetBooking();
      toast.success("Booking confirmed! 🎮", {
        description: `Seat ${booking.selectedSeatNumber} at ${booking.clubName} is all yours.`,
      });
      navigate("/bookings", { replace: true });
    }, 1500);
  };

  return (
    <div className="flex flex-col pb-32" style={{ background: "#0F0F0F" }}>
      <ScreenHeader title="Payment" />

      <div className="flex flex-col gap-5 px-4 pt-4">
        {/* Order summary */}
        <GlowCard glow="purple">
          <h3 className="text-white font-semibold mb-3 text-sm">Order Summary</h3>
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-start">
              <span className="text-sm" style={{ color: "#8888AA" }}>Club</span>
              <span className="text-sm font-semibold text-white text-right max-w-[180px]">{booking.clubName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "#8888AA" }}>Zone</span>
              {booking.selectedZone && <BadgeChip variant={booking.selectedZone} />}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "#8888AA" }}>Seat</span>
              <span className="text-sm font-semibold text-white">{booking.selectedSeatNumber}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "#8888AA" }}>Date</span>
              <span className="text-sm font-semibold text-white">{booking.selectedDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "#8888AA" }}>Time</span>
              <span className="text-sm font-semibold text-white">{booking.selectedTime} ({booking.duration}h)</span>
            </div>
            <div className="h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: "#8888AA" }}>Rate</span>
              <span className="text-sm" style={{ color: "#D0D0E8" }}>${booking.pricePerHour}/hr × {booking.duration}h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-white">Total</span>
              <span className="font-bold" style={{ color: "#22D3EE", fontSize: "20px" }}>${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </GlowCard>

        {/* Payment methods */}
        <div>
          <h3 className="text-white font-semibold mb-3 text-sm">Payment Method</h3>
          <div className="flex flex-col gap-2.5">
            {METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <motion.button
                  key={method.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMethod(method.id)}
                  className="flex items-center gap-3 p-4 rounded-2xl transition-all text-left"
                  style={{
                    background: isSelected ? "rgba(124,58,237,0.12)" : "rgba(26,26,46,0.7)",
                    border: isSelected ? "1px solid rgba(124,58,237,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: isSelected ? "0 0 14px rgba(124,58,237,0.15)" : "none",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: isSelected ? `${method.color}22` : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isSelected ? method.color + "50" : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    <Icon size={20} color={isSelected ? method.color : "#8888AA"} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: isSelected ? "#F1F1F1" : "#C0C0D8" }}>
                      {method.label}
                    </p>
                    <p className="text-xs" style={{ color: "#8888AA" }}>{method.sub}</p>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      border: `2px solid ${isSelected ? "#7C3AED" : "rgba(255,255,255,0.2)"}`,
                      background: isSelected ? "#7C3AED" : "transparent",
                    }}
                  >
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <Shield size={14} color="#34D399" />
          <span className="text-xs" style={{ color: "#34D399" }}>256-bit SSL encrypted · Your payment is secure</span>
        </div>

        {/* Bonus points */}
        <GlowCard glow="cyan">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(6,182,212,0.15)" }}>
              <Zap size={18} color="#22D3EE" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Earn Bonus Points</p>
              <p className="text-xs" style={{ color: "#8888AA" }}>
                You'll earn <span style={{ color: "#22D3EE", fontWeight: 600 }}>+{Math.round(totalPrice * 10)} pts</span> for this booking
              </p>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Confirm button */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full px-4 py-4"
        style={{
          maxWidth: "430px",
          background: "linear-gradient(to top, rgba(13,13,26,0.98) 60%, transparent)",
          zIndex: 30,
        }}
      >
        <GamingButton variant="purple" size="lg" fullWidth onClick={handleConfirm} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Confirm Booking · ${totalPrice.toFixed(2)}
            </>
          )}
        </GamingButton>
      </div>
    </div>
  );
}
