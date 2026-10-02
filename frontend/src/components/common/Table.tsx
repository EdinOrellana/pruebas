import type { ReactNode } from "react";

export interface Column<T> {
  header: string;
  /** Renderiza el contenido de la celda para una fila. */
  render: (row: T) => ReactNode;
  /**
   * Marca la columna como numerica: se alinea a la derecha y usa fuente
   * monoespaciada (ej. montos, numeros de cheque, IDs).
   */
  numeric?: boolean;
  /**
   * Aplica solo fuente monoespaciada, sin alinear a la derecha
   * (ej. fechas en formato YYYY-MM-DD).
   */
  mono?: boolean;
  /** Ancho explicito de la columna (ej. "8%", "120px"). Opcional. */
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
}

/** Tabla del sistema de diseño CPX (.cpx-table en styles/theme.css). */
export function Table<T>({
  columns,
  data,
  rowKey,
  emptyMessage = "Sin registros",
}: TableProps<T>) {
  const thClass = (col: Column<T>) =>
    ["cpx-table__th", col.numeric ? "cpx-table__cell--num" : ""]
      .filter(Boolean)
      .join(" ");
  const tdClass = (col: Column<T>) =>
    [
      "cpx-table__td",
      col.numeric ? "cpx-table__cell--num" : "",
      col.mono && !col.numeric ? "cpx-mono" : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <table className="cpx-table">
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} className={thClass(col)} style={col.width ? { width: col.width } : undefined}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td className="cpx-table__td" colSpan={columns.length}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr key={rowKey(row)} className="cpx-table__row">
              {columns.map((col, i) => (
                <td key={i} className={tdClass(col)} style={col.width ? { width: col.width } : undefined}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
