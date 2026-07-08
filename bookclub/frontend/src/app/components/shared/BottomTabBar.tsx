import { useLocation, useNavigate } from "react-router";
import { Home, Calendar, User } from "lucide-react";
import { motion } from "motion/react";

const tabs = [
  { path: "/", label: "Home", icon: Home },
  { path: "/bookings", label: "Bookings", icon: Calendar },
  { path: "/profile", label: "Profile", icon: User },
];

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className="flex-shrink-0 border-t"
      style={{
        background: "linear-gradient(to top, #0D1117, #1A1A2E)",
        borderColor: "rgba(124, 58, 237, 0.2)",
      }}
    >
      <div className="flex items-center justify-around h-[68px] px-4">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.path}
              whileTap={{ scale: 0.85 }}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all"
              style={{
                background: active ? "rgba(124, 58, 237, 0.12)" : "transparent",
              }}
            >
              <div className="relative">
                <Icon
                  size={22}
                  style={{
                    color: active ? "#7C3AED" : "#8888AA",
                    filter: active ? "drop-shadow(0 0 6px rgba(124, 58, 237, 0.7))" : "none",
                    transition: "all 0.2s",
                  }}
                />
                {active && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "#7C3AED" }}
                  />
                )}
              </div>
              <span
                className="text-[11px]"
                style={{
                  color: active ? "#7C3AED" : "#8888AA",
                  fontWeight: active ? 600 : 400,
                  transition: "color 0.2s",
                }}
              >
                {tab.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
