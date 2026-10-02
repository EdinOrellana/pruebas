import type { ReactNode, CSSProperties } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

/** Contenedor tipo tarjeta del sistema CPX (.cpx-card en styles/theme.css). */
export function Card({ title, children, style, className }: CardProps) {
  const classes = ["cpx-card", className].filter(Boolean).join(" ");
  return (
    <div className={classes} style={style}>
      {title && <h2 className="cpx-card__title">{title}</h2>}
      {children}
    </div>
  );
}

