import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";


@Entity({ name: "CP_TIPO_UNIDAD_MEDIDA" })
export class UnidadMedida {
  @PrimaryGeneratedColumn({ name: "ID_UNIDAD_MEDIDA" })
  idUnidadMedida!: number;

  @Column({ name: "DESCRIPCION", type: "varchar2", length: 100 })
  descripcion!: string;
}