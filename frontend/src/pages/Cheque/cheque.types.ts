export type EstadoCheque = "EMITIDO" | "COBRADO" | "ANULADO";

/** Cheque tal como lo devuelve el backend. */
export interface Cheque {
  idCheque: number;
  idContrasenaPago: number;
  banco: string;
  numeroCheque: string;
  fechaEmision: string | null;
  fechaCobro: string | null;
  estado: EstadoCheque;
}

/** Payload para crear un cheque (POST /cheques). */
export interface CrearChequeInput {
  idContrasenaPago: number;
  banco: string;
  numeroCheque: string;
  fechaEmision: string;
}

/** Payload para actualizar un cheque (PUT /cheques/:id). */
export interface ActualizarChequeInput {
  banco: string;
  numeroCheque: string;
  fechaCobro?: string | null;
}