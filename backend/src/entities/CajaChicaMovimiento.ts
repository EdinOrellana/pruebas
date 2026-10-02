import { Entity, PrimaryColumn, Column } from "typeorm";

/**
 * Entidad CajaChicaMovimiento -> tabla CXP_CAJA_CHICA_MOVIMIENTO (DDL v2 en Oracle).
 *
 * Utilizada para tipado/metadata del DataSource de TypeORM.
 * La persistencia se realiza a través de PKG_CAJA_CHICA en Oracle.
 */
@Entity({ name: "CP_CAJA_CHICA_MOVIMIENTO" })
export class CajaChicaMovimiento {
  @PrimaryColumn({ name: "ID_MOVIMIENTO_CAJA", type: "number" })
  idMovimientoCaja!: number;

  @Column({ name: "ID_CAJA_CHICA", type: "number" })
  idCajaChica!: number;

  @Column({ name: "FECHA", type: "date" })
  fecha!: Date;

  @Column({ name: "TIPO_MOVIMIENTO", type: "varchar2", length: 20 })
  tipoMovimiento!: "REPOSICION" | "GASTO" | "ANULADO";

  @Column({ name: "CONCEPTO", type: "varchar2", length: 300 })
  concepto!: string;

  @Column({ name: "MONTO", type: "number", precision: 10, scale: 2 })
  monto!: number;

  @Column({ name: "NUMERO_COMPROBANTE", type: "varchar2", length: 50, nullable: true })
  numeroComprobante?: string | null;

  @Column({ name: "ELIMINADO", type: "char", length: 1, default: "N" })
  eliminado!: "S" | "N";

  @Column({ name: "FECHA_ELIMINACION", type: "timestamp", nullable: true })
  fechaEliminacion?: Date | null;

  @Column({ name: "ELIMINADO_POR", type: "number", nullable: true })
  eliminadoPor?: number | null;
}