import React, { useState } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS DE DISEÑO — Guía de Estilos Visuales y Sistema de Diseño
// ─────────────────────────────────────────────────────────────────────────────
export const T = {
  bg: "#e8f0fe",
  surface: "#ffffff",
  sidebar: "#0b1a38",
  sidebarHover: "rgba(255,255,255,0.06)",
  sidebarActive: "rgba(255,255,255,0.10)",
  text: "#1d1d1f",
  textSub: "#6e6e73",
  textMuted: "#aeaeb2",
  border: "rgba(0,0,0,0.06)",
  accent: "#0071e3",
  accentSub: "#e8f1fb",
  teal: "#00a693",
  purple: "#8b5cf6",
  danger: "#ff3b30",
  warn: "#ff9500",
  success: "#34c759",
  radius: "14px",
  radiusSm: "10px",
  shadow: "0 2px 16px rgba(0,0,0,0.06)",
  shadowMd: "0 4px 24px rgba(0,0,0,0.09)",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// FORMATO DE MONEDA — Quetzales guatemaltecos
// ─────────────────────────────────────────────────────────────────────────────
export const fmt = (n: number): string =>
  new Intl.NumberFormat("es-GT", {
    style: "currency",
    currency: "GTQ",
    minimumFractionDigits: 2,
  }).format(n);

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES PRIMITIVOS
// ─────────────────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: T.surface,
        borderRadius: T.radius,
        boxShadow: T.shadow,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function Chip({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 500,
        padding: "2px 9px",
        borderRadius: 20,
        background: color + "18",
        color,
        lineHeight: "20px",
      }}
    >
      {children}
    </span>
  );
}

export interface ColDef {
  label: string;
  align?: "l" | "r";
}

export function TH({ cols }: { cols: (string | ColDef)[] }) {
  return (
    <thead>
      <tr style={{ borderBottom: `1px solid ${T.border}` }}>
        {cols.map((c, i) => {
          const label = typeof c === "string" ? c : c.label;
          const align =
            typeof c === "string" ? "left" : c.align === "r" ? "right" : "left";
          return (
            <th
              key={i}
              style={{
                textAlign: align as "left" | "right",
                fontSize: 11,
                fontWeight: 500,
                color: T.textMuted,
                padding: "10px 16px",
                letterSpacing: "0.02em",
                background: "rgba(0,0,0,0.015)",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}

export function TR({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  const [hover, setHover] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        borderBottom: `1px solid ${T.border}`,
        transition: "background .12s",
        background: hover ? "rgba(0,0,0,0.018)" : "transparent",
        ...style,
      }}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: "12px 16px",
        textAlign: "left",
        fontSize: 13,
        color: T.text,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

export function TDR({
  children,
  style = {},
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: "12px 16px",
        textAlign: "right",
        fontFamily: T.mono,
        fontSize: 13,
        color: T.text,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTES DE ALERTA Y NOTIFICACIONES
// ─────────────────────────────────────────────────────────────────────────────
export { Alert, type AlertProps, type AlertVariant } from "./Alert";
export { type ToastType } from "./Toast";
export { Toast, type ToastProps } from "./StandaloneToast";
export { Badge } from "./Badge";
export { Button } from "./Button";
export { Modal } from "./Modal";

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE DE PAGINACIÓN
// ─────────────────────────────────────────────────────────────────────────────
export { Pagination, type PaginationProps } from "./Pagination";
export { GuideBanner, type GuideBannerProps, type GuideStep } from "./GuideBanner";
export { TableSearchBar, type TableSearchBarProps, type SearchTabOption } from "./TableSearchBar";
export { FilterDropdown, type FilterDropdownProps, type FilterOption } from "./FilterDropdown";
export { HintTooltip, type HintTooltipProps } from "./HintTooltip";
export { SearchableSelect, type SelectOption } from "./SearchableSelect";
export { StatCard, StatGrid, type StatCardProps, type StatGridProps } from "./StatCard";
export { StatusBadge, type StatusBadgeProps, type StatusType } from "./StatusBadge";
export { FormField } from "./FormField";
export { IconBtn } from "./IconBtn";
export { SH } from "./SH";



