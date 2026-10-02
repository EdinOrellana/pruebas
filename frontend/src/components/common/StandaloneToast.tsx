import type { ReactNode, CSSProperties } from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { ToastType } from "./Toast";

/**
 * Toast flotante de uso puntual (fuera del <ToastProvider>), controlado por
 * el propio componente que lo renderiza (ej. CajaChicaMovimiento). Vive
 * separado de Toast.tsx (el provider global) para que ambos usos no
 * compitan por el mismo archivo.
 */
export interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  onClose?: () => void;
  style?: CSSProperties;
  className?: string;
}

const COLORS = {
  success: "#34c759",
  danger: "#ff3b30",
  warn: "#ff9500",
  accent: "#0071e3",
  textSub: "#6e6e73",
};

const toastConfig: Record< string,
  {
    bg: string;
    border: string;
    titleColor: string;
    messageColor: string;
    iconColor: string;
    icon: (size?: number) => ReactNode;
  }
> = {
  success: {
    bg: "#F0FDF4",
    border: "rgba(52, 199, 89, 0.40)",
    titleColor: "#166534",
    messageColor: "#15803D",
    iconColor: COLORS.success,
    icon: (size = 20) => <CheckCircle2 size={size} />,
  },
  error: {
    bg: "#FEF2F2",
    border: "rgba(255, 59, 48, 0.40)",
    titleColor: "#991B1B",
    messageColor: "#B91C1C",
    iconColor: COLORS.danger,
    icon: (size = 20) => <XCircle size={size} />,
  },
  danger: {
    bg: "#FEF2F2",
    border: "rgba(255, 59, 48, 0.40)",
    titleColor: "#991B1B",
    messageColor: "#B91C1C",
    iconColor: COLORS.danger,
    icon: (size = 20) => <AlertTriangle size={size} />,
  },
  warning: {
    bg: "#FFF7ED",
    border: "rgba(255, 149, 0, 0.45)",
    titleColor: "#92400E",
    messageColor: "#B45309",
    iconColor: COLORS.warn,
    icon: (size = 20) => <AlertTriangle size={size} />,
  },
  info: {
    bg: "#EFF6FF",
    border: "rgba(0, 113, 227, 0.40)",
    titleColor: "#1E40AF",
    messageColor: "#1D4ED8",
    iconColor: COLORS.accent,
    icon: (size = 20) => <Info size={size} />,
  },
};

/**
 * Componente Toast flotante para notificaciones emergentes de éxito, error o información.
 * Uso puntual (fuera del ToastProvider), por ejemplo en CajaChicaMovimiento.
 */
export function Toast({
  type,
  title,
  message,
  onClose,
  style = {},
  className = "",
}: ToastProps) {
  const cfg = toastConfig[type] || toastConfig.info;

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 9999,
        minWidth: "320px",
        maxWidth: "450px",
        padding: "14px 18px",
        borderRadius: "12px",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        animation: "slideIn 0.3s ease-out forwards",
        ...style,
      }}
    >
      <span
        style={{
          color: cfg.iconColor,
          flexShrink: 0,
          marginTop: "2px",
          display: "flex",
          alignItems: "center",
        }}
      >
        {cfg.icon(20)}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: cfg.titleColor,
            marginBottom: message ? "2px" : 0,
          }}
        >
          {title}
        </div>
        {message && (
          <div
            style={{
              fontSize: "12px",
              color: cfg.messageColor,
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {message}
          </div>
        )}
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar notificación"
          title="Cerrar notificación"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: COLORS.textSub,
            padding: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            opacity: 0.8,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export default Toast;
