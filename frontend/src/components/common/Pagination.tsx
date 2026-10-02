import React, { CSSProperties } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { T } from "./index";

export interface PaginationProps {
  paginaActual: number;
  totalPaginas: number;
  totalRegistros: number;
  limitePorPagina: number;
  onCambioPagina: (pagina: number) => void;
  onCambioLimite?: (limite: number) => void;
  opcionesLimite?: number[];
  loading?: boolean;
  etiquetaRegistros?: string;
  style?: CSSProperties;
  className?: string;
}

/**
 * Componente reutilizable de paginación con selector de límite por página,
 * indicador de rango de registros y botones de navegación.
 */
export const Pagination: React.FC<PaginationProps> = ({
  paginaActual,
  totalPaginas,
  totalRegistros,
  limitePorPagina,
  onCambioPagina,
  onCambioLimite,
  opcionesLimite = [10, 15, 20, 25, 30],
  loading = false,
  etiquetaRegistros = "registros",
  style,
  className = "",
}) => {
  const inicio = totalRegistros > 0 ? (paginaActual - 1) * limitePorPagina + 1 : 0;
  const fin = Math.min(paginaActual * limitePorPagina, totalRegistros);
  const totalPags = Math.max(1, totalPaginas);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "20px",
        paddingTop: "16px",
        borderTop: `1px solid ${T.border}`,
        fontSize: "13px",
        color: T.textSub,
        flexWrap: "wrap",
        gap: "12px",
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {onCambioLimite && (
          <>
            <span>{etiquetaRegistros.charAt(0).toUpperCase() + etiquetaRegistros.slice(1)} por página:</span>
            <select
              value={limitePorPagina}
              onChange={(e) => onCambioLimite(Number(e.target.value))}
              title={`Selecciona la cantidad de ${etiquetaRegistros} visibles por página`}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: `1px solid ${T.border}`,
                background: "#F8F9FA",
                color: T.text,
                fontSize: "12px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {opcionesLimite.map((opcion) => (
                <option key={opcion} value={opcion}>
                  {opcion} {etiquetaRegistros}
                </option>
              ))}
            </select>
          </>
        )}
        <span style={{ marginLeft: onCambioLimite ? "12px" : "0px" }}>
          Mostrando {inicio} a {fin} de {totalRegistros} {etiquetaRegistros}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <button
          type="button"
          disabled={paginaActual <= 1 || loading}
          onClick={() => onCambioPagina(paginaActual - 1)}
          title={`Ir a la página anterior de ${etiquetaRegistros}`}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: `1px solid ${T.border}`,
            background: paginaActual <= 1 ? "#F3F4F6" : "#FFFFFF",
            color: paginaActual <= 1 ? T.textMuted : T.text,
            cursor: paginaActual <= 1 || loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontWeight: 500,
            transition: "all 0.15s ease",
          }}
        >
          <ChevronLeft size={14} />
          Anterior
        </button>

        <span style={{ fontWeight: 500, padding: "0 4px" }}>
          Página {paginaActual} de {totalPags}
        </span>

        <button
          type="button"
          disabled={paginaActual >= totalPags || loading}
          onClick={() => onCambioPagina(paginaActual + 1)}
          title={`Ir a la página siguiente de ${etiquetaRegistros}`}
          style={{
            padding: "6px 12px",
            borderRadius: "6px",
            border: `1px solid ${T.border}`,
            background: paginaActual >= totalPags ? "#F3F4F6" : "#FFFFFF",
            color: paginaActual >= totalPags ? T.textMuted : T.text,
            cursor: paginaActual >= totalPags || loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontWeight: 500,
            transition: "all 0.15s ease",
          }}
        >
          Siguiente
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
