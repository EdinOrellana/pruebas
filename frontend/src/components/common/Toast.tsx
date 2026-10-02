import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "danger" | "warning" | "info";

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (title: string, message?: string, type?: ToastType) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  danger: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastMessageItem({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: (id: string) => void;
}) {
  useEffect(() => {
    const duration = toast.type === "error" || toast.type === "danger" ? 6000 : 3500;
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.type, onClose]);

  return (
    <div className={`cpx-toast cpx-toast--${toast.type}`} role="alert">
      {toast.type === "success" && (
        <CheckCircle2 size={18} color="#10b981" style={{ flexShrink: 0 }} />
      )}
      {toast.type === "error" && (
        <AlertCircle size={18} color="var(--cpx-danger)" style={{ flexShrink: 0 }} />
      )}
      {toast.type === "danger" && (
        <AlertTriangle size={18} color="var(--cpx-danger)" style={{ flexShrink: 0 }} />
      )}
      {toast.type === "warning" && (
        <AlertTriangle size={18} color="var(--cpx-warning)" style={{ flexShrink: 0 }} />
      )}
      {toast.type === "info" && (
        <Info size={18} color="var(--cpx-accent)" style={{ flexShrink: 0 }} />
      )}

      <div className="cpx-toast__content">
        <div className="cpx-toast__title">{toast.title}</div>
        {toast.message && <div className="cpx-toast__message">{toast.message}</div>}
      </div>

      <button
        type="button"
        className="cpx-toast__close"
        onClick={() => onClose(toast.id)}
        aria-label="Cerrar notificación"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, message?: string, type: ToastType = "info") => {
      setToasts((prev) => {
        const yaExiste = prev.some(
          (t) => t.title === title && t.message === message && t.type === type
        );
        if (yaExiste) return prev;

        const id = Math.random().toString(36).substring(2, 9);
        return [...prev, { id, title, message, type }];
      });
    },
    []
  );

  const success = useCallback(
    (title: string, message?: string) => showToast(title, message, "success"),
    [showToast]
  );
  const error = useCallback(
    (title: string, message?: string) => showToast(title, message, "error"),
    [showToast]
  );
  const danger = useCallback(
    (title: string, message?: string) => showToast(title, message, "danger"),
    [showToast]
  );
  const warning = useCallback(
    (title: string, message?: string) => showToast(title, message, "warning"),
    [showToast]
  );
  const info = useCallback(
    (title: string, message?: string) => showToast(title, message, "info"),
    [showToast]
  );

  const contextValue = useMemo(
    () => ({ showToast, success, error, danger, warning, info }),
    [showToast, success, error, danger, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="cpx-toast-container">
        {toasts.map((toast) => (
          <ToastMessageItem key={toast.id} toast={toast} onClose={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe utilizarse dentro de un <ToastProvider>");
  }
  return ctx;
}