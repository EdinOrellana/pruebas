import React, { useState, useRef, useEffect, ReactNode } from "react";
import { Filter, ChevronDown, Search, X, Check } from "lucide-react";

export interface FilterOption<T = string | number> {
  key: T;
  label: string;
  count?: number;
  badgeColor?: "primary" | "success" | "danger" | "warning" | "neutral";
}

export interface FilterDropdownProps<T = string | number> {
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  icon?: ReactNode;
  placeholder?: string;
  searchPlaceholder?: string;
  allOptionKey?: T;
  allOptionLabel?: string;
  totalCount?: number;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente desplegable de filtrado con buscador interno escalable.
 * Permite gestionar listas cortas o extensas de filtros dinámicos sin sobrecargar la interfaz de botones.
 */
export function FilterDropdown<T = string | number>({
  label,
  options,
  value,
  onChange,
  icon,
  searchPlaceholder = "Buscar en filtros...",
  allOptionKey,
  allOptionLabel,
  totalCount,
  disabled = false,
  className = "",
  style,
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cerrar el menú desplegable al hacer clic fuera del componente
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autofoco en el input de búsqueda al abrir
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => String(opt.key) === String(value));
  const isAllSelected = allOptionKey !== undefined && String(value) === String(allOptionKey);

  const filteredOptions = options.filter((opt) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return opt.label.toLowerCase().includes(q) || String(opt.key).toLowerCase().includes(q);
  });

  const handleSelect = (key: T) => {
    onChange(key);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <div
      ref={containerRef}
      className={`cpx-filter-dropdown-container ${className}`}
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      {/* Botón activador del desplegable */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "7px 12px",
          borderRadius: "var(--cpx-radius-input, 8px)",
          border: isOpen ? "1.5px solid var(--cpx-accent, #0071e3)" : "1.5px solid var(--cpx-border, rgba(0,0,0,0.1))",
          background: isOpen ? "var(--cpx-accent-sub, #e8f1fb)" : "#FFFFFF",
          color: "var(--cpx-text-primary, #1d1d1f)",
          fontSize: "13px",
          fontWeight: 500,
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
          boxShadow: isOpen ? "0 0 0 3px rgba(0, 113, 227, 0.12)" : "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        <span style={{ display: "inline-flex", color: "var(--cpx-accent, #0071e3)" }}>
          {icon || <Filter size={14} />}
        </span>

        <span style={{ color: "var(--cpx-text-secondary, #6e6e73)", fontSize: "12px" }}>
          {label}:
        </span>

        <strong style={{ fontWeight: 600, color: "var(--cpx-text-primary, #1d1d1f)" }}>
          {selectedOption ? selectedOption.label : allOptionLabel && isAllSelected ? allOptionLabel : String(value)}
        </strong>

        {selectedOption?.count !== undefined && (
          <span
            style={{
              fontSize: "11px",
              padding: "1px 6px",
              borderRadius: "10px",
              background: "rgba(0, 113, 227, 0.1)",
              color: "var(--cpx-accent, #0071e3)",
              fontWeight: 600,
            }}
          >
            {selectedOption.count}
          </span>
        )}

        <ChevronDown
          size={14}
          style={{
            color: "var(--cpx-text-muted, #aeaeb2)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {/* Menú flotante con buscador y lista de filtros */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            minWidth: "260px",
            background: "#FFFFFF",
            borderRadius: "var(--cpx-radius-sm, 10px)",
            border: "1px solid var(--cpx-border, rgba(0,0,0,0.1))",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
            zIndex: 99999,
            overflow: "hidden",
            animation: "cpx-fade-in 0.15s ease-out",
          }}
        >
          {/* Cabecera con buscador interno del filtro */}
          <div
            style={{
              padding: "8px 10px",
              borderBottom: "1px solid var(--cpx-border, rgba(0,0,0,0.08))",
              background: "#F9FAFB",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Search size={14} color="var(--cpx-text-muted, #aeaeb2)" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                border: "none",
                background: "transparent",
                outline: "none",
                fontSize: "12px",
                color: "var(--cpx-text-primary, #1d1d1f)",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--cpx-text-muted, #aeaeb2)",
                  padding: 0,
                  display: "flex",
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Lista de opciones filtrables */}
          <ul
            style={{
              listStyle: "none",
              margin: 0,
              padding: "4px",
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            {/* Opción 'Todos' si está configurada */}
            {allOptionKey !== undefined && allOptionLabel && !query && (
              <li
                onClick={() => handleSelect(allOptionKey)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  fontWeight: isAllSelected ? 600 : 400,
                  background: isAllSelected ? "var(--cpx-accent-sub, #e8f1fb)" : "transparent",
                  color: isAllSelected ? "var(--cpx-accent, #0071e3)" : "var(--cpx-text-primary, #1d1d1f)",
                  transition: "background 0.1s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span>{allOptionLabel}</span>
                  {totalCount !== undefined && (
                    <span style={{ fontSize: "11px", color: "var(--cpx-text-muted, #aeaeb2)" }}>
                      ({totalCount})
                    </span>
                  )}
                </div>
                {isAllSelected && <Check size={14} color="var(--cpx-accent, #0071e3)" />}
              </li>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.key) === String(value);
                return (
                  <li
                    key={String(opt.key)}
                    onClick={() => handleSelect(opt.key)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "13px",
                      fontWeight: isSelected ? 600 : 400,
                      background: isSelected ? "var(--cpx-accent-sub, #e8f1fb)" : "transparent",
                      color: isSelected ? "var(--cpx-accent, #0071e3)" : "var(--cpx-text-primary, #1d1d1f)",
                      transition: "background 0.1s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span>{opt.label}</span>
                      {opt.count !== undefined && (
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "1px 6px",
                            borderRadius: "10px",
                            background: "rgba(0, 0, 0, 0.05)",
                            color: "var(--cpx-text-secondary, #6e6e73)",
                          }}
                        >
                          {opt.count}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check size={14} color="var(--cpx-accent, #0071e3)" />}
                  </li>
                );
              })
            ) : (
              <li
                style={{
                  padding: "16px",
                  textAlign: "center",
                  fontSize: "12px",
                  color: "var(--cpx-text-muted, #aeaeb2)",
                }}
              >
                No se encontraron opciones para "<strong>{query}</strong>"
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;
