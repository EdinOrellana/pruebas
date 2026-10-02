import type { ReactNode } from "react";

interface SHProps {
  title: string;
  actions?: ReactNode;
}

/** Subencabezado de seccion: titulo a la izquierda, acciones a la derecha (.cpx-sh). */
export function SH({ title, actions }: SHProps) {
  return (
    <div className="cpx-sh">
      <span className="cpx-sh__title">{title}</span>
      {actions && <div className="cpx-sh__actions">{actions}</div>}
    </div>
  );
}
