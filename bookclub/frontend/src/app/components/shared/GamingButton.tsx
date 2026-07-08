import { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "motion/react";

type Variant = "purple" | "cyan" | "outline-purple" | "outline-cyan" | "ghost" | "destructive";

interface GamingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  purple: {
    background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
    color: "#FFFFFF",
    boxShadow: "0 0 20px rgba(124, 58, 237, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
    border: "1px solid rgba(124, 58, 237, 0.6)",
  },
  cyan: {
    background: "linear-gradient(135deg, #06B6D4, #0891B2)",
    color: "#0F0F0F",
    boxShadow: "0 0 20px rgba(6, 182, 212, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
    border: "1px solid rgba(6, 182, 212, 0.6)",
  },
  "outline-purple": {
    background: "rgba(124, 58, 237, 0.1)",
    color: "#7C3AED",
    border: "1px solid rgba(124, 58, 237, 0.5)",
    boxShadow: "0 0 10px rgba(124, 58, 237, 0.15)",
  },
  "outline-cyan": {
    background: "rgba(6, 182, 212, 0.1)",
    color: "#06B6D4",
    border: "1px solid rgba(6, 182, 212, 0.5)",
    boxShadow: "0 0 10px rgba(6, 182, 212, 0.15)",
  },
  ghost: {
    background: "rgba(255,255,255,0.05)",
    color: "#F1F1F1",
    border: "1px solid rgba(255,255,255,0.1)",
  },
  destructive: {
    background: "rgba(239, 68, 68, 0.15)",
    color: "#EF4444",
    border: "1px solid rgba(239, 68, 68, 0.4)",
  },
};

const sizeStyles = {
  sm: { padding: "6px 14px", fontSize: "13px", borderRadius: "10px" },
  md: { padding: "10px 20px", fontSize: "15px", borderRadius: "12px" },
  lg: { padding: "14px 28px", fontSize: "16px", borderRadius: "14px" },
};

export function GamingButton({
  variant = "purple",
  size = "md",
  children,
  fullWidth,
  style,
  disabled,
  ...rest
}: GamingButtonProps) {
  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.97 }}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? "100%" : "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        transition: "all 0.2s",
        ...style,
      }}
      disabled={disabled}
      {...(rest as any)}
    >
      {children}
    </motion.button>
  );
}
