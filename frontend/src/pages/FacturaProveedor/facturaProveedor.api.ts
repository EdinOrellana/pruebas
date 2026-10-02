import axios from "axios";
import type {
  FacturaProveedor,
  CrearFacturaProveedorInput,
  ActualizarFacturaProveedorInput,
  Proveedor,
} from "./facturaProveedor.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/** GET /facturas-proveedor */
export async function getFacturasProveedor(): Promise<FacturaProveedor[]> {
  const { data } = await api.get<FacturaProveedor[]>("/facturas-proveedor");
  return data;
}

/** GET /facturas-proveedor/proveedores -> proveedores activos para el selector */
export async function getProveedores(): Promise<Proveedor[]> {
  const { data } = await api.get<Proveedor[]>("/facturas-proveedor/proveedores");
  return data;
}

/** GET /facturas-proveedor/:id */
export async function getFacturaProveedor(id: number): Promise<FacturaProveedor> {
  const { data } = await api.get<FacturaProveedor>(`/facturas-proveedor/${id}`);
  return data;
}

/** POST /facturas-proveedor */
export async function crearFacturaProveedor(
  payload: CrearFacturaProveedorInput
): Promise<{ message: string; idFacturaProveedor: number }> {
  const { data } = await api.post("/facturas-proveedor", payload);
  return data;
}

/** PUT /facturas-proveedor/:id */
export async function actualizarFacturaProveedor(
  id: number,
  payload: ActualizarFacturaProveedorInput
): Promise<{ message: string }> {
  const { data } = await api.put(`/facturas-proveedor/${id}`, payload);
  return data;
}

/** PUT /facturas-proveedor/:id/anular -> anula; el motivo es obligatorio y se guarda en NOTAS */
export async function anularFacturaProveedor(
  id: number,
  motivo: string
): Promise<{ message: string }> {
  const { data } = await api.put(`/facturas-proveedor/${id}/anular`, { motivo });
  return data;
}
