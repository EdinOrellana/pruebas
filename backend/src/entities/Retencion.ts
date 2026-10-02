import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "CP_RETENCION" })
export class Retencion {
  @PrimaryGeneratedColumn({ name: "ID_RETENCION" })
  idRetencion!: number;

  @Column({ name: "ID_FACTURA_PROVEEDOR", type: "number" })
  idFacturaProveedor!: number;

  @Column({ name: "TIPO_RETENCION", type: "varchar2", length: 10 })
  tipoRetencion!: string;

  @Column({ name: "BASE_IMPONIBLE", type: "number", precision: 14, scale: 2 })
  baseImponible!: number;

  @Column({ name: "PORCENTAJE", type: "number", precision: 5, scale: 2 })
  porcentaje!: number;

  @Column({ name: "MONTO", type: "number", precision: 14, scale: 2 })
  monto!: number;

  @Column({ name: "NUMERO_CONSTANCIA", type: "varchar2", length: 50, nullable: true })
  numeroConstancia?: string;
}