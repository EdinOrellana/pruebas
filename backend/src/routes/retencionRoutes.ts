import { Router } from "express";
import {
  listarRetenciones,
  obtenerRetencion,
  crearRetencion,
  actualizarRetencion,
  eliminarRetencion,
} from "../handlers/retencionHandler";

const router = Router();

router.get("/", listarRetenciones);
router.get("/:id", obtenerRetencion);
router.post("/", crearRetencion);
router.put("/:id", actualizarRetencion);
router.delete("/:id", eliminarRetencion);

export default router;