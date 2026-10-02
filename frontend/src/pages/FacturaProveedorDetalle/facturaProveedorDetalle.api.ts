import axios from "axios";
import type {
  FacturaProveedorDetalle,
  CrearFacturaProveedorDetalleInput,
  ActualizarFacturaProveedorDetalleInput,
} from "./facturaProveedorDetalle.types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

/** GET /facturas-proveedor-detalle (opcionalmente filtrado por idFacturaProveedor) */
export async function getFacturaProveedorDetalles(
  idFacturaProveedor?: number
): Promise<FacturaProveedorDetalle[]> {
  const { data } = await api.get<FacturaProveedorDetalle[]>(
    "/facturas-proveedor-detalle",
    {
      params:
        idFacturaProveedor != null ? { idFacturaProveedor } : undefined,
    }
  );
  return data;
}

/** GET /facturas-proveedor-detalle/:id */
export async function getFacturaProveedorDetalle(
  id: number
): Promise<FacturaProveedorDetalle> {
  const { data } = await api.get<FacturaProveedorDetalle>(
    `/facturas-proveedor-detalle/${id}`
  );
  return data;
}

/** POST /facturas-proveedor-detalle */
export async function crearFacturaProveedorDetalle(
  payload: CrearFacturaProveedorDetalleInput
): Promise<{ message: string; idFacturaProvDetalle: number }> {
  const { data } = await api.post("/facturas-proveedor-detalle", payload);
  return data;
}

/** PUT /facturas-proveedor-detalle/:id */
export async function actualizarFacturaProveedorDetalle(
  id: number,
  payload: ActualizarFacturaProveedorDetalleInput
): Promise<{ message: string }> {
  const { data } = await api.put(`/facturas-proveedor-detalle/${id}`, payload);
  return data;
}

/** DELETE /facturas-proveedor-detalle/:id -> borrado fisico */
export async function eliminarFacturaProveedorDetalle(
  id: number
): Promise<{ message: string }> {
  const { data } = await api.delete(`/facturas-proveedor-detalle/${id}`);
  return data;
}
