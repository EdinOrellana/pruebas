import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type KpiColor = "accent" | "success" | "warning" | "danger";

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  color?: KpiColor;
  /** Resaltada cuando actua como filtro activo sobre la tabla. */
  active?: boolean;
  onClick?: () => void;
}

const colorVar: Record<KpiColor, string> = {
  accent: "var(--cpx-accent)",
  success: "var(--cpx-success)",
  warning: "var(--cpx-warning)",
  danger: "var(--cpx-danger)",
};

/** Tarjeta de indicador (KPI) clicable: sistema CPX (.cpx-kpi-card en styles/theme.css). */
export function KpiCard({
  icon: Icon,
  label,
  value,
  color = "accent",
  active,
  onClick,
}: KpiCardProps) {
  const c = colorVar[color];
  return (
    <button
      type="button"
      className={`cpx-kpi-card${active ? " cpx-kpi-card--active" : ""}`}
      onClick={onClick}
      style={active ? { borderColor: c } : undefined}
    >
      <div
        className="cpx-kpi-card__icon"
        style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }}
      >
        <Icon size={18} />
      </div>
      <div>
        <div className="cpx-kpi-card__value">{value}</div>
        <div className="cpx-kpi-card__label">{label}</div>
      </div>
    </button>
  );
}
