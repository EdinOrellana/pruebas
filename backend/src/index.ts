import "reflect-metadata";
import * as dotenv from "dotenv";
dotenv.config();

import { AppDataSource } from "./data-source";
import { createServer } from "./server";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

/**
 * Punto de entrada: inicializa la conexion a Oracle (TypeORM) y luego
 * arranca el servidor HTTP.
 */
async function bootstrap() {
  try {
    await AppDataSource.initialize();
    console.log("✔ Conexion a Oracle establecida (TypeORM DataSource)");

    const app = createServer();
    app.listen(PORT, () => {
      console.log(`✔ Servidor escuchando en http://localhost:${PORT}`);
      console.log(`  API base: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error("[ERROR] No se pudo iniciar la aplicacion:", err);
    process.exit(1);
  }
}

bootstrap();
