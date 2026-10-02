import { Router } from "express";
import {
  listarUnidadesMedida,
  obtenerUnidadMedida,
  crearUnidadMedida,
  actualizarUnidadMedida,
  eliminarUnidadMedida,
} from "../handlers/unidadMedidaHandler";

const router = Router();

// GET /unidades-medida        -> lista todas las unidades
router.get("/", listarUnidadesMedida);

// GET /unidades-medida/:id    -> obtiene una por id
router.get("/:id", obtenerUnidadMedida);

// POST /unidades-medida       -> crear
router.post("/", crearUnidadMedida);

// PUT /unidades-medida/:id    -> actualizar
router.put("/:id", actualizarUnidadMedida);

// DELETE /unidades-medida/:id -> eliminar físico (SP_DELETE)
router.delete("/:id", eliminarUnidadMedida);

export default router;