import axios from "axios";
import type { UnidadMedida } from "./facturaProveedorDetalle.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/**
 * GET /unidades-medida -> catalogo de solo lectura (CP_TIPO_UNIDAD_MEDIDA),
 * usado unicamente para poblar el dropdown de este formulario. El CRUD
 * completo de Unidad de Medida vive en pages/Unidad_Medida/unidadMedida.api.ts.
 */
export async function getUnidadesMedida(): Promise<UnidadMedida[]> {
  const { data } = await api.get<UnidadMedida[]>("/unidades-medida");
  return data;
}
