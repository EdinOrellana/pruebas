import type { ReactNode } from "react";

/** Colores disponibles para el badge (mapean a tokens del tema CPX). */
type BadgeColor = "accent" | "success" | "warning" | "danger" | "neutral";

const colorVar: Record<BadgeColor, string> = {
  accent: "var(--cpx-accent)",
  success: "var(--cpx-success)",
  warning: "var(--cpx-warning)",
  danger: "var(--cpx-danger)",
  neutral: "var(--cpx-text-secondary)",
};

interface BadgeProps {
  color?: BadgeColor;
  children: ReactNode;
}

/**
 * Chip de estado tipo pildora: fondo del color al 18% + texto del color solido.
 * Estructura base en styles/theme.css (.cpx-badge).
 */
export function Badge({ color = "neutral", children }: BadgeProps) {
  const c = colorVar[color];
  return (
    <span
      className="cpx-badge"
      style={{
        color: c,
        // 2E hex ≈ 18% de opacidad sobre el color solido
        background: `color-mix(in srgb, ${c} 18%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}
