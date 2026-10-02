import express, { Application, Request, Response } from "express";
import cors from "cors";
import router from "./router";

/**
 * Construye y configura la aplicacion Express (sin arrancar el listen).
 */
export function createServer(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Healthcheck simple
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  // Todas las rutas de la API cuelgan de /api
  app.use("/api", router);

  return app;
}
