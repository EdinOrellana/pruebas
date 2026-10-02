import type { LucideIcon } from "lucide-react";

type IconBtnVariant = "ghost" | "primary" | "danger" | "success";

interface IconBtnProps {
  icon: LucideIcon;
  /** Texto accesible: se usa como title y aria-label. */
  label: string;
  onClick?: () => void;
  variant?: IconBtnVariant;
  disabled?: boolean;
  type?: "button" | "submit";
}

/** Boton cuadrado 32x32 del sistema CPX (.cpx-iconbtn en styles/theme.css). */
export function IconBtn({
  icon: Icon,
  label,
  onClick,
  variant = "ghost",
  disabled,
  type = "button",
}: IconBtnProps) {
  return (
    <button
      type={type}
      className={`cpx-iconbtn cpx-iconbtn--${variant}`}
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}
