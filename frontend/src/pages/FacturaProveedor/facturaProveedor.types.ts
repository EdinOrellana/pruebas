export type TipoDocumento = "FACTURA" | "FACTURA_ESPECIAL" | "NOTA_CREDITO" | "NOTA_DEBITO";
/** APLICADA: nota de credito/debito ya aplicada a su factura de referencia (no se paga). */
export type EstadoFacturaProveedor = "PENDIENTE" | "PAGADA_PARCIAL" | "PAGADA" | "APLICADA" | "ANULADA";

/** Las notas de credito/debito se aplican a una factura en lugar de pagarse. */
export const esNota = (tipo: TipoDocumento) => tipo === "NOTA_CREDITO" || tipo === "NOTA_DEBITO";

export interface FacturaProveedorDetalle {
  idFacturaProvDetalle?: number;
  idFacturaProveedor?: number;
  idArticulo: number | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  idUnidadMedida: number | null;
  /** Descripcion de la unidad (solo lectura, viene del backend). */
  unidadMedida?: string | null;
  subtotal: number;
}

export interface FacturaProveedor {
  idFacturaProveedor: number;
  idProveedor: number;
  nitProveedor: string | null;
  nombreProveedor: string | null;
  tipoDocumento: TipoDocumento;
  numeroDte: string | null;
  serieDte: string | null;
  fechaEmision: string;
  fechaDocumento: string;
  fechaVencimiento: string | null;
  /** Suma de las lineas de detalle. */
  montoTotal: number;
  /** Suma de retenciones registradas en la vista Retenciones. */
  montoRetencionIva: number;
  montoRetencionIsr: number;
  /** Neto - pagos emitidos (calculado por PKG_CP_FACTURA_PROVEEDOR.SP_RECALCULAR). */
  saldoPendiente: number;
  estado: EstadoFacturaProveedor;
  /** Para NC/ND: factura a la que se aplica. */
  idFacturaReferencia: number | null;
  /** Motivo escrito al anular el documento (columna NOTAS). */
  notas: string | null;
  montoNotasCredito: number;
  montoNotasDebito: number;
  notasActivas: number;
  /** Contrasenas EMITIDAS / PAGADAS. */
  montoPagado: number;
  /** Contrasenas no anuladas (bloquean editar / anular). */
  contrasenasActivas: number;
  detalles?: FacturaProveedorDetalle[];
}

/** Proveedor activo (tabla PROVEEDOR) para el selector. */
export interface Proveedor {
  idProveedor: number;
  nit: string;
  razonSocial: string;
  nombreComercial: string | null;
  diasCredito: number;
}

export type LineaDetalleInput = Omit<FacturaProveedorDetalle, "idFacturaProvDetalle" | "idFacturaProveedor" | "unidadMedida">;

/** El monto total no se envia: lo calcula la base de datos a partir de las lineas. */
export interface CrearFacturaProveedorInput {
  idProveedor: number;
  tipoDocumento: TipoDocumento;
  numeroDte: string;
  serieDte: string;
  fechaEmision: string;
  fechaDocumento: string;
  fechaVencimiento: string;
  idFacturaReferencia: number | null;
  detalles: LineaDetalleInput[];
}

/** Solo encabezado: el total sale de las lineas y las retenciones de su propia vista. */
export interface ActualizarFacturaProveedorInput {
  idProveedor: number;
  numeroDte: string;
  serieDte: string;
  fechaEmision: string;
  fechaDocumento: string;
  fechaVencimiento: string;
  idFacturaReferencia: number | null;
}
