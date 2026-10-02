import { Router } from "express";
import {
  listarDetalles,
  obtenerDetalle,
  crearDetalle,
  actualizarDetalle,
  eliminarDetalle,
} from "../handlers/facturaProveedorDetalle.handler";

const router = Router();

router.get("/", listarDetalles);
router.get("/:id", obtenerDetalle);
router.post("/", crearDetalle);
router.put("/:id", actualizarDetalle);
router.delete("/:id", eliminarDetalle);

export default router;
