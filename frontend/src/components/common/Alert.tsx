import type { ReactNode, CSSProperties } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  X,
} from "lucide-react";

export type AlertVariant = "success" | "error" | "danger" | "warning" | "warn" | "info";

export interface AlertProps {
  /** Tipo de alerta: success | error | danger | warning | warn | info */
  variant?: AlertVariant;
  /** Título opcional en negrita al inicio o encabezado */
  title?: string;
  /** Contenido o mensaje de la alerta */
  children?: ReactNode;
  /** Icono personalizado (opcional, si no se pasa se usa el icono por defecto de la variante) */
  icon?: ReactNode;
  /** Función para cerrar/descartar la alerta (si se provee, muestra botón de cierre) */
  onClose?: () => void;
  /** Estilos inline adicionales */
  style?: CSSProperties;
  /** Clases CSS adicionales */
  className?: string;
}

const COLORS = {
  success: "#34c759",
  danger: "#ff3b30",
  warn: "#ff9500",
  accent: "#0071e3",
  textSub: "#6e6e73",
};

const variantConfig: Record<
  string,
  {
    bg: string;
    border: string;
    textColor: string;
    titleColor: string;
    iconColor: string;
    defaultIcon: (size?: number) => ReactNode;
  }
> = {
  success: {
    bg: "#F0FDF4",
    border: "rgba(52, 199, 89, 0.35)",
    textColor: "#15803D",
    titleColor: "#166534",
    iconColor: COLORS.success,
    defaultIcon: (size = 18) => <CheckCircle2 size={size} />,
  },
  error: {
    bg: "#FEF2F2",
    border: "rgba(255, 59, 48, 0.35)",
    textColor: "#991B1B",
    titleColor: "#7F1D1D",
    iconColor: COLORS.danger,
    defaultIcon: (size = 18) => <XCircle size={size} />,
  },
  danger: {
    bg: "#FDE8E8",
    border: "rgba(255, 59, 48, 0.35)",
    textColor: COLORS.danger,
    titleColor: "#7F1D1D",
    iconColor: COLORS.danger,
    defaultIcon: (size = 18) => <AlertTriangle size={size} />,
  },
  warning: {
    bg: "#FFF7ED",
    border: "rgba(255, 149, 0, 0.40)",
    textColor: "#92400E",
    titleColor: "#78350F",
    iconColor: COLORS.warn,
    defaultIcon: (size = 18) => <AlertTriangle size={size} />,
  },
  warn: {
    bg: "#FFF7ED",
    border: "rgba(255, 149, 0, 0.40)",
    textColor: "#92400E",
    titleColor: "#78350F",
    iconColor: COLORS.warn,
    defaultIcon: (size = 18) => <AlertTriangle size={size} />,
  },
  info: {
    bg: "#EFF6FF",
    border: "rgba(0, 113, 227, 0.35)",
    textColor: "#1E40AF",
    titleColor: "#1E3A8A",
    iconColor: COLORS.accent,
    defaultIcon: (size = 18) => <Info size={size} />,
  },
};

/**
 * Componente reutilizable de Alerta para mensajes informativos, advertencias, errores y éxitos.
 *
 * @example
 * ```tsx
 * <Alert variant="success" title="¡Operación Exitosa!">
 *   El registro se guardó correctamente.
 * </Alert>
 *
 * <Alert variant="danger">
 *   <strong>Fondos insuficientes:</strong> El monto excede el saldo.
 * </Alert>
 * ```
 */
export function Alert({
  variant = "info",
  title,
  children,
  icon,
  onClose,
  style = {},
  className = "",
}: AlertProps) {
  const cfg = variantConfig[variant] || variantConfig.info;

  return (
    <div
      className={className}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        padding: "10px 14px",
        borderRadius: "10px",
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.textColor,
        fontSize: "13px",
        lineHeight: 1.45,
        ...style,
      }}
    >
      {/* Icono */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          color: cfg.iconColor,
          flexShrink: 0,
          marginTop: "1px",
        }}
      >
        {icon !== undefined ? icon : cfg.defaultIcon(16)}
      </span>

      {/* Contenido */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {title && (
          <div
            style={{
              fontWeight: 600,
              color: cfg.titleColor,
              marginBottom: children ? "2px" : 0,
              fontSize: "13px",
            }}
          >
            {title}
          </div>
        )}
        {children && <div>{children}</div>}
      </div>

      {/* Botón opcional de cierre */}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar alerta"
          title="Cerrar alerta"
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: cfg.textColor,
            opacity: 0.7,
            padding: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
            flexShrink: 0,
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export default Alert;
