export type EstadoCajaChica = "A" | "I";

/** Caja Chica retornada por el backend. */
export interface CajaChica {
  idCajaChica: number;
  idSucursal: number;
  sucursalNombre: string;
  sucursalCodigo: string;
  idEmpleadoResponsable: number;
  responsableNombre: string;
  responsableCodigo: string;
  fondoAsignado: number;
  estado: EstadoCajaChica;
}

/** Payload para crear una nueva Caja Chica. */
export interface CrearCajaChicaInput {
  idSucursal: number | "";
  idEmpleadoResponsable: number | "";
  fondoAsignado: number | "";
}

/** Payload para editar una Caja Chica existente. */
export interface ActualizarCajaChicaInput {
  idEmpleadoResponsable: number | "";
  fondoAsignado: number | "";
  estado?: EstadoCajaChica;
}

/** Elemento de catálogo (Sucursal o Empleado). */
export interface CatalogoItem {
  id: number;
  codigo: string;
  nombre: string;
  idSucursal?: number;
}

export interface CatalogosResponse {
  sucursales: CatalogoItem[];
  empleados: CatalogoItem[];
}
