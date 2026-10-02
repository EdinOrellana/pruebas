import React from "react";
import { Compass, X, ChevronDown } from "lucide-react";

export interface GuideStep {
  number: number | string;
  title: string;
  description: string;
}

export interface GuideBannerProps {
  title: string;
  steps: GuideStep[];
  visible: boolean;
  onToggle: (visible: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Banner dinámico y colapsable de primeros pasos y guía de usuario.
 * Permite al usuario mostrar u ocultar la guía a voluntad para optimizar el espacio.
 */
export const GuideBanner: React.FC<GuideBannerProps> = ({
  title,
  steps,
  visible,
  onToggle,
  className = "",
  style,
}) => {
  if (!visible) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "12px",
          ...style,
        }}
      >
        <button
          type="button"
          onClick={() => onToggle(true)}
          style={{
            background: "rgba(0, 113, 227, 0.08)",
            border: "1px solid rgba(0, 113, 227, 0.2)",
            color: "var(--cpx-accent)",
            fontSize: "12px",
            fontWeight: 500,
            padding: "5px 12px",
            borderRadius: "var(--cpx-radius-pill, 20px)",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
          }}
          title="Ver guía de primeros pasos para esta sección"
        >
          <Compass size={14} />
          <span>Mostrar guía de primeros pasos</span>
          <ChevronDown size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={`cpx-guide-banner ${className}`} style={style}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Compass size={18} color="var(--cpx-accent)" />
          <strong style={{ fontSize: 14, color: "var(--cpx-text-primary)" }}>
            {title}
          </strong>
        </div>
        <button
          type="button"
          onClick={() => onToggle(false)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "var(--cpx-text-muted)",
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 8px",
            borderRadius: "4px",
            transition: "background 0.15s ease",
          }}
          title="Ocultar guía de primeros pasos"
        >
          <X size={14} /> Ocultar guía
        </button>
      </div>

      <div className="cpx-guide-steps">
        {steps.map((step, idx) => (
          <div key={idx} className="cpx-guide-step">
            <span className="cpx-guide-step__num">{step.number}</span>
            <div>
              <strong style={{ fontSize: 12, display: "block", color: "var(--cpx-text-primary)" }}>
                {step.title}
              </strong>
              <span style={{ fontSize: 11, color: "var(--cpx-text-secondary)", lineHeight: 1.4 }}>
                {step.description}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GuideBanner;
