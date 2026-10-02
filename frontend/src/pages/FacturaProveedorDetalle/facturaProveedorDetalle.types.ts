/** Detalle de factura de proveedor tal como lo devuelve el backend. */
export interface FacturaProveedorDetalle {
  idFacturaProvDetalle: number;
  idFacturaProveedor: number;
  idArticulo: number | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  idUnidadMedida: number | null;
  subtotal: number;
}

/** Payload para crear un detalle (POST /facturas-proveedor-detalle). */
export interface CrearFacturaProveedorDetalleInput {
  idFacturaProveedor: number;
  idArticulo: number | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  idUnidadMedida: number | null;
}

/** Payload para actualizar un detalle (PUT /facturas-proveedor-detalle/:id). */
export interface ActualizarFacturaProveedorDetalleInput {
  idArticulo: number | null;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  idUnidadMedida: number | null;
}

/** Unidad de medida tal como la devuelve el backend (catalogo CP_TIPO_UNIDAD_MEDIDA). */
export interface UnidadMedida {
  idUnidadMedida: number;
  descripcion: string;
}
