import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, X, Check, AlertCircle } from "lucide-react";
import { HintTooltip } from "./HintTooltip";

export interface SelectOption {
  id: number | string;
  codigo?: string;
  nombre: string;
  detalle?: string;
  idSucursal?: number;
  icon?: any;
}

interface SearchableSelectProps {
  label: string;
  value: number | string;
  options: SelectOption[];
  onChange: (value: number | string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Texto explicativo emergente al hacer hover sobre el icono (?) */
  tooltip?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Combobox con búsqueda predictiva para listas extensas (Sucursales, Empleados, etc.).
 * Cumple con los fundamentos de UX: búsqueda integrada, affordance visual y feedback de selección.
 */
export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "-- Seleccionar --",
  searchPlaceholder = "Escribe para filtrar opciones...",
  tooltip,
  hint,
  error,
  required,
  disabled,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cerrar dropdown al hacer click afuera
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

  const selectedOption = options.find((opt) => String(opt.id) === String(value));

  const filteredOptions = options.filter((opt) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    const matchNombre = opt.nombre.toLowerCase().includes(q);
    const matchCodigo = opt.codigo ? opt.codigo.toLowerCase().includes(q) : false;
    const matchDetalle = opt.detalle ? opt.detalle.toLowerCase().includes(q) : false;
    return matchNombre || matchCodigo || matchDetalle;
  });

  const handleSelect = (val: number | string) => {
    onChange(val);
    setIsOpen(false);
    setQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  const renderOptionIcon = (icon: any, color?: string) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComp = icon as any;
    return <IconComp size={15} color={color} />;
  };

  return (
    <div className="cpx-field" style={{ width: "100%" }} ref={containerRef}>
      <label className="cpx-field__label" style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        <span>{label}</span>
        {required && <span style={{ color: "var(--cpx-danger, #ff3b30)", marginLeft: "2px" }}>*</span>}
        {tooltip && <HintTooltip text={tooltip} />}
      </label>

      <div className="cpx-select-container">
        {/* Trigger del select */}
        <div
          tabIndex={disabled ? -1 : 0}
          className={`cpx-select-trigger ${isOpen ? "cpx-select-trigger--open" : ""} ${error ? "cpx-field__input--error" : ""
            }`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              !disabled && setIsOpen(!isOpen);
            }
          }}
          style={{
            opacity: disabled ? 0.6 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
          /* 1. Tooltip general del trigger al hacer hover */
          title={selectedOption ? `${selectedOption.codigo ? selectedOption.codigo + " - " : ""}${selectedOption.nombre}` : placeholder}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
            {selectedOption ? (
              <>
                {selectedOption.icon && (
                  <span style={{ display: "flex", alignItems: "center", color: "var(--cpx-accent, #0071e3)", flexShrink: 0 }}>
                    {renderOptionIcon(selectedOption.icon, "var(--cpx-accent, #0071e3)")}
                  </span>
                )}
                {selectedOption.codigo && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "2px 6px",
                      background: "rgba(0, 113, 227, 0.08)",
                      color: "var(--cpx-accent)",
                      borderRadius: 4,
                      fontWeight: 600,
                    }}
                    className="cpx-mono"
                  >
                    {selectedOption.codigo}
                  </span>
                )}
                {/* 2. Tooltip específico en el texto truncado de la opción seleccionada */}
                <span
                  title={selectedOption.nombre}
                  style={{ fontWeight: 500, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}
                >
                  {selectedOption.nombre}
                </span>
              </>
            ) : (
              <span style={{ color: "var(--cpx-text-muted)" }}>{placeholder}</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            {selectedOption && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--cpx-text-muted)",
                  padding: 2,
                  display: "flex",
                }}
                title="Limpiar selección"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown
              size={16}
              style={{
                color: "var(--cpx-text-muted)",
                transition: "transform 0.15s ease",
                transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </div>
        </div>

        {/* Menú Desplegable con Búsqueda */}
        {isOpen && (
          <div className="cpx-select-dropdown">
            <div className="cpx-select-search-box">
              <Search size={14} color="var(--cpx-text-muted)" />
              <input
                ref={searchInputRef}
                type="text"
                className="cpx-select-search-input"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--cpx-text-muted)",
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <ul className="cpx-select-list">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.id) === String(value);
                  return (
                    <li
                      key={opt.id}
                      className={`cpx-select-item ${isSelected ? "cpx-select-item--selected" : ""}`}
                      onClick={() => handleSelect(opt.id)}
                      /* 3. Tooltip en cada ítem de la lista desplegable */
                      title={`${opt.codigo ? opt.codigo + " - " : ""}${opt.nombre}${opt.detalle ? " (" + opt.detalle + ")" : ""}`}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                        {opt.icon && (
                          <span style={{ display: "flex", alignItems: "center", color: isSelected ? "var(--cpx-accent, #0071e3)" : "var(--cpx-text-secondary, #6e6e73)", flexShrink: 0 }}>
                            {renderOptionIcon(opt.icon, isSelected ? "var(--cpx-accent, #0071e3)" : "var(--cpx-text-secondary, #6e6e73)")}
                          </span>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {opt.codigo && (
                              <span
                                style={{
                                  fontSize: 10,
                                  padding: "1px 5px",
                                  background: "rgba(0, 0, 0, 0.05)",
                                  borderRadius: 3,
                                  fontWeight: 600,
                                }}
                                className="cpx-mono"
                              >
                                {opt.codigo}
                              </span>
                            )}
                            <span style={{ fontWeight: isSelected ? 600 : 500, fontSize: "13px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {opt.nombre}
                            </span>
                          </div>
                          {opt.detalle && (
                            <span style={{ fontSize: "11px", color: "var(--cpx-text-muted, #aeaeb2)", marginTop: "2px" }}>
                              {opt.detalle}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSelected && <Check size={14} color="var(--cpx-accent)" style={{ flexShrink: 0, marginLeft: 8 }} />}
                    </li>
                  );
                })
              ) : (
                <li className="cpx-select-empty">
                  No se encontraron coincidencias para "<strong>{query}</strong>"
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {error ? (
        <span className="cpx-field__error">
          <AlertCircle size={12} /> {error}
        </span>
      ) : hint && !tooltip ? (
        <span className="cpx-field__hint">{hint}</span>
      ) : null}
    </div>
  );
}