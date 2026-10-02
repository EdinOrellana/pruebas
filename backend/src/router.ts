import { Router } from "express";
import chequeRoutes from "./routes/cheque.routes";
import contrasenaPagoRoutes from "./routes/contrasenaPago.routes";
import facturaProveedorRoutes from "./routes/facturaProveedor.routes";
import facturaProveedorDetalleRoutes from "./routes/facturaProveedorDetalle.routes";
import cajaChicaRoutes from "./routes/cajaChica.routes";
import cajaChicaMovimientoRoutes from "./routes/cajaChicaMovimiento.routes";
import unidadMedidaRoutes from "./routes/unidadMedidaRoutes";
import retencionRoutes from "./routes/retencionRoutes";

/**
 * ARCHIVO COMPARTIDO — ver CONTRIBUTING.md. Solo se agrega una entrada al
 * arreglo API_MODULES de abajo, no se reestructura este archivo.
 *
 * Router principal: agrupa todos los modulos de rutas de la API.
 */
const router = Router();

/**
 * Tabla de registro de modulos: para agregar un modulo nuevo solo se
 * suma una entrada aqui (import + linea), sin tocar el resto del archivo.
 */
const API_MODULES: { path: string; router: Router }[] = [
  { path: "/cheques", router: chequeRoutes },
  { path: "/contrasenas-pago", router: contrasenaPagoRoutes },
  { path: "/facturas-proveedor", router: facturaProveedorRoutes },
  { path: "/facturas-proveedor-detalle", router: facturaProveedorDetalleRoutes },
  { path: "/cajas-chicas", router: cajaChicaRoutes },
  { path: "/caja-chica-movimientos", router: cajaChicaMovimientoRoutes },
  { path: "/unidades-medida", router: unidadMedidaRoutes },
  { path: "/retenciones", router: retencionRoutes },
];

API_MODULES.forEach((mod) => router.use(mod.path, mod.router));

export default router;