import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Si es true, el boton de confirmar usa la variante danger (acciones destructivas). */
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Dialogo de confirmacion del sistema CPX, construido sobre Modal. Reemplaza
 * al confirm() nativo del navegador para acciones que requieren confirmacion
 * explicita del usuario (anular, eliminar, etc).
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancelar",
  danger,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onClose} maxWidth={380}>
      <p className="cpx-confirm-dialog__message">{message}</p>
      <div className="cpx-confirm-dialog__actions">
        <Button variant="secondary" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
