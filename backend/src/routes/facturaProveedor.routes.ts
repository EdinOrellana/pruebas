import { Router } from "express";
import {
  listarFacturas,
  listarProveedores,
  obtenerFactura,
  crearFactura,
  actualizarFactura,
  anularFactura,
} from "../handlers/facturaProveedor.handler";

const router = Router();

// GET /facturas-proveedor        -> lista todas
router.get("/", listarFacturas);

// GET /facturas-proveedor/proveedores -> proveedores activos para el selector (antes de /:id)
router.get("/proveedores", listarProveedores);

// GET /facturas-proveedor/:id    -> obtener por id con detalles
router.get("/:id", obtenerFactura);

// POST /facturas-proveedor       -> crear encabezado y detalles (una sola transaccion)
router.post("/", crearFactura);

// PUT /facturas-proveedor/:id    -> actualizar encabezado (solo PENDIENTE sin contrasenas)
router.put("/:id", actualizarFactura);

// PUT /facturas-proveedor/:id/anular -> anular con motivo obligatorio (se guarda en NOTAS;
// sin contrasenas ni notas de credito/debito activas)
router.put("/:id/anular", anularFactura);

export default router;
