import axios from "axios";
import type {
  CajaChica,
  CatalogosResponse,
  CrearCajaChicaInput,
  ActualizarCajaChicaInput,
} from "./cajaChica.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/** GET /cajas-chicas -> Lista todas las cajas */
export async function getCajasChicas(): Promise<CajaChica[]> {
  const { data } = await api.get<CajaChica[]>("/cajas-chicas");
  return data;
}

/** GET /cajas-chicas/catalogos -> Sucursales y Empleados para combos */
export async function getCatalogosCajaChica(): Promise<CatalogosResponse> {
  const { data } = await api.get<CatalogosResponse>("/cajas-chicas/catalogos");
  return data;
}

/** GET /cajas-chicas/:id -> Una caja por ID */
export async function getCajaChica(id: number): Promise<CajaChica> {
  const { data } = await api.get<CajaChica>(`/cajas-chicas/${id}`);
  return data;
}

/** POST /cajas-chicas -> Crear caja chica */
export async function crearCajaChica(
  payload: CrearCajaChicaInput
): Promise<{ message: string; idCajaChica: number }> {
  const { data } = await api.post("/cajas-chicas", payload);
  return data;
}

/** PUT /cajas-chicas/:id -> Actualizar caja chica */
export async function actualizarCajaChica(
  id: number,
  payload: ActualizarCajaChicaInput
): Promise<{ message: string }> {
  const { data } = await api.put(`/cajas-chicas/${id}`, payload);
  return data;
}

/** DELETE /cajas-chicas/:id -> Inactivar (baja lógica ESTADO='I') */
export async function inactivarCajaChica(id: number): Promise<{ message: string }> {
  const { data } = await api.delete(`/cajas-chicas/${id}`);
  return data;
}
