import { Entity, PrimaryColumn, Column } from "typeorm";

/**
 * Entidad CajaChica -> tabla CXP_CAJA_CHICA (DDL v2 en Oracle).
 *
 * Utilizada para tipado/metadata del DataSource de TypeORM.
 * La persistencia se realiza a través de PKG_CAJA_CHICA en Oracle.
 */
@Entity({ name: "CXP_CAJA_CHICA" })
export class CajaChica {
  @PrimaryColumn({ name: "ID_CAJA_CHICA", type: "number" })
  idCajaChica!: number;

  @Column({ name: "ID_SUCURSAL", type: "number" })
  idSucursal!: number;

  @Column({ name: "ID_EMPLEADO_RESPONSABLE", type: "number" })
  idEmpleadoResponsable!: number;

  @Column({ name: "FONDO_ASIGNADO", type: "number", precision: 10, scale: 2 })
  fondoAsignado!: number;

  @Column({ name: "ESTADO", type: "char", length: 1, default: "A" })
  estado!: "A" | "I"; // 'A' = Activa, 'I' = Inactiva

  @Column({ name: "ELIMINADO", type: "char", length: 1, default: "N" })
  eliminado!: "S" | "N";

  @Column({ name: "FECHA_ELIMINACION", type: "timestamp", nullable: true })
  fechaEliminacion?: Date | null;

  @Column({ name: "ELIMINADO_POR", type: "number", nullable: true })
  eliminadoPor?: number | null;
}