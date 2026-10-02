import React, { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export type StatCardColor = "accent" | "success" | "warning" | "danger" | "teal" | "purple" | "neutral";

export interface StatCardProps {
  label: string;
  value: ReactNode;
  subtitle?: string;
  icon?: LucideIcon | ReactNode;
  color?: StatCardColor;
  valueColor?: StatCardColor | "primary" | string;
  className?: string;
  style?: React.CSSProperties;
}

const colorMap: Record<StatCardColor, string> = {
  accent: "var(--cpx-accent, #0071e3)",
  success: "var(--cpx-success, #10b981)",
  warning: "var(--cpx-warning, #f59e0b)",
  danger: "var(--cpx-danger, #ff3b30)",
  teal: "var(--cpx-teal, #00a693)",
  purple: "var(--cpx-purple, #8b5cf6)",
  neutral: "var(--cpx-text-secondary, #6e6e73)",
};

/**
 * Tarjeta de métrica/KPI superior con borde izquierdo coloreado, ícono y subtítulo.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  color = "accent",
  valueColor,
  className = "",
  style,
}) => {
  const borderColor = colorMap[color] || colorMap.accent;
  
  const resolvedValueColor = valueColor
    ? (colorMap[valueColor as StatCardColor] || (valueColor === "primary" ? "var(--cpx-text-primary, #1d1d1f)" : valueColor))
    : "var(--cpx-text-primary, #1d1d1f)";

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon as any;
    return <IconComponent size={18} color={borderColor} />;
  };

  return (
    <div
      className={`cpx-card ${className}`}
      style={{
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        borderLeft: `4px solid ${borderColor}`,
        background: "#ffffff",
        borderRadius: "var(--cpx-radius, 14px)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "12px", color: "var(--cpx-text-secondary, #6e6e73)", fontWeight: 500 }}>
          {label}
        </span>
        {renderIcon()}
      </div>

      <div
        style={{
          fontSize: "22px",
          fontWeight: 700,
          color: resolvedValueColor,
        }}
        className="cpx-mono"
      >
        {value}
      </div>

      {subtitle && (
        <span style={{ fontSize: "11px", color: "var(--cpx-text-muted, #aeaeb2)" }}>
          {subtitle}
        </span>
      )}
    </div>
  );
};

export interface StatGridProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Grid responsivo contenedor de tarjetas de métricas / KPI.
 */
export const StatGrid: React.FC<StatGridProps> = ({
  children,
  className = "",
  style,
}) => {
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        marginBottom: "20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
};

export default StatCard;
