import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { FacturaProveedor } from "./FacturaProveedor";

/**
 * Entidad FacturaProveedorDetalle -> tabla CP_FACTURA_PROVEEDOR_DETALLE (en Oracle).
 */
@Entity({ name: "CP_FACTURA_PROVEEDOR_DETALLE" })
export class FacturaProveedorDetalle {
  @PrimaryGeneratedColumn({ name: "ID_FACTURA_PROV_DETALLE" })
  idFacturaProvDetalle!: number;

  @Column({ name: "ID_FACTURA_PROVEEDOR", type: "number" })
  idFacturaProveedor!: number;

  @Column({ name: "ID_ARTICULO", type: "number", nullable: true })
  idArticulo!: number | null;

  @Column({ name: "DESCRIPCION", type: "varchar2", length: 300 })
  descripcion!: string;

  @Column({ name: "CANTIDAD", type: "number", precision: 14, scale: 2, default: 1 })
  cantidad!: number;

  @Column({ name: "PRECIO_UNITARIO", type: "number", precision: 14, scale: 4 })
  precioUnitario!: number;

  @Column({ name: "ID_UNIDAD_MEDIDA", type: "number", nullable: true })
  idUnidadMedida!: number | null;

  @Column({ name: "SUBTOTAL", type: "number", precision: 14, scale: 2 })
  subtotal!: number;

  @ManyToOne(() => FacturaProveedor, (factura) => factura.detalles, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ID_FACTURA_PROVEEDOR" })
  factura!: FacturaProveedor;
}
