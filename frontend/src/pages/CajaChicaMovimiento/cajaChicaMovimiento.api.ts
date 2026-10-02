import axios from 'axios';
import type {
  EstadoCajaChica,
  CajaChicaMovimientoItem,
  RegistrarMovimientoPayload,
  TipoMovimientoItem,
  CajaChicaInfo,
  ListarMovimientosResponse,
} from './cajaChicaMovimiento.types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
});

export const getEstadoCaja = async (idCaja: number): Promise<EstadoCajaChica> => {
  const { data } = await api.get<EstadoCajaChica>(`/caja-chica-movimientos/${idCaja}/estado`);
  return data;
};

export const getMovimientosCaja = async (
  idCaja?: number,
  limite?: number,
  offset?: number
): Promise<ListarMovimientosResponse> => {
  const params: Record<string, any> = {};
  if (limite !== undefined) params.limite = limite;
  if (offset !== undefined) params.offset = offset;

  // Si idCaja tiene un valor válido > 0, consulta la caja específica.
  // Si es undefined, null o 0, consulta el endpoint general sin ID.
  const endpoint = idCaja && idCaja > 0
    ? `/caja-chica-movimientos/${idCaja}`
    : '/caja-chica-movimientos';

  const { data } = await api.get<ListarMovimientosResponse | CajaChicaMovimientoItem[]>(
    endpoint,
    { params }
  );

  if (Array.isArray(data)) {
    return {
      total: data.length,
      movimientos: data,
      limite: limite || data.length,
      offset: offset || 0,
    };
  }
  return data;
};

export const getTiposMovimientoDB = async (): Promise<TipoMovimientoItem[]> => {
  const { data } = await api.get<TipoMovimientoItem[]>('/caja-chica-movimientos/tipos');
  return data;
};

export const getCajasDisponiblesDB = async (): Promise<CajaChicaInfo[]> => {
  const { data } = await api.get<CajaChicaInfo[]>('/caja-chica-movimientos/cajas');
  return data;
};

export const registrarMovimientoCaja = async (
  idCaja: number,
  payload: RegistrarMovimientoPayload
): Promise<{ message: string; idMovimientoCaja: number }> => {
  const { data } = await api.post(`/caja-chica-movimientos/${idCaja}`, payload);
  return data;
};

export const anularMovimientoCaja = async (
  idMovimientoCaja: number,
  motivo: string
): Promise<{ message: string }> => {
  const { data } = await api.put(`/caja-chica-movimientos/movimiento/${idMovimientoCaja}/anular`, { motivo });
  return data;
};
