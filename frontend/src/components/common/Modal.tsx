import type { ReactNode } from "react";
import { X } from "lucide-react";
import { IconBtn } from "./IconBtn";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Ancho maximo del modal en px. Por defecto usa el ancho estandar (ver .cpx-modal, 480px). */
  maxWidth?: number;
}

/**
 * Modal del sistema CPX: overlay con blur + tarjeta centrada
 * (.cpx-modal-overlay / .cpx-modal en styles/theme.css).
 */
export function Modal({ open, title, onClose, children, maxWidth }: ModalProps) {
  if (!open) return null;

  return (
    <div className="cpx-modal-overlay" onClick={onClose}>
      <div
        className="cpx-modal"
        style={maxWidth ? { width: `min(${maxWidth}px, 100%)`, maxWidth: `${maxWidth}px` } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="cpx-modal__header">
          <h2 className="cpx-modal__title">{title}</h2>
          <IconBtn icon={X} label="Cerrar" variant="ghost" onClick={onClose} />
        </div>
        {children}
      </div>
    </div>
  );
}
