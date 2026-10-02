import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { FacturaProveedorDetalle } from "./FacturaProveedorDetalle";

export type TipoDocumento = "FACTURA" | "FACTURA_ESPECIAL" | "NOTA_CREDITO" | "NOTA_DEBITO";
export type EstadoFactura = "PENDIENTE" | "PAGADA_PARCIAL" | "PAGADA" | "APLICADA" | "ANULADA";

/**
 * Entidad FacturaProveedor -> tabla CP_FACTURA_PROVEEDOR (en Oracle).
 */
@Entity({ name: "CP_FACTURA_PROVEEDOR" })
export class FacturaProveedor {
  @PrimaryGeneratedColumn({ name: "ID_FACTURA_PROVEEDOR" })
  idFacturaProveedor!: number;

  @Column({ name: "ID_PROVEEDOR", type: "number" })
  idProveedor!: number;

  @Column({ name: "TIPO_DOCUMENTO", type: "varchar2", length: 20 })
  tipoDocumento!: TipoDocumento;

  @Column({ name: "NUMERO_DTE", type: "varchar2", length: 50, nullable: true })
  numeroDte!: string | null;

  @Column({ name: "SERIE_DTE", type: "varchar2", length: 50, nullable: true })
  serieDte!: string | null;

  @Column({ name: "FECHA_EMISION", type: "date" })
  fechaEmision!: Date;

  @Column({ name: "FECHA_DOCUMENTO", type: "date" })
  fechaDocumento!: Date;

  @Column({ name: "FECHA_VENCIMIENTO", type: "date", nullable: true })
  fechaVencimiento!: Date | null;

  @Column({ name: "MONTO_TOTAL", type: "number", precision: 14, scale: 2 })
  montoTotal!: number;

  @Column({ name: "MONTO_RETENCION_IVA", type: "number", precision: 14, scale: 2, default: 0 })
  montoRetencionIva!: number;

  @Column({ name: "MONTO_RETENCION_ISR", type: "number", precision: 14, scale: 2, default: 0 })
  montoRetencionIsr!: number;

  @Column({ name: "SALDO_PENDIENTE", type: "number", precision: 14, scale: 2 })
  saldoPendiente!: number;

  @Column({ name: "ESTADO", type: "varchar2", length: 20, default: "PENDIENTE" })
  estado!: EstadoFactura;

  /** Factura a la que se aplica una NOTA_CREDITO / NOTA_DEBITO. */
  @Column({ name: "ID_FACTURA_REFERENCIA", type: "number", nullable: true })
  idFacturaReferencia!: number | null;

  /** Motivo escrito al anular el documento. */
  @Column({ name: "NOTAS", type: "varchar2", length: 300, nullable: true })
  notas!: string | null;

  @OneToMany(() => FacturaProveedorDetalle, (detalle) => detalle.factura, { cascade: true })
  detalles!: FacturaProveedorDetalle[];
}
