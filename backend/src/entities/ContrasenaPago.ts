import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * Entidad ContrasenaPago -> tabla CP_CONTRASENA_PAGO (en Oracle).
 */
@Entity({ name: "CP_CONTRASENA_PAGO" })
export class ContrasenaPago {
  @PrimaryGeneratedColumn({ name: "ID_CONTRASENA" })
  idContrasena!: number;

  @Column({ name: "ID_FACTURA_PROVEEDOR", type: "number" })
  idFacturaProveedor!: number;

  @Column({ name: "FECHA", type: "date" })
  fecha!: Date;

  @Column({ name: "FORMA_PAGO", type: "varchar2", length: 20 })
  formaPago!: "CHEQUE" | "TRANSFERENCIA" | "EFECTIVO";

  @Column({ name: "ESTADO", type: "varchar2", length: 20, default: "PENDIENTE" })
  estado!: "PENDIENTE" | "EMITIDA" | "PAGADA" | "ANULADA";

  @Column({ name: "MONTO", type: "number", precision: 14, scale: 2 })
  monto!: number;

  @Column({ name: "ID_EMPLEADO_AUTORIZA", type: "number", nullable: true })
  idEmpleadoAutoriza!: number | null;

  /** Motivo escrito al anular la contrasena. */
  @Column({ name: "NOTAS", type: "varchar2", length: 300, nullable: true })
  notas!: string | null;
}
