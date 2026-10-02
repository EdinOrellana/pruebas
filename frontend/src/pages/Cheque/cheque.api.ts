import axios from "axios";
import type {
  Cheque,
  CrearChequeInput,
  ActualizarChequeInput,
} from "./cheque.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/** GET /cheques */
export async function getCheques(): Promise<Cheque[]> {
  const { data } = await api.get<Cheque[]>("/cheques");
  return data;
}

/** GET /cheques/:id */
export async function getCheque(id: number): Promise<Cheque> {
  const { data } = await api.get<Cheque>(`/cheques/${id}`);
  return data;
}

/** POST /cheques */
export async function crearCheque(
  payload: CrearChequeInput
): Promise<{ message: string; idCheque: number }> {
  const { data } = await api.post("/cheques", payload);
  return data;
}

/** PUT /cheques/:id */
export async function actualizarCheque(
  id: number,
  payload: ActualizarChequeInput
): Promise<{ message: string }> {
  const { data } = await api.put(`/cheques/${id}`, payload);
  return data;
}

/** PUT /cheques/:id/cobrar -> marca como COBRADO (solo si estaba EMITIDO) */
export async function cobrarCheque(
  id: number,
  fechaCobro: string
): Promise<{ message: string }> {
  const { data } = await api.put(`/cheques/${id}/cobrar`, { fechaCobro });
  return data;
}

/** DELETE /cheques/:id -> anula (no borra fisico) */
export async function anularCheque(
  id: number
): Promise<{ message: string }> {
  const { data } = await api.delete(`/cheques/${id}`);
  return data;
}
