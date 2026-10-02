import "reflect-metadata";
import { DataSource } from "typeorm";

/**
 * ARCHIVO COMPARTIDO — ver CONTRIBUTING.md. No deberias necesitar editar
 * este archivo nunca: una entidad nueva en ./entities se carga sola.
 *
 * DataSource de TypeORM apuntando a Oracle.
 *
 * TypeORM gestiona el pool de conexiones (usa node-oracledb por debajo).
 * Los handlers obtienen la conexion cruda de node-oracledb desde el
 * QueryRunner para ejecutar los procedimientos de paquetes PL/SQL con binds
 * OUT y REF CURSOR.
 *
 * synchronize = false porque la tabla y el paquete YA existen en Oracle.
 *
 * Las entidades se cargan por patron glob: al crear un archivo nuevo en
 * ./entities no hace falta editar este archivo ni registrar nada aqui.
 */
export const AppDataSource = new DataSource({
  type: "oracle",
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectString: process.env.DB_CONNECT_STRING,
  synchronize: false,
  logging: false,
  entities: [__dirname + "/entities/*.{ts,js}"],
});


