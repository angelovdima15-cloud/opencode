import { useState } from "react";
import { motion } from "motion/react";
import {
  User, Mail, Phone, Edit2, Bell, BellOff, Shield, HelpCircle,
  LogOut, ChevronRight, Zap, Trophy, Clock, Star, Crown
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router";
import { GlowCard } from "../shared/GlowCard";
import { BadgeChip } from "../shared/BadgeChip";
import { GamingButton } from "../shared/GamingButton";

function LoyaltyWidget({ points, nextLevel }: { points: number; nextLevel: number }) {
  const pct = Math.round((points / nextLevel) * 100);
  return (
    <GlowCard glow="cyan" padding="p-4">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, rgba(6,182,212,0.3), rgba(124,58,237,0.3))" }}
        >
          <Zap size={20} color="#22D3EE" />
        </div>
        <div>
          <p className="text-white font-bold" style={{ fontSize: "18px" }}>{points.toLocaleString()} pts</p>
          <p className="text-xs" style={{ color: "#8888AA" }}>BookPC Loyalty Points</p>
        </div>
        <div className="ml-auto">
          <BadgeChip variant="cyan">Diamond</BadgeChip>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-1 flex justify-between text-xs" style={{ color: "#8888AA" }}>
        <span>{points.toLocaleString()} pts</span>
        <span>{nextLevel.toLocaleString()} pts to Legend</span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: "8px", background: "rgba(255,255,255,0.08)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, #06B6D4, #7C3AED)" }}
        />
      </div>
      <p className="text-xs mt-2 text-center" style={{ color: "#8888AA" }}>
        {nextLevel - points} points away from <span style={{ color: "#A78BFA" }}>Legend</span> rank
      </p>

      {/* Quick rewards */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { pts: 500, label: "Free 1hr" },
          { pts: 1000, label: "VIP Access" },
          { pts: 2500, label: "Free Day" },
        ].map((reward) => (
          <button
            key={reward.pts}
            className="flex flex-col items-center py-2 rounded-xl"
            style={{
              background: points >= reward.pts ? "rgba(6,182,212,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${points >= reward.pts ? "rgba(6,182,212,0.3)" : "rgba(255,255,255,0.08)"}`,
              opacity: points >= reward.pts ? 1 : 0.5,
            }}
          >
            <Zap size={12} color={points >= reward.pts ? "#22D3EE" : "#8888AA"} />
            <span className="text-[10px] font-bold mt-0.5" style={{ color: points >= reward.pts ? "#22D3EE" : "#8888AA" }}>{reward.pts}p</span>
            <span className="text-[9px]" style={{ color: "#8888AA" }}>{reward.label}</span>
          </button>
        ))}
      </div>
    </GlowCard>
  );
}

function StatCard({ icon: Icon, value, label, color }: { icon: React.ElementType; value: string | number; label: string; color: string }) {
  return (
    <GlowCard glow="none" padding="p-3" className="flex flex-col items-center gap-1">
      <Icon size={18} color={color} />
      <span className="font-bold text-white" style={{ fontSize: "18px" }}>{value}</span>
      <span className="text-[10px] text-center" style={{ color: "#8888AA" }}>{label}</span>
    </GlowCard>
  );
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    booking: true,
    promotions: true,
    reminders: true,
    news: false,
  });

  const items = [
    { key: "booking" as const, label: "Booking updates", sub: "Confirmations, changes, check-in" },
    { key: "promotions" as const, label: "Promotions & deals", sub: "Weekend offers, discount codes" },
    { key: "reminders" as const, label: "Session reminders", sub: "30 min before your booking" },
    { key: "news" as const, label: "News & events", sub: "Tournaments, new clubs, features" },
  ];

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between px-1">
          <div>
            <p className="text-sm font-semibold text-white">{item.label}</p>
            <p className="text-xs" style={{ color: "#8888AA" }}>{item.sub}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSettings((s) => ({ ...s, [item.key]: !s[item.key] }))}
            className="relative rounded-full transition-all flex-shrink-0"
            style={{
              width: "44px",
              height: "24px",
              background: settings[item.key] ? "#7C3AED" : "rgba(255,255,255,0.1)",
              border: `1px solid ${settings[item.key] ? "rgba(124,58,237,0.6)" : "rgba(255,255,255,0.15)"}`,
              boxShadow: settings[item.key] ? "0 0 8px rgba(124,58,237,0.4)" : "none",
            }}
          >
            <motion.div
              animate={{ x: settings[item.key] ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="absolute top-[2px] w-[18px] h-[18px] rounded-full"
              style={{ background: "#FFFFFF" }}
            />
          </motion.button>
        </div>
      ))}
    </div>
  );
}

interface MenuRowProps {
  icon: React.ElementType;
  label: string;
  sub?: string;
  color?: string;
  onClick?: () => void;
  danger?: boolean;
}

function MenuRow({ icon: Icon, label, sub, color = "#8888AA", onClick, danger }: MenuRowProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 rounded-xl px-3 text-left"
      style={{
        background: "rgba(26,26,46,0.6)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: danger ? "rgba(239,68,68,0.12)" : "rgba(124,58,237,0.1)",
          border: `1px solid ${danger ? "rgba(239,68,68,0.25)" : "rgba(124,58,237,0.2)"}`,
        }}
      >
        <Icon size={18} color={danger ? "#F87171" : color} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: danger ? "#F87171" : "#F1F1F1" }}>{label}</p>
        {sub && <p className="text-xs" style={{ color: "#8888AA" }}>{sub}</p>}
      </div>
      <ChevronRight size={16} color="#8888AA" />
    </motion.button>
  );
}

export function ProfileScreen() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  if (!user) return null;

  return (
    <div className="flex flex-col px-4 pt-4 pb-4 gap-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{
              background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
              boxShadow: "0 0 20px rgba(124,58,237,0.4)",
            }}
          >
            {user.name[0]}
          </div>
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "#F59E0B", border: "2px solid #0F0F0F" }}
          >
            <Crown size={10} color="#FFFFFF" />
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-white font-bold" style={{ fontSize: "18px" }}>{user.name}</h1>
          <p className="text-xs" style={{ color: "#8888AA" }}>{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <BadgeChip variant="yellow" size="sm">Level {user.level}</BadgeChip>
            <BadgeChip variant="purple" size="sm">{user.rank}</BadgeChip>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
        >
          <Edit2 size={16} color="#A78BFA" />
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={Trophy} value={user.totalBookings} label="Bookings" color="#A78BFA" />
        <StatCard icon={Clock} value={`${user.totalHours}h`} label="Hours played" color="#22D3EE" />
        <StatCard icon={Star} value={user.rank} label="Rank" color="#F59E0B" />
      </div>

      {/* Loyalty */}
      <LoyaltyWidget points={user.bonusPoints} nextLevel={user.pointsToNextLevel} />

      {/* Profile info */}
      <GlowCard glow="none">
        <h3 className="text-white font-semibold text-sm mb-3">Account Info</h3>
        <div className="flex flex-col gap-2.5">
          {[
            { icon: User, label: user.name, sub: "Display name" },
            { icon: Mail, label: user.email, sub: "Email address" },
            { icon: Phone, label: user.phone, sub: "Phone number" },
          ].map((item) => (
            <div key={item.sub} className="flex items-center gap-3">
              <item.icon size={16} color="#8888AA" />
              <div>
                <p className="text-sm text-white">{item.label}</p>
                <p className="text-xs" style={{ color: "#8888AA" }}>{item.sub}</p>
              </div>
            </div>
          ))}
          <p className="text-xs" style={{ color: "#8888AA" }}>Member since {user.memberSince}</p>
        </div>
      </GlowCard>

      {/* Notifications */}
      <GlowCard glow="none">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Bell size={16} color="#7C3AED" />
            <span className="text-white font-semibold text-sm">Notifications</span>
          </div>
          <ChevronRight size={16} color="#8888AA" style={{ transform: notifOpen ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
        </button>
        {notifOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 overflow-hidden"
          >
            <NotificationSettings />
          </motion.div>
        )}
      </GlowCard>

      {/* Menu */}
      <div className="flex flex-col gap-2">
        <MenuRow icon={Shield} label="Privacy & Security" sub="Password, 2FA, data" color="#A78BFA" />
        <MenuRow icon={HelpCircle} label="Help & Support" sub="FAQ, contact, feedback" color="#22D3EE" />
        <MenuRow icon={LogOut} label="Log Out" danger onClick={handleLogout} />
      </div>

      <p className="text-center text-xs pb-2" style={{ color: "#555570" }}>BookPC v1.0.0 · Made for gamers</p>
    </div>
  );
}
