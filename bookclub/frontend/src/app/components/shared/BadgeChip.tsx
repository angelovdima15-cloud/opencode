import { ReactNode } from "react";

type ChipVariant = "VIP" | "Pro" | "Standard" | "upcoming" | "active" | "past" | "cancelled" | "purple" | "cyan" | "green" | "yellow";

interface BadgeChipProps {
  variant: ChipVariant;
  children?: ReactNode;
  size?: "sm" | "md";
}

const variantMap: Record<ChipVariant, { bg: string; color: string; border: string }> = {
  VIP: { bg: "rgba(124, 58, 237, 0.2)", color: "#A78BFA", border: "rgba(124, 58, 237, 0.4)" },
  Pro: { bg: "rgba(6, 182, 212, 0.15)", color: "#22D3EE", border: "rgba(6, 182, 212, 0.4)" },
  Standard: { bg: "rgba(255,255,255,0.08)", color: "#A0A0B8", border: "rgba(255,255,255,0.15)" },
  upcoming: { bg: "rgba(124, 58, 237, 0.15)", color: "#A78BFA", border: "rgba(124, 58, 237, 0.3)" },
  active: { bg: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "rgba(16, 185, 129, 0.3)" },
  past: { bg: "rgba(255,255,255,0.06)", color: "#8888AA", border: "rgba(255,255,255,0.1)" },
  cancelled: { bg: "rgba(239, 68, 68, 0.12)", color: "#F87171", border: "rgba(239, 68, 68, 0.3)" },
  purple: { bg: "rgba(124, 58, 237, 0.15)", color: "#A78BFA", border: "rgba(124, 58, 237, 0.3)" },
  cyan: { bg: "rgba(6, 182, 212, 0.15)", color: "#22D3EE", border: "rgba(6, 182, 212, 0.3)" },
  green: { bg: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "rgba(16, 185, 129, 0.3)" },
  yellow: { bg: "rgba(245, 158, 11, 0.15)", color: "#FCD34D", border: "rgba(245, 158, 11, 0.3)" },
};

export function BadgeChip({ variant, children, size = "sm" }: BadgeChipProps) {
  const style = variantMap[variant];
  const label = children ?? variant;

  return (
    <span
      className="inline-flex items-center rounded-lg font-semibold"
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: size === "sm" ? "11px" : "13px",
        padding: size === "sm" ? "2px 8px" : "4px 12px",
        letterSpacing: "0.02em",
      }}
    >
      {label}
    </span>
  );
}
