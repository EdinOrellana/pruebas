import React, { ReactNode } from "react";
import { Search, X } from "lucide-react";

export interface SearchTabOption<T = string> {
  key: T;
  label: string;
  count?: number;
}

export interface TableSearchBarProps<T = string> {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  tabs?: SearchTabOption<T>[];
  activeTab?: T;
  onTabChange?: (tabKey: T) => void;
  filters?: ReactNode;
  totalResults?: number;
  filteredResults?: number;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente unificado de barra de búsqueda en una sola línea con filtros desplegables,
 * pestañas opcionales y resumen de resultados interactivo.
 */
export function TableSearchBar<T = string>({
  searchTerm,
  onSearchChange,
  placeholder = "Buscar registros...",
  tabs,
  activeTab,
  onTabChange,
  filters,
  totalResults,
  filteredResults,
  actions,
  children,
  className = "",
  style,
}: TableSearchBarProps<T>) {
  return (
    <div className={className} style={{ width: "100%", ...style }}>
      {/* Fila principal en una sola línea */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--cpx-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          background: "rgba(0, 0, 0, 0.01)",
        }}
      >
        {/* Input de búsqueda predictiva con icono y botón de limpiar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: "1.5px solid var(--cpx-border)",
            borderRadius: "var(--cpx-radius-input, 8px)",
            padding: "6px 12px",
            minWidth: 280,
            flex: 1,
            maxWidth: 440,
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          }}
        >
          <Search size={15} color="var(--cpx-text-muted)" />
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              fontSize: 13,
              color: "var(--cpx-text-primary)",
              background: "transparent",
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--cpx-text-muted)",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
              title="Limpiar búsqueda"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filtros desplegables, pestañas y acciones */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {filters}
          {children}

          {tabs && tabs.length > 0 && onTabChange && (
            <div className="cpx-tabs">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={String(tab.key)}
                    type="button"
                    className={`cpx-tab ${isActive ? "cpx-tab--active" : ""}`}
                    onClick={() => onTabChange(tab.key)}
                  >
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span style={{ opacity: 0.8, fontSize: 11, marginLeft: 2 }}>
                        ({tab.count})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {actions && <div>{actions}</div>}
        </div>
      </div>

      {/* Sugerencias Rápidas y Banner de Resultados Filtrados */}
      {searchTerm.trim() && (
        <div
          style={{
            padding: "6px 20px",
            background: "var(--cpx-accent-sub, #e8f1fb)",
            fontSize: 12,
            color: "var(--cpx-accent, #0071e3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>
            Mostrando <strong>{filteredResults ?? 0}</strong>
            {totalResults !== undefined ? ` de ${totalResults}` : ""} resultado(s) para "
            <em>{searchTerm}</em>"
          </span>
          <button
            type="button"
            onClick={() => onSearchChange("")}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 11,
              color: "var(--cpx-accent, #0071e3)",
              fontWeight: 600,
            }}
          >
            Quitar filtro
          </button>
        </div>
      )}
    </div>
  );
}

export default TableSearchBar;
