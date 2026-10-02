import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

/**
 * Entidad Cheque -> tabla CP_CHEQUE (en Oracle).
 */
@Entity({ name: "CP_CHEQUE" })
export class Cheque {
  @PrimaryGeneratedColumn({ name: "ID_CHEQUE" })
  idCheque!: number;

  @Column({ name: "ID_CONTRASENA_PAGO", type: "number" })
  idContrasenaPago!: number;

  @Column({ name: "BANCO", type: "varchar2", length: 50 })
  banco!: string;

  @Column({ name: "NUMERO_CHEQUE", type: "varchar2", length: 20 })
  numeroCheque!: string;

  @Column({ name: "FECHA_EMISION", type: "date" })
  fechaEmision!: Date;

  @Column({ name: "FECHA_COBRO", type: "date", nullable: true })
  fechaCobro!: Date | null;

  @Column({ name: "ESTADO", type: "varchar2", length: 20, default: "EMITIDO" })
  estado!: "EMITIDO" | "COBRADO" | "ANULADO";
}
