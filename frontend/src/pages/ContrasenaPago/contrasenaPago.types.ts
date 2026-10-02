export type FormaPago = "CHEQUE" | "TRANSFERENCIA" | "EFECTIVO";
export type EstadoContrasenaPago = "PENDIENTE" | "EMITIDA" | "PAGADA" | "ANULADA";

/** Contraseña de Pago tal como la devuelve el backend. */
export interface ContrasenaPago {
  idContrasena: number;
  idFacturaProveedor: number;
  fecha: string;
  formaPago: FormaPago;
  estado: EstadoContrasenaPago;
  monto: number;
  idEmpleadoAutoriza: number | null;
  /** Motivo escrito al anular la contraseña (columna NOTAS). */
  notas: string | null;
}

/** Payload para crear una contraseña de pago (POST /contrasenas-pago). */
export interface CrearContrasenaPagoInput {
  idFacturaProveedor: number;
  fecha: string;
  formaPago: FormaPago;
  monto: number;
  idEmpleadoAutoriza: number | null;
}

/** Payload para actualizar una contraseña de pago (PUT /contrasenas-pago/:id). */
export interface ActualizarContrasenaPagoInput {
  formaPago: FormaPago;
  monto: number;
  idEmpleadoAutoriza?: number | null;
}

/** Empleado activo que puede autorizar una contraseña (GET /contrasenas-pago/empleados). */
export interface EmpleadoAutoriza {
  id: number;
  codigo: string;
  nombre: string;
}
