import { useNavigate } from "react-router";
import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";
import { motion } from "motion/react";

interface ScreenHeaderProps {
  title: string;
  onBack?: () => void;
  rightSlot?: ReactNode;
  transparent?: boolean;
}

export function ScreenHeader({ title, onBack, rightSlot, transparent }: ScreenHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-3 sticky top-0 z-20"
      style={{
        background: transparent
          ? "transparent"
          : "rgba(13, 17, 23, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: transparent ? "none" : "1px solid rgba(124, 58, 237, 0.15)",
      }}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleBack}
        className="flex items-center justify-center w-9 h-9 rounded-xl"
        style={{ background: "rgba(124, 58, 237, 0.15)", border: "1px solid rgba(124, 58, 237, 0.3)" }}
      >
        <ChevronLeft size={20} color="#7C3AED" />
      </motion.button>

      <span className="text-white font-semibold text-base">{title}</span>

      <div className="w-9 h-9 flex items-center justify-center">
        {rightSlot}
      </div>
    </div>
  );
}
