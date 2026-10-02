import { Router } from "express";
import {
  listarCajasChicas,
  listarCatalogos,
  obtenerCajaChica,
  crearCajaChica,
  actualizarCajaChica,
  inactivarCajaChica,
} from "../handlers/cajaChica.handler";

const router = Router();

// GET /cajas-chicas            -> lista todas las cajas chicas
router.get("/", listarCajasChicas);

// GET /cajas-chicas/catalogos  -> sucursales y empleados para selectores
router.get("/catalogos", listarCatalogos);

// GET /cajas-chicas/:id        -> obtener detalle de una caja
router.get("/:id", obtenerCajaChica);

// POST /cajas-chicas           -> crear caja chica
router.post("/", crearCajaChica);

// PUT /cajas-chicas/:id        -> actualizar caja chica
router.put("/:id", actualizarCajaChica);

// DELETE /cajas-chicas/:id     -> inactivar caja chica (baja lógica ESTADO='I')
router.delete("/:id", inactivarCajaChica);

export default router;
