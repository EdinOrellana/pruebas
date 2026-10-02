import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { APP_ROUTES, SISTEMAS, type SistemaId } from "../../router/navigation.config";
import { getCheques } from "../Cheque/cheque.api";
import { getContrasenasPago } from "../ContrasenaPago/contrasenaPago.api";
import { getFacturasProveedor } from "../FacturaProveedor/facturaProveedor.api";
import { getFacturaProveedorDetalles } from "../FacturaProveedorDetalle/facturaProveedorDetalle.api";
import { getCajasChicas } from "../CajaChica/cajaChica.api";
import { getMovimientosCaja } from "../CajaChicaMovimiento/cajaChicaMovimiento.api";
import { obtenerUnidadesMedida } from "../Unidad_Medida/unidadMedida.api";
import { obtenerRetenciones } from "../Retencion/retencion.api";
import "./Dashboard.css";

/**
 * Un "loader" de conteo por modulo, todos opcionales: si el modulo nuevo
 * que agregues no tiene uno, la tarjeta simplemente no muestra numero.
 */
const COUNT_LOADERS: Record<string, () => Promise<number>> = {
  "/cheques": async () => (await getCheques()).length,
  "/contrasenas-pago": async () => (await getContrasenasPago()).length,
  "/facturas-proveedor": async () => (await getFacturasProveedor()).length,
  "/facturas-proveedor-detalle": async () => (await getFacturaProveedorDetalles()).length,
  "/cajas-chicas": async () => (await getCajasChicas()).length,
  "/caja-chica-movimientos": async () => (await getMovimientosCaja()).total,
  "/unidades-medida": async () => (await obtenerUnidadesMedida()).length,
  "/retenciones": async () => (await obtenerRetenciones()).length,
};

/**
 * Pagina de inicio, en dos niveles, controlados por la URL (no por estado
 * interno) para que el sidebar (AppShell) pueda derivar el mismo sistema
 * activo con getSistemaFromPath, y para que sobreviva un refresh:
 *   1. /inicio             -> tarjetas por SISTEMA (hoy solo "Cuentas por
 *      Pagar"). Al integrar un sistema nuevo (Cuentas por Cobrar, etc.)
 *      aparece aqui solo con agregarlo a SISTEMAS + etiquetar sus modulos
 *      en navigation.config.tsx.
 *   2. /inicio/:sistemaId  -> se despliegan solo los modulos de ESE sistema
 *      (tarjetas con conteo real).
 */
export function DashboardPage() {
  const navigate = useNavigate();
  const { sistemaId } = useParams<{ sistemaId?: string }>();
  const sistemaActivo = SISTEMAS.some((s) => s.id === sistemaId)
    ? (sistemaId as SistemaId)
    : null;
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  const modulosDelSistema = APP_ROUTES.filter((route) => route.sistema === sistemaActivo);

  useEffect(() => {
    if (!sistemaActivo) return;
    modulosDelSistema.forEach((route) => {
      const cargarConteo = COUNT_LOADERS[route.path];
      if (!cargarConteo) return;
      cargarConteo()
        .then((total) => setCounts((prev) => ({ ...prev, [route.path]: total })))
        .catch(() => setCounts((prev) => ({ ...prev, [route.path]: null })));
    });
    // Solo cuando cambia el sistema activo: APP_ROUTES/COUNT_LOADERS son constantes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sistemaActivo]);

  // ---- Nivel 1: elegir sistema (si hay mas de uno) ----
  if (!sistemaActivo) {
    return (
      <div className="cpx-dashboard">
        <p className="cpx-dashboard__subtitle">Selecciona el sistema con el que quieres trabajar.</p>
        <div className="cpx-dashboard-grid">
          {SISTEMAS.map((sistema) => {
            const Icon = sistema.icon;
            const totalModulos = APP_ROUTES.filter((r) => r.sistema === sistema.id).length;
            return (
              <button
                key={sistema.id}
                type="button"
                className="cpx-module-card"
                onClick={() => navigate(`/inicio/${sistema.id}`)}
              >
                <span className="cpx-module-card__icon">
                  <Icon size={22} />
                </span>
                <span className="cpx-module-card__title">{sistema.nombre}</span>
                <span className="cpx-module-card__desc">{sistema.descripcion}</span>
                <span className="cpx-module-card__count-label">{totalModulos} módulos</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- Nivel 2: modulos del sistema elegido ----
  const sistema = SISTEMAS.find((s) => s.id === sistemaActivo)!;

  return (
    <div className="cpx-dashboard">
      <button
        type="button"
        className="cpx-dashboard__back"
        onClick={() => navigate("/inicio")}
      >
        <ChevronLeft size={14} /> Todos los sistemas
      </button>
      <p className="cpx-dashboard__subtitle">
        {sistema.nombre} — selecciona el módulo con el que quieres trabajar.
      </p>

      <div className="cpx-dashboard-grid">
        {modulosDelSistema.map((route) => {
          const Icon = route.icon;
          const total = counts[route.path];

          return (
            <button
              key={route.path}
              type="button"
              className="cpx-module-card"
              onClick={() => navigate(route.path)}
            >
              <span className="cpx-module-card__icon">
                <Icon size={22} />
              </span>
              <span className="cpx-module-card__title">{route.breadcrumb}</span>
              <span className="cpx-module-card__count">
                {total === undefined ? "…" : total === null ? "—" : total}
              </span>
              <span className="cpx-module-card__count-label">
                {total === null ? "no disponible" : "registros"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
