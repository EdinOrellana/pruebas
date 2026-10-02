import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "success";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
}

/** Boton del sistema de diseño CPX. Estilos en styles/theme.css (.cpx-btn). */
export function Button({
  variant = "primary",
  loading = false,
  icon,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const classes = ["cpx-btn", `cpx-btn--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, ...rest.style }}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 size={15} className="cpx-spin" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

