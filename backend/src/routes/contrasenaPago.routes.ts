import { Router } from "express";
import {
  listarContrasenas,
  listarEmpleadosAutorizan,
  obtenerContrasena,
  crearContrasena,
  actualizarContrasena,
  registrarPagoContrasena,
  anularContrasena,
} from "../handlers/contrasenaPago.handler";

const router = Router();

// GET /contrasenas-pago        -> lista todas
router.get("/", listarContrasenas);

// GET /contrasenas-pago/empleados -> empleados activos (selector "Autoriza"); antes de /:id
router.get("/empleados", listarEmpleadosAutorizan);

// GET /contrasenas-pago/:id    -> una por id
router.get("/:id", obtenerContrasena);

// POST /contrasenas-pago       -> crear (valida factura, monto vs saldo disponible y empleado)
router.post("/", crearContrasena);

// PUT /contrasenas-pago/:id    -> actualizar (solo PENDIENTE)
router.put("/:id", actualizarContrasena);

// PUT /contrasenas-pago/:id/pagar -> pago directo TRANSFERENCIA/EFECTIVO (PENDIENTE -> PAGADA)
router.put("/:id/pagar", registrarPagoContrasena);

// PUT /contrasenas-pago/:id/anular -> anular con motivo obligatorio (se guarda en NOTAS; solo PENDIENTE)
router.put("/:id/anular", anularContrasena);

export default router;
