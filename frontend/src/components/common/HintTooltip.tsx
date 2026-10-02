import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import { HelpCircle } from "lucide-react";

export interface HintTooltipProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const HintTooltip: React.FC<HintTooltipProps> = ({ text, className = "", style }) => {
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        // Posicionar justo encima del ícono (considerando el scroll global)
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
  };

  const handleMouseEnter = () => {
    updatePosition();
    setHovered(true);
  };

  return (
    <span
      ref={triggerRef}
      className={className}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        cursor: "help",
        marginLeft: "5px",
        verticalAlign: "middle",
        ...style,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovered(false)}
    >
      <HelpCircle
        size={13}
        style={{
          color: "var(--cpx-text-secondary, #6e6e73)",
          opacity: 0.75,
          transition: "opacity 0.15s ease",
        }}
      />

      {hovered &&
        ReactDOM.createPortal(
          <div
            style={{
              position: "absolute",
              top: `${coords.top - 7}px`,
              left: `${coords.left}px`,
              transform: "translate(-50%, -100%)",
              padding: "7px 11px",
              borderRadius: "7px",
              background: "#1F2937",
              color: "#FFFFFF",
              fontSize: "11px",
              fontWeight: 400,
              whiteSpace: "normal",
              width: "max-content",
              maxWidth: "240px",
              boxShadow: "0 4px 18px rgba(0, 0, 0, 0.28)",
              zIndex: 999999,
              lineHeight: 1.4,
              pointerEvents: "none",
              textAlign: "left",
              fontFamily: "var(--cpx-font-sans, system-ui, sans-serif)",
            }}
          >
            {text}
            {/* Flecha inferior */}
            <span
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid #1F2937",
              }}
            />
          </div>,
          document.body
        )}
    </span>
  );
};

export default HintTooltip;