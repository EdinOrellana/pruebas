import axios from "axios";
import type {
  ContrasenaPago,
  CrearContrasenaPagoInput,
  ActualizarContrasenaPagoInput,
  EmpleadoAutoriza,
} from "./contrasenaPago.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/** GET /contrasenas-pago */
export async function getContrasenasPago(): Promise<ContrasenaPago[]> {
  const { data } = await api.get<ContrasenaPago[]>("/contrasenas-pago");
  return data;
}

/** GET /contrasenas-pago/:id */
export async function getContrasenaPago(id: number): Promise<ContrasenaPago> {
  const { data } = await api.get<ContrasenaPago>(`/contrasenas-pago/${id}`);
  return data;
}

/** POST /contrasenas-pago */
export async function crearContrasenaPago(
  payload: CrearContrasenaPagoInput
): Promise<{ message: string; idContrasena: number }> {
  const { data } = await api.post("/contrasenas-pago", payload);
  return data;
}

/** PUT /contrasenas-pago/:id */
export async function actualizarContrasenaPago(
  id: number,
  payload: ActualizarContrasenaPagoInput
): Promise<{ message: string }> {
  const { data } = await api.put(`/contrasenas-pago/${id}`, payload);
  return data;
}

/** GET /contrasenas-pago/empleados -> empleados activos para el selector "Autoriza" */
export async function getEmpleadosAutorizan(): Promise<EmpleadoAutoriza[]> {
  const { data } = await api.get<EmpleadoAutoriza[]>("/contrasenas-pago/empleados");
  return data;
}

/** PUT /contrasenas-pago/:id/pagar -> pago directo (TRANSFERENCIA / EFECTIVO) */
export async function registrarPagoContrasena(
  id: number
): Promise<{ message: string }> {
  const { data } = await api.put(`/contrasenas-pago/${id}/pagar`);
  return data;
}

/** PUT /contrasenas-pago/:id/anular -> anula; el motivo es obligatorio y se guarda en NOTAS */
export async function anularContrasenaPago(
  id: number,
  motivo: string
): Promise<{ message: string }> {
  const { data } = await api.put(`/contrasenas-pago/${id}/anular`, { motivo });
  return data;
}
