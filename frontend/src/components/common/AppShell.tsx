import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Bell, ChevronRight, Search } from "lucide-react";
import { APP_ROUTES, SISTEMAS, getSistemaFromPath } from "../../router/navigation.config";

interface AppShellProps {
  /** Título mostrado en la barra de título de página. */
  headerTitle?: string;
  /** Segundo segmento del breadcrumb. */
  breadcrumb?: string;
  /** Valor del buscador en el header */
  searchValue?: string;
  /** Callback al cambiar el buscador */
  onSearchChange?: (val: string) => void;
  /** Placeholder explicativo del buscador */
  searchPlaceholder?: string;
  children: ReactNode;
}

/**
 * ARCHIVO COMPARTIDO — ver CONTRIBUTING.md. El sidebar se genera solo desde
 * navigation.config.tsx; no deberias necesitar editar este archivo para
 * agregar un modulo.
 *
 * Shell presentacional del sistema CPX: sidebar + header + barra de título +
 * contenido según la Guía de Estilos Visuales.
 */
export function AppShell({
  headerTitle = "Cuentas por Pagar",
  breadcrumb = "Inicio",
  searchValue = "",
  onSearchChange,
  searchPlaceholder = "Buscar en el sistema...",
  children,
}: AppShellProps) {
  const location = useLocation();
  const sistemaActivo = getSistemaFromPath(location.pathname);
  const nombreSistemaActivo = SISTEMAS.find((s) => s.id === sistemaActivo)?.nombre;

  /**
   * "Inicio" siempre se ve. Los demas modulos solo se ven si pertenecen al
   * sistema activo (derivado de la URL) -- asi el sidebar cambia solo al
   * elegir otro sistema, sin listar los 8+N modulos de todos a la vez.
   */
  const modulosSidebar = APP_ROUTES.filter(
    (route) => !route.sistema || route.sistema === sistemaActivo
  );

  return (
    <div className="cpx-shell">
      <aside className="cpx-sidebar">
        <div className="cpx-sidebar__brand">
          CPX
          <small>Cuentas por Pagar</small>
        </div>

        <div className="cpx-sidebar__group-label">
          {nombreSistemaActivo ?? "Módulos"}
        </div>

        {/* Menú de navegación generado desde el registro de rutas (navigation.config.tsx) */}
        <nav
          className="cpx-sidebar__group"
          style={{ display: "flex", flexDirection: "column", gap: 4 }}
        >
          {modulosSidebar.map((route) => {
            const Icon = route.icon;
            return (
              <NavLink
                key={route.path}
                to={route.path}
                className={({ isActive }) =>
                  `cpx-sidebar__item ${isActive ? "cpx-sidebar__item--active" : ""}`
                }
              >
                <Icon size={16} />
                {route.breadcrumb}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className="cpx-main">
        <header className="cpx-header">
          <div className="cpx-breadcrumbs">
            <span>CxP</span>
            <ChevronRight size={13} />
            <span>{breadcrumb}</span>
          </div>

          <div className="cpx-header__spacer" />

          {/* Buscador del header, controlado desde la página activa */}
          <div className="cpx-header__search" style={{ minWidth: "380px" }}>
            <Search size={14} style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              style={{ width: "100%", fontSize: "12px" }}
            />
          </div>

          <button
            type="button"
            className="cpx-header__bell"
            title="Notificaciones"
            aria-label="Notificaciones"
          >
            <Bell size={16} />
            <span className="cpx-header__bell-dot" />
          </button>
        </header>

        <div className="cpx-page-title-bar">
          <h1 className="cpx-page-title-bar__title">{headerTitle}</h1>
          <span className="cpx-page-title-bar__currency">GTQ</span>
        </div>

        <main className="cpx-content">{children}</main>
      </div>
    </div>
  );
}