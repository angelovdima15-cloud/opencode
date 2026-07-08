import { ReactNode, HTMLAttributes } from "react";

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  glow?: "purple" | "cyan" | "none";
  padding?: string;
}

export function GlowCard({ children, glow = "purple", padding = "p-4", className = "", style, ...rest }: GlowCardProps) {
  const glowMap = {
    purple: {
      border: "1px solid rgba(124, 58, 237, 0.3)",
      boxShadow: "0 0 20px rgba(124, 58, 237, 0.08), inset 0 1px 0 rgba(124, 58, 237, 0.1)",
    },
    cyan: {
      border: "1px solid rgba(6, 182, 212, 0.3)",
      boxShadow: "0 0 20px rgba(6, 182, 212, 0.08), inset 0 1px 0 rgba(6, 182, 212, 0.1)",
    },
    none: {
      border: "1px solid rgba(255,255,255,0.08)",
      boxShadow: "none",
    },
  };

  return (
    <div
      className={`rounded-2xl ${padding} ${className}`}
      style={{
        background: "#1A1A2E",
        ...glowMap[glow],
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
