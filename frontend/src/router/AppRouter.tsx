import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import { AppShell } from "../components/common/AppShell";
import { ToastProvider } from "../components/common/Toast";
import { SearchProvider } from "../components/common/SearchContext";
import { APP_ROUTES } from "./navigation.config";
import { CajaChicaMovimientoPage } from "../pages/CajaChicaMovimiento/CajaChicaMovimientoPage";
import { DashboardPage } from "../pages/Dashboard/DashboardPage";

/**
 * Layout raíz: renderiza el shell (sidebar + header) una sola vez y expone
 * un <Outlet /> donde se pintan las rutas hijas.
 */
function Layout() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");

  const matchRoute = APP_ROUTES.filter((route) =>
    location.pathname.startsWith(route.path)
  ).sort((a, b) => b.path.length - a.path.length)[0];

  const meta = matchRoute
    ? { title: matchRoute.title, breadcrumb: matchRoute.breadcrumb }
    : { title: "Cuentas por Pagar", breadcrumb: "" };

  return (
    <SearchProvider>
      <AppShell
        headerTitle={meta.title}
        breadcrumb={meta.breadcrumb}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      >
        <Outlet context={{ searchTerm, setSearchTerm }} />
      </AppShell>
    </SearchProvider>
  );
}

/**
 * Enrutador principal de la aplicación con flags v7 habilitadas para evitar
 * advertencias en consola.
 */
export function AppRouter() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            {APP_ROUTES.map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}

            {/* Rutas secundarias con parámetros, fuera del registro de navegación */}
            <Route
              path="/caja-chica-movimientos/:id"
              element={<CajaChicaMovimientoPage />}
            />
            <Route path="/caja-chica" element={<Navigate to="/cajas-chicas" replace />} />

            {/* Nivel 2 de Inicio: modulos de un sistema elegido */}
            <Route path="/inicio/:sistemaId" element={<DashboardPage />} />
          </Route>

          {/* Ruta inicial */}
          <Route path="/" element={<Navigate to="/inicio" replace />} />

          {/* Rutas inexistentes */}
          <Route path="*" element={<Navigate to="/inicio" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}