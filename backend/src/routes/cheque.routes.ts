import { Router } from "express";
import {
  listarCheques,
  obtenerCheque,
  crearCheque,
  actualizarCheque,
  cobrarCheque,
  anularCheque,
} from "../handlers/cheque.handler";

const router = Router();

// GET /cheques        -> lista todos
router.get("/", listarCheques);

// GET /cheques/:id    -> uno por id
router.get("/:id", obtenerCheque);

// POST /cheques       -> crear
router.post("/", crearCheque);

// PUT /cheques/:id    -> actualizar
router.put("/:id", actualizarCheque);

// PUT /cheques/:id/cobrar -> cobrar (SP_COBRAR_CHEQUE, solo si estaba EMITIDO)
router.put("/:id/cobrar", cobrarCheque);

// DELETE /cheques/:id -> anular (SP_ANULAR_CHEQUE, no borra fisico)
router.delete("/:id", anularCheque);

export default router;
