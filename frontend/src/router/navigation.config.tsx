import type { ReactElement } from "react";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  Wallet,
  ArrowLeftRight,
  Package,
  type LucideIcon,
} from "lucide-react";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";
import { ChequePage } from "../pages/Cheque/ChequePage";
import { ContrasenaPagoPage } from "../pages/ContrasenaPago/ContrasenaPagoPage";
import { FacturaProveedorPage } from "../pages/FacturaProveedor/FacturaProveedorPage";
import { FacturaProveedorDetallePage } from "../pages/FacturaProveedorDetalle/FacturaProveedorDetallePage";
import { CajaChicaPage } from "../pages/CajaChica/CajaChicaPage";
import { CajaChicaMovimientoPage } from "../pages/CajaChicaMovimiento/CajaChicaMovimientoPage";
import { RetencionPage } from "../pages/Retencion/RetencionPage";
import { UnidadMedidaPage } from "../pages/Unidad_Medida/UnidadMedidaPage.tsx";

/** Id corto de sistema, en minusculas y con guiones (se usa en URLs/estado). */
export type SistemaId = "cuentas-por-pagar";

export interface SistemaMeta {
  id: SistemaId;
  nombre: string;
  descripcion: string;
  icon: LucideIcon;
}

/**
 * Registro de "sistemas" (grupos de modulos). Inicio muestra una tarjeta
 * por sistema; al hacer clic se despliegan solo los modulos que tengan
 * ese mismo `sistema` en APP_ROUTES.
 *
 * Para integrar un sistema nuevo (ej. Cuentas por Cobrar):
 *   1. Agregar su id al type SistemaId de arriba.
 *   2. Agregar una entrada aqui.
 *   3. Etiquetar sus modulos en APP_ROUTES con sistema: "el-nuevo-id".
 * Con eso Inicio ya lo muestra solo — no hace falta tocar DashboardPage.tsx.
 */
export const SISTEMAS: SistemaMeta[] = [
  {
    id: "cuentas-por-pagar",
    nombre: "Cuentas por Pagar",
    descripcion: "Cheques, facturas de proveedor, retenciones y caja chica",
    icon: Wallet,
  },
];

/**
 * Deriva el sistema activo a partir de la URL actual, para que el sidebar
 * (AppShell) sepa que modulos mostrar debajo de "Inicio":
 *   - En /inicio/<sistemaId> (nivel 2 del dashboard) -> ese sistemaId.
 *   - En cualquier modulo real (/cheques, etc.) -> el `sistema` de ese modulo.
 *   - En /inicio "pelado" (nivel 1, sin elegir) o cualquier otra ruta -> null.
 * No requiere estado global: se recalcula solo con la URL, asi que
 * sobrevive un refresh y el boton "atras" del navegador sin trucos.
 */
export function getSistemaFromPath(pathname: string): SistemaId | null {
  const nivelDosInicio = pathname.match(/^\/inicio\/([^/]+)/);
  if (nivelDosInicio) {
    const id = nivelDosInicio[1] as SistemaId;
    return SISTEMAS.some((s) => s.id === id) ? id : null;
  }

  const rutaModulo = APP_ROUTES.filter((r) => r.sistema)
    .sort((a, b) => b.path.length - a.path.length)
    .find((r) => pathname.startsWith(r.path));

  return rutaModulo?.sistema ?? null;
}

export interface AppNavRoute {
  path: string;
  title: string;
  breadcrumb: string;
  icon: LucideIcon;
  element: ReactElement;
  /** A que sistema pertenece este modulo. Vacio = no aparece en Inicio (ej. el propio Inicio). */
  sistema?: SistemaId;
}

/**
 * ARCHIVO COMPARTIDO — ver CONTRIBUTING.md. Solo se agrega una entrada al
 * arreglo APP_ROUTES de abajo, no se reestructura este archivo.
 *
 * Registro unico de modulos: ruta, titulo/breadcrumb, icono del sidebar,
 * sistema al que pertenece y componente de pagina. AppRouter y AppShell se
 * generan a partir de esta lista, asi que agregar un modulo nuevo es una
 * sola entrada aqui y no requiere tocar AppRouter.tsx ni AppShell.tsx.
 */
export const APP_ROUTES: AppNavRoute[] = [
  {
    path: "/inicio",
    title: "Cuentas por Pagar",
    breadcrumb: "Inicio",
    icon: LayoutDashboard,
    element: <DashboardPage />,
  },
  {
    path: "/cheques",
    title: "Gestión de Cheques",
    breadcrumb: "Cheques",
    icon: FileText,
    element: <ChequePage />,
    sistema: "cuentas-por-pagar",
  },
  {
    path: "/contrasenas-pago",
    title: "Contraseñas de Pago",
    breadcrumb: "Contraseñas de Pago",
    icon: FileText,
    element: <ContrasenaPagoPage />,
    sistema: "cuentas-por-pagar",
  },
  {
    path: "/facturas-proveedor",
    title: "Facturas de Proveedor",
    breadcrumb: "Facturas Proveedor",
    icon: Receipt,
    element: <FacturaProveedorPage />,
    sistema: "cuentas-por-pagar",
  },
  {
    path: "/facturas-proveedor-detalle",
    title: "Detalle de Factura de Proveedor",
    breadcrumb: "Detalle Factura Proveedor",
    icon: FileText,
    element: <FacturaProveedorDetallePage />,
    sistema: "cuentas-por-pagar",
  },
  {
    path: "/cajas-chicas",
    title: "Gestión de Caja Chica",
    breadcrumb: "Caja Chica",
    icon: Wallet,
    element: <CajaChicaPage />,
    sistema: "cuentas-por-pagar",
  },
  {
    path: "/caja-chica-movimientos",
    title: "Movimientos de Caja",
    breadcrumb: "Movimientos de Caja",
    icon: ArrowLeftRight,
    element: <CajaChicaMovimientoPage />,
    sistema: "cuentas-por-pagar",
  },
  {
    path: "/unidades-medida",
    title: "Unidad de Medida",
    breadcrumb: "Unidad Medida",
    icon: Package,
    element: <UnidadMedidaPage />,
    sistema: "cuentas-por-pagar",
  },
  {
    path: "/retenciones",
    title: "Retenciones",
    breadcrumb: "Retenciones",
    icon: Receipt,
    element: <RetencionPage />,
    sistema: "cuentas-por-pagar",
  },
];
