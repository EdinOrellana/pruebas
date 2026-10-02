export type TipoMovimiento = 'REPOSICION' | 'GASTO' | 'ANULADO';

export interface TipoMovimientoItem {
  codigo: string;
  descripcion: string;
}

export interface CajaChicaInfo {
  idCajaChica: number;
  nombreSucursal: string;
  fondoAsignado: number;
  estado: string;
}

export interface EstadoCajaChica {
  idCajaChica: number;
  nombreSucursal?: string;
  fondoAsignado: number;
  totalGastos: number;
  totalReposiciones: number;
  saldoActual: number;
  estado: string;
}

export interface CajaChicaMovimientoItem {
  idMovimientoCaja: number;
  idCajaChica: number;
  nombreSucursal?: string;
  fecha: string;
  tipoMovimiento: TipoMovimiento;
  concepto: string;
  monto: number;
  numeroComprobante?: string;
}

export interface RegistrarMovimientoPayload {
  idCajaChica?: number;
  tipoMovimiento: TipoMovimiento | string;
  concepto: string;
  monto: number;
  numeroComprobante?: string;
}

export interface ListarMovimientosResponse {
  total: number;
  movimientos: CajaChicaMovimientoItem[];
  limite: number;
  offset: number;
}