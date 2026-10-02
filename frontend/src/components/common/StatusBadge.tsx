import React, { ReactNode } from "react";

export type StatusType =
  | "ACTIVA"
  | "INACTIVA"
  | "GASTO"
  | "REPOSICION"
  | "REPOSICIÓN"
  | "ANULADO"
  | "ANULADA"
  | "PENDIENTE"
  | string;

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  dot?: boolean;
  color?: "success" | "danger" | "warning" | "neutral" | "accent" | "purple";
  /** Sobreescribe el simbolo de punto calculado automaticamente ("filled" = "●", "hollow" = "○"). */
  forceDot?: "filled" | "hollow";
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}

/**
 * Badge de estado con indicador visual '●' / '○' y colores semánticos armoniosos.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  dot = true,
  color: customColor,
  forceDot,
  className = "",
  style,
  children,
}) => {
  const norm = String(status || "").trim().toUpperCase();

  let autoColor: "success" | "danger" | "warning" | "neutral" | "accent" | "purple" = "neutral";
  let displayDot = dot ? "●" : "";
  let displayText = label || children || status;

  if (norm === "ACTIVA" || norm === "A" || norm === "REPOSICION" || norm === "REPOSICIÓN") {
    autoColor = "success";
    displayDot = "●";
    if (!label && !children) {
      displayText = norm === "A" ? "ACTIVA" : norm === "REPOSICION" ? "REPOSICIÓN" : norm;
    }
  } else if (norm === "INACTIVA" || norm === "I") {
    autoColor = "danger";
    displayDot = "○";
    if (!label && !children) {
      displayText = "INACTIVA";
    }
  } else if (norm === "GASTO") {
    autoColor = "danger";
    displayDot = "●";
  } else if (norm === "ANULADO" || norm === "ANULADA") {
    autoColor = "neutral";
    displayDot = "○";
  } else if (norm === "PENDIENTE") {
    autoColor = "warning";
    displayDot = "●";
  }

  if (forceDot) {
    displayDot = forceDot === "filled" ? "●" : "○";
  }

  const colorFinal = customColor || autoColor;

  const colorStyles: Record<string, { bg: string; color: string; border: string }> = {
    success: {
      bg: "rgba(16, 185, 129, 0.12)",
      color: "#059669",
      border: "rgba(16, 185, 129, 0.25)",
    },
    danger: {
      bg: "rgba(255, 59, 48, 0.12)",
      color: "#dc2626",
      border: "rgba(255, 59, 48, 0.25)",
    },
    warning: {
      bg: "rgba(245, 158, 11, 0.12)",
      color: "#d97706",
      border: "rgba(245, 158, 11, 0.25)",
    },
    accent: {
      bg: "rgba(0, 113, 227, 0.12)",
      color: "#0071e3",
      border: "rgba(0, 113, 227, 0.25)",
    },
    neutral: {
      bg: "rgba(100, 116, 139, 0.12)",
      color: "#64748b",
      border: "rgba(100, 116, 139, 0.25)",
    },
    purple: {
      bg: "rgba(139, 92, 246, 0.12)",
      color: "#7c3aed",
      border: "rgba(139, 92, 246, 0.25)",
    },
  };

  const currentStyle = colorStyles[colorFinal] || colorStyles.neutral;

  return (
    <span
      className={`cpx-badge ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "var(--cpx-radius-pill, 20px)",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.02em",
        background: currentStyle.bg,
        color: currentStyle.color,
        border: `1px solid ${currentStyle.border}`,
        lineHeight: "1.4",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {displayDot && <span style={{ fontSize: "9px" }}>{displayDot}</span>}
      <span>{displayText}</span>
    </span>
  );
};

export default StatusBadge;
