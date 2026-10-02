import { useState, useMemo } from "react";
import {
  Ban,
  Plus,
  RefreshCw,
  Wallet,
  Building2,
  Users,
  Pencil,
  CheckCircle2,
  Search,
  X,
  Save,
  Compass,
  BarChart3,
  Info,
} from "lucide-react";
import { useCajaChica } from "./useCajaChica";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Badge } from "../../components/common/Badge";
import { FormField } from "../../components/common/FormField";
import { Table, type Column } from "../../components/common/Table";
import { IconBtn } from "../../components/common/IconBtn";
import { SH } from "../../components/common/SH";
import { Modal } from "../../components/common/Modal";
import { SearchableSelect } from "../../components/common/SearchableSelect";
import { fmt } from "../../utils/format";
import type { CajaChica } from "./cajaChica.types";

export function CajaChicaPage() {
  const {
    cajas,
    sucursales,
    empleados,
    loading,
    saving,
    formErrors,
    formEditarErrors,
    // Crear
    modalNuevaCaja,
    setModalNuevaCaja,
    formCaja,
    onChangeFormCaja,
    registrarCaja,
    // Editar
    modalEditarCaja,
    setModalEditarCaja,
    cajaEditando,
    formEditar,
    abrirEdicion,
    onChangeFormEditar,
    guardarEdicion,
    // Otros
    inactivarCaja,
    cargarCajas,
  } = useCajaChica();

  // Estados de UX: Búsqueda predictiva, Visibilidad condicional, Gráfica y Guía
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"TODAS" | "A" | "I">("TODAS");
  const [showGuide, setShowGuide] = useState(true);
  const [showChart, setShowChart] = useState(true);
  const [chartViewMode, setChartViewMode] = useState<"STATUS" | "TOP5">("STATUS");

  // Opciones para los selectores con búsqueda
  const sucursalesOptions = useMemo(
    () =>
      sucursales.map((s) => ({
        id: s.id,
        codigo: s.codigo,
        nombre: s.nombre,
      })),
    [sucursales]
  );

  const empleadosOptions = useMemo(
    () =>
      empleados.map((e) => ({
        id: e.id,
        codigo: e.codigo,
        nombre: e.nombre,
        idSucursal: e.idSucursal,
      })),
    [empleados]
  );

  // Filtrar empleados por sucursal seleccionada en modal Crear
  const empleadosParaCrear = useMemo(() => {
    if (!formCaja.idSucursal) return [];
    return empleadosOptions.filter(
      (e) => e.idSucursal === Number(formCaja.idSucursal)
    );
  }, [empleadosOptions, formCaja.idSucursal]);

  // Filtrar empleados por sucursal de la caja en modal Editar
  const empleadosParaEditar = useMemo(() => {
    if (!cajaEditando) return empleadosOptions;
    return empleadosOptions.filter(
      (e) => e.idSucursal === cajaEditando.idSucursal
    );
  }, [empleadosOptions, cajaEditando]);

  // Filtrado reactivo (Búsqueda predictiva + Pestaña de Estado)
  const filteredCajas = useMemo(() => {
    return cajas.filter((c) => {
      // Filtro por pestaña de estado (Visibilidad condicional)
      if (statusFilter !== "TODAS" && c.estado !== statusFilter) {
        return false;
      }
      // Búsqueda predictiva sobre múltiples campos
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchSucursal = c.sucursalNombre.toLowerCase().includes(q);
      const matchCodigoSuc = c.sucursalCodigo.toLowerCase().includes(q);
      const matchResp = c.responsableNombre.toLowerCase().includes(q);
      const matchCodigoResp = c.responsableCodigo.toLowerCase().includes(q);
      const matchId = String(c.idCajaChica).includes(q);
      const matchMonto = String(c.fondoAsignado).includes(q);
      return (
        matchSucursal ||
        matchCodigoSuc ||
        matchResp ||
        matchCodigoResp ||
        matchId ||
        matchMonto
      );
    });
  }, [cajas, statusFilter, searchQuery]);

  // Métricas calculadas para las tarjetas KPI superiores
  const totalCajas = cajas.length;
  const cajasActivas = cajas.filter((c) => c.estado === "A").length;
  const cajasInactivas = cajas.filter((c) => c.estado === "I").length;

  const totalFondoActivo = useMemo(
    () => cajas.filter((c) => c.estado === "A").reduce((sum, c) => sum + c.fondoAsignado, 0),
    [cajas]
  );
  const totalFondoInactivo = useMemo(
    () => cajas.filter((c) => c.estado === "I").reduce((sum, c) => sum + c.fondoAsignado, 0),
    [cajas]
  );
  const totalFondoGeneral = totalFondoActivo + totalFondoInactivo;
  const totalFondoAsignado = totalFondoActivo;

  const promedioFondo = cajasActivas > 0 ? totalFondoActivo / cajasActivas : 0;
  const promedioInactivo = cajasInactivas > 0 ? totalFondoInactivo / cajasInactivas : 0;

  const pctActivo = totalFondoGeneral > 0 ? Math.round((totalFondoActivo / totalFondoGeneral) * 100) : 0;
  const pctInactivo = totalFondoGeneral > 0 ? 100 - pctActivo : 0;

  // Datos para la comparativa Top 5 de mayores fondos (+ Resto consolidado)
  const top5Data = useMemo(() => {
    const activeCajas = [...cajas.filter((c) => c.estado === "A")].sort(
      (a, b) => b.fondoAsignado - a.fondoAsignado
    );
    const top5 = activeCajas.slice(0, 5);
    const rest = activeCajas.slice(5);
    const restTotal = rest.reduce((sum, c) => sum + c.fondoAsignado, 0);
    const maxVal = top5.length > 0 ? top5[0].fondoAsignado : 1;

    return {
      top5,
      restCount: rest.length,
      restTotal,
      maxVal,
      totalActivo: totalFondoActivo,
    };
  }, [cajas, totalFondoActivo]);

  // Columnas para la tabla principal de Cajas Chicas
  const columnsCajas: Column<CajaChica>[] = [
    {
      header: "ID",
      numeric: true,
      render: (c) => (
        <span style={{ fontWeight: 600, color: "var(--cpx-accent)" }} className="cpx-mono">
          #{c.idCajaChica}
        </span>
      ),
    },
    {
      header: "Sucursal",
      render: (c) => (
        <div>
          <div style={{ fontWeight: 600, color: "var(--cpx-text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Building2 size={14} color="var(--cpx-text-secondary)" />
            {c.sucursalNombre}
          </div>
          <span style={{ fontSize: 11, color: "var(--cpx-text-secondary)" }} className="cpx-mono">
            {c.sucursalCodigo}
          </span>
        </div>
      ),
    },
    {
      header: "Responsable Custodio",
      render: (c) => (
        <div>
          <div style={{ color: "var(--cpx-text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Users size={14} color="var(--cpx-text-muted)" />
            {c.responsableNombre}
          </div>
          <span style={{ fontSize: 11, color: "var(--cpx-text-muted)" }} className="cpx-mono">
            {c.responsableCodigo}
          </span>
        </div>
      ),
    },
    {
      header: "Fondo Fijo Asignado",
      numeric: true,
      render: (c) => (
        <span style={{ fontWeight: 700, color: "var(--cpx-text-primary)", fontSize: 14 }}>
          {fmt(c.fondoAsignado)}
        </span>
      ),
    },
    {
      header: "Estado",
      render: (c) => (
        <Badge color={c.estado === "A" ? "success" : "danger"}>
          {c.estado === "A" ? "● ACTIVA" : "○ INACTIVA"}
        </Badge>
      ),
    },
    {
      header: "Acciones",
      render: (c) => (
        <div style={{ display: "inline-flex", gap: 6 }} title="Acciones de gestión">
          <IconBtn
            icon={Pencil}
            label={`Editar fondo #${c.idCajaChica}`}
            variant="ghost"
            onClick={() => abrirEdicion(c)}
          />
          <IconBtn
            icon={Ban}
            label={`Inactivar/Dar de baja #${c.idCajaChica}`}
            variant="danger"
            disabled={c.estado === "I"}
            onClick={() => inactivarCaja(c.idCajaChica)}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {/* 1. UX: Banner de Primeros Pasos del Flujo (Hint de Primeros Pasos) */}
      {showGuide && (
        <div className="cpx-guide-banner">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Compass size={18} color="var(--cpx-accent)" />
              <strong style={{ fontSize: 14, color: "var(--cpx-text-primary)" }}>
                Primeros Pasos: Flujo de Asignación de Caja Chica
              </strong>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--cpx-text-muted)",
                fontSize: 12,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              title="Ocultar guía de primeros pasos"
            >
              <X size={14} /> Ocultar guía
            </button>
          </div>

          <div className="cpx-guide-steps">
            <div className="cpx-guide-step">
              <span className="cpx-guide-step__num">1</span>
              <div>
                <strong style={{ fontSize: 12, display: "block" }}>Selecciona la Sucursal</strong>
                <span style={{ fontSize: 11, color: "var(--cpx-text-secondary)" }}>
                  Cada sucursal u oficina cuenta con un único fondo fijo activo.
                </span>
              </div>
            </div>

            <div className="cpx-guide-step">
              <span className="cpx-guide-step__num">2</span>
              <div>
                <strong style={{ fontSize: 12, display: "block" }}>Asigna el Custodio</strong>
                <span style={{ fontSize: 11, color: "var(--cpx-text-secondary)" }}>
                  El empleado responsable legal de resguardar el efectivo y comprobantes.
                </span>
              </div>
            </div>

            <div className="cpx-guide-step">
              <span className="cpx-guide-step__num">3</span>
              <div>
                <strong style={{ fontSize: 12, display: "block" }}>Establece el Monto Fijo</strong>
                <span style={{ fontSize: 11, color: "var(--cpx-text-secondary)" }}>
                  Fondo en Quetzales disponible para gastos menores operacionales.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Tarjetas KPI de Resumen con Colores Semánticos e Iconografía */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div
          className="cpx-card"
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            borderLeft: "4px solid var(--cpx-accent)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--cpx-text-secondary)", fontWeight: 500 }}>
              Fondo Total Activo
            </span>
            <Wallet size={18} color="var(--cpx-accent)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--cpx-text-primary)" }} className="cpx-mono">
            {fmt(totalFondoAsignado)}
          </div>
          <span style={{ fontSize: 11, color: "var(--cpx-text-muted)" }}>
            En fondos operativos en sucursales
          </span>
        </div>

        <div
          className="cpx-card"
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            borderLeft: "4px solid var(--cpx-success)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--cpx-text-secondary)", fontWeight: 500 }}>
              Cajas Chicas Activas
            </span>
            <CheckCircle2 size={18} color="var(--cpx-success)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--cpx-success)" }} className="cpx-mono">
            {cajasActivas}
          </div>
          <span style={{ fontSize: 11, color: "var(--cpx-text-muted)" }}>
            De {totalCajas} registradas en el catálogo
          </span>
        </div>

        <div
          className="cpx-card"
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            borderLeft: "4px solid var(--cpx-teal)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--cpx-text-secondary)", fontWeight: 500 }}>
              Promedio por Caja
            </span>
            <Building2 size={18} color="var(--cpx-teal)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--cpx-teal)" }} className="cpx-mono">
            {fmt(promedioFondo)}
          </div>
          <span style={{ fontSize: 11, color: "var(--cpx-text-muted)" }}>
            Por sucursal con caja abierta
          </span>
        </div>

        <div
          className="cpx-card"
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            borderLeft: "4px solid var(--cpx-purple)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "var(--cpx-text-secondary)", fontWeight: 500 }}>
              Custodios Asignados
            </span>
            <Users size={18} color="var(--cpx-purple)" />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--cpx-purple)" }} className="cpx-mono">
            {new Set(cajas.filter((c) => c.estado === "A").map((c) => c.idEmpleadoResponsable)).size}
          </div>
          <span style={{ fontSize: 11, color: "var(--cpx-text-muted)" }}>
            Empleados con asignación de fondo
          </span>
        </div>
      </div>

      {/* 3. UX: Análisis Comparativo con Selector Desplegable de Criterio */}
      <Card style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            padding: "14px 20px",
            borderBottom: showChart ? "1px solid var(--cpx-border)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BarChart3 size={18} color="var(--cpx-accent)" />
            <div>
              <strong style={{ fontSize: 14, color: "var(--cpx-text-primary)" }}>
                Análisis Comparativo de Fondos
              </strong>
              <span style={{ fontSize: 12, color: "var(--cpx-text-secondary)", display: "block" }}>
                {chartViewMode === "STATUS"
                  ? "Comparativa global: Capital en Cajas Activas vs. Cajas Inactivas"
                  : "Concentración de efectivo: Top 5 sucursales con mayor asignación"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {/* Lista Desplegable de Criterio */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <label
                htmlFor="chart-view-mode"
                style={{ fontSize: 12, color: "var(--cpx-text-secondary)", fontWeight: 500 }}
              >
                Criterio:
              </label>
              <select
                id="chart-view-mode"
                value={chartViewMode}
                onChange={(e) => setChartViewMode(e.target.value as "STATUS" | "TOP5")}
                className="cpx-field__input"
                style={{
                  fontSize: 12,
                  padding: "5px 10px",
                  height: 32,
                  width: "auto",
                  minWidth: 235,
                  cursor: "pointer",
                }}
              >
                <option value="STATUS">Comparativa: Activas vs. Inactivas</option>
                <option value="TOP5">Top 5: Sucursales con Mayor Fondo</option>
              </select>
            </div>

            <Button
              variant="secondary"
              onClick={() => setShowChart(!showChart)}
              style={{ fontSize: 12, padding: "5px 12px", height: 32 }}
            >
              {showChart ? "Ocultar Gráfica" : "Mostrar Gráfica"}
            </Button>
          </div>
        </div>

        {showChart && (
          <div style={{ padding: "20px" }}>
            {chartViewMode === "STATUS" ? (
              /* Criterio 1: Comparativa Activas vs Inactivas */
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Barra de Proporción Acumulada Segmentada (Stacked Bar) */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      marginBottom: 8,
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--cpx-success)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "var(--cpx-success)",
                          display: "inline-block",
                        }}
                      />
                      Fondos en Cajas Activas: {fmt(totalFondoActivo)} ({pctActivo}%)
                    </span>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "var(--cpx-text-muted)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: "#94a3b8",
                          display: "inline-block",
                        }}
                      />
                      Fondos en Cajas Inactivas: {fmt(totalFondoInactivo)} ({pctInactivo}%)
                    </span>
                  </div>

                  <div
                    style={{
                      height: 18,
                      width: "100%",
                      background: "#e2e8f0",
                      borderRadius: 8,
                      overflow: "hidden",
                      display: "flex",
                      boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${pctActivo}%`,
                        background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
                        transition: "width 0.4s ease",
                      }}
                      title={`Activas: ${fmt(totalFondoActivo)} (${pctActivo}%)`}
                    />
                    <div
                      style={{
                        height: "100%",
                        width: `${pctInactivo}%`,
                        background: "linear-gradient(90deg, #94a3b8 0%, #64748b 100%)",
                        transition: "width 0.4s ease",
                      }}
                      title={`Inactivas: ${fmt(totalFondoInactivo)} (${pctInactivo}%)`}
                    />
                  </div>
                </div>

                {/* Tarjetas Comparativas Ejecutivas */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: 16,
                  }}
                >
                  {/* Tarjeta Activas */}
                  <div
                    style={{
                      padding: 16,
                      background: "rgba(16, 185, 129, 0.05)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      borderRadius: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: "var(--cpx-success)", fontSize: 13 }}>
                        🟢 Cajas Activas (Fondo Operativo)
                      </span>
                      <Badge color="success">{cajasActivas} cajas</Badge>
                    </div>
                    <div
                      style={{ fontSize: 24, fontWeight: 700, color: "var(--cpx-success)" }}
                      className="cpx-mono"
                    >
                      {fmt(totalFondoActivo)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--cpx-text-secondary)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span>
                        • Representa el <strong>{pctActivo}%</strong> del capital total registrado.
                      </span>
                      <span>
                        • Promedio asignado: <strong className="cpx-mono">{fmt(promedioFondo)}</strong> por sucursal activa.
                      </span>
                      <span>
                        • Estado: <em>En circulación disponible para gastos operativos menores.</em>
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta Inactivas */}
                  <div
                    style={{
                      padding: 16,
                      background: "rgba(148, 163, 184, 0.08)",
                      border: "1px solid rgba(148, 163, 184, 0.25)",
                      borderRadius: 8,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, color: "var(--cpx-text-primary)", fontSize: 13 }}>
                        ⚪ Cajas Inactivas (Fondo Inmovilizado)
                      </span>
                      <Badge color="neutral">{cajasInactivas} cajas</Badge>
                    </div>
                    <div
                      style={{ fontSize: 24, fontWeight: 700, color: "#64748b" }}
                      className="cpx-mono"
                    >
                      {fmt(totalFondoInactivo)}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--cpx-text-secondary)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      <span>
                        • Representa el <strong>{pctInactivo}%</strong> del monto histórico registrado.
                      </span>
                      <span>
                        • Promedio histórico: <strong className="cpx-mono">{fmt(promedioInactivo)}</strong> por caja dada de baja.
                      </span>
                      <span>
                        • Estado: <em>Fondos inactivos, clausurados o archivados.</em>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Criterio 2: Top 5 Sucursales con Mayor Fondo (+ Consolidado) */
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 12, color: "var(--cpx-text-secondary)", marginBottom: 2 }}>
                  Mostrando las <strong>5 sucursales</strong> con mayor fondo asignado y consolidado del resto:
                </div>

                {top5Data.top5.map((c, idx) => {
                  const percentage = Math.round((c.fondoAsignado / top5Data.maxVal) * 100);
                  const shareTotal =
                    top5Data.totalActivo > 0 ? Math.round((c.fondoAsignado / top5Data.totalActivo) * 100) : 0;
                  return (
                    <div key={c.idCajaChica} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "var(--cpx-text-primary)",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <span
                            style={{
                              background: "var(--cpx-accent)",
                              color: "#fff",
                              fontSize: 10,
                              width: 18,
                              height: 18,
                              borderRadius: "50%",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                            }}
                          >
                            {idx + 1}
                          </span>
                          {c.sucursalNombre}{" "}
                          <span style={{ color: "var(--cpx-text-muted)", fontWeight: 400 }} className="cpx-mono">
                            ({c.sucursalCodigo})
                          </span>
                        </span>
                        <span style={{ fontWeight: 700 }} className="cpx-mono">
                          {fmt(c.fondoAsignado)}{" "}
                          <span style={{ fontSize: 11, color: "var(--cpx-text-muted)", fontWeight: 400 }}>
                            ({shareTotal}% del fondo activo)
                          </span>
                        </span>
                      </div>

                      <div
                        style={{
                          height: 10,
                          width: "100%",
                          background: "rgba(0,0,0,0.05)",
                          borderRadius: 6,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${percentage}%`,
                            background: "linear-gradient(90deg, #0071e3 0%, #00a693 100%)",
                            borderRadius: 6,
                            transition: "width 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                          title={`${c.sucursalNombre}: ${fmt(c.fondoAsignado)}`}
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Barra Consolidada del Resto de Sucursales */}
                {top5Data.restCount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      marginTop: 6,
                      paddingTop: 12,
                      borderTop: "1px dashed var(--cpx-border)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: "var(--cpx-text-secondary)" }}>
                        Otras {top5Data.restCount} sucursales activas (Consolidado)
                      </span>
                      <span style={{ fontWeight: 700 }} className="cpx-mono">
                        {fmt(top5Data.restTotal)}{" "}
                        <span style={{ fontSize: 11, color: "var(--cpx-text-muted)", fontWeight: 400 }}>
                          ({top5Data.totalActivo > 0 ? Math.round((top5Data.restTotal / top5Data.totalActivo) * 100) : 0}% del fondo activo)
                        </span>
                      </span>
                    </div>

                    <div
                      style={{
                        height: 10,
                        width: "100%",
                        background: "rgba(0,0,0,0.05)",
                        borderRadius: 6,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, Math.round((top5Data.restTotal / top5Data.totalActivo) * 100))}%`,
                          background: "linear-gradient(90deg, #94a3b8 0%, #64748b 100%)",
                          borderRadius: 6,
                        }}
                        title={`Otras ${top5Data.restCount} sucursales: ${fmt(top5Data.restTotal)}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* 4. Tabla Principal con Búsqueda Predictiva y Pestañas de Visibilidad Condicional */}
      <Card>
        <SH
          title="Fondos de Caja Chica"
          actions={
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <IconBtn
                icon={RefreshCw}
                label="Refrescar catálogo"
                variant="ghost"
                onClick={cargarCajas}
                disabled={loading}
              />
              <Button
                variant="primary"
                onClick={() => setModalNuevaCaja(true)}
                icon={<Plus size={15} />}
              >
                Nueva caja chica
              </Button>
            </div>
          }
        />

        {/* Barra de Búsqueda Predictiva y Filtros de Estado */}
        <div
          style={{
            padding: "12px 20px",
            borderBottom: "1px solid var(--cpx-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            background: "rgba(0,0,0,0.01)",
          }}
        >
          {/* Búsqueda predictiva */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: "1.5px solid var(--cpx-border)",
              borderRadius: "var(--cpx-radius-input)",
              padding: "6px 12px",
              minWidth: 280,
              flex: 1,
              maxWidth: 420,
            }}
          >
            <Search size={15} color="var(--cpx-text-muted)" />
            <input
              type="text"
              placeholder="Buscar por sucursal, custodio, código o ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                fontSize: 13,
                color: "var(--cpx-text-primary)",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--cpx-text-muted)",
                  padding: 0,
                  display: "flex",
                }}
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Pestañas de Visibilidad Condicional (Todas / Activas / Inactivas) */}
          <div className="cpx-tabs">
            <button
              className={`cpx-tab ${statusFilter === "TODAS" ? "cpx-tab--active" : ""}`}
              onClick={() => setStatusFilter("TODAS")}
            >
              Todas ({totalCajas})
            </button>
            <button
              className={`cpx-tab ${statusFilter === "A" ? "cpx-tab--active" : ""}`}
              onClick={() => setStatusFilter("A")}
            >
              Activas ({cajasActivas})
            </button>
            <button
              className={`cpx-tab ${statusFilter === "I" ? "cpx-tab--active" : ""}`}
              onClick={() => setStatusFilter("I")}
            >
              Inactivas ({cajasInactivas})
            </button>
          </div>
        </div>

        {/* Sugerencias Rápidas de Búsqueda Predictiva */}
        {searchQuery.trim() && (
          <div
            style={{
              padding: "6px 20px",
              background: "var(--cpx-accent-sub)",
              fontSize: 12,
              color: "var(--cpx-accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              Mostrando <strong>{filteredCajas.length}</strong> de {cajas.length} resultados para "
              <em>{searchQuery}</em>"
            </span>
            <button
              onClick={() => setSearchQuery("")}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: 11,
                color: "var(--cpx-accent)",
                fontWeight: 600,
              }}
            >
              Quitar filtro
            </button>
          </div>
        )}

        <Table
          columns={columnsCajas}
          data={filteredCajas}
          rowKey={(c) => c.idCajaChica}
          emptyMessage={
            loading
              ? "Cargando catálogo de cajas chicas..."
              : searchQuery
              ? `No se encontraron coincidencias para "${searchQuery}"`
              : "No hay cajas chicas registradas en este estado."
          }
        />
      </Card>

      {/* 5. Modal: Crear Nueva Caja Chica (Con SearchableSelect, Validaciones Inline y Affordance) */}
      <Modal
        open={modalNuevaCaja}
        title="Apertura de Caja Chica (Fondo Fijo)"
        onClose={() => setModalNuevaCaja(false)}
      >
        <form onSubmit={registrarCaja}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
            {/* Combobox con búsqueda de Sucursal */}
            <SearchableSelect
              label="Sucursal de Operación"
              placeholder="-- Seleccione una sucursal --"
              searchPlaceholder="Escribe el nombre o código de sucursal..."
              value={formCaja.idSucursal}
              options={sucursalesOptions}
              onChange={(val) => onChangeFormCaja("idSucursal", val)}
              error={formErrors.idSucursal}
              hint="Sucursal u oficina donde radicará físicamente el fondo"
              required
            />

            {/* Combobox con búsqueda de Empleado Custodio filtrado por Sucursal */}
            <SearchableSelect
              label="Empleado Responsable Custodio"
              placeholder={
                !formCaja.idSucursal
                  ? "-- Primero selecciona una sucursal --"
                  : "-- Seleccione un custodio --"
              }
              searchPlaceholder="Escribe el nombre o código de empleado..."
              value={formCaja.idEmpleadoResponsable}
              options={empleadosParaCrear}
              onChange={(val) => onChangeFormCaja("idEmpleadoResponsable", val)}
              error={formErrors.idEmpleadoResponsable}
              hint={
                !formCaja.idSucursal
                  ? "Primero debes seleccionar una sucursal para cargar a su personal disponible."
                  : empleadosParaCrear.length === 0
                  ? "No se encontraron empleados registrados en esta sucursal."
                  : `Mostrando ${empleadosParaCrear.length} custodio(s) disponible(s) en esta sucursal.`
              }
              disabled={!formCaja.idSucursal}
              required
            />

            {/* Input de Monto con Validaciones Inline y Hint de Formato */}
            <FormField
              label="Fondo Fijo Asignado (Q)"
              type="number"
              maxLength={12}
              mono
              placeholder="Ej. 2500.00"
              value={formCaja.fondoAsignado === "" ? "" : String(formCaja.fondoAsignado)}
              onChange={(e) => onChangeFormCaja("fondoAsignado", e.target.value)}
              error={formErrors.fondoAsignado}
              hint="Formato: Monto numérico mayor a 0 en Quetzales (Q)"
              required
            />

            {/* Visibilidad condicional: Aviso de Auditoría si el fondo es elevado */}
            {Number(formCaja.fondoAsignado) > 10000 && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "rgba(255, 149, 0, 0.12)",
                  border: "1px solid rgba(255, 149, 0, 0.3)",
                  borderRadius: "var(--cpx-radius-sm)",
                  fontSize: 12,
                  color: "#b45309",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Info size={16} />
                <span>
                  <strong>Nota de Auditoría:</strong> Fondos mayores a Q 10,000.00 requieren
                  autorización especial de la Gerencia Financiera.
                </span>
              </div>
            )}
          </div>

          {/* Botones con Affordance y Colores Semánticos */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button
              type="button"
              variant="danger"
              icon={<X size={15} />}
              onClick={() => setModalNuevaCaja(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={saving}
              icon={<Save size={16} />}
            >
              {saving ? "Guardando..." : "Guardar caja chica"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. Modal: Editar Caja Chica (Con SearchableSelect, Validaciones y Affordance) */}
      <Modal
        open={modalEditarCaja}
        title={cajaEditando ? `Editar Caja Chica #${cajaEditando.idCajaChica}` : "Editar Caja Chica"}
        onClose={() => setModalEditarCaja(false)}
      >
        <form onSubmit={guardarEdicion}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
            {cajaEditando && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--cpx-accent-sub)",
                  borderRadius: "var(--cpx-radius-sm)",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Building2 size={16} color="var(--cpx-accent)" />
                <span>
                  <strong>Sucursal:</strong> {cajaEditando.sucursalNombre} ({cajaEditando.sucursalCodigo})
                </span>
              </div>
            )}

            {/* Combobox con búsqueda de Empleado Custodio filtrado por Sucursal */}
            <SearchableSelect
              label="Empleado Responsable Custodio"
              placeholder="-- Seleccione un empleado --"
              searchPlaceholder="Escribe el nombre o código de empleado..."
              value={formEditar.idEmpleadoResponsable}
              options={empleadosParaEditar}
              onChange={(val) => onChangeFormEditar("idEmpleadoResponsable", val)}
              error={formEditarErrors.idEmpleadoResponsable}
              hint={`Mostrando ${empleadosParaEditar.length} custodio(s) disponible(s) en la sucursal ${cajaEditando?.sucursalNombre || ""}.`}
              required
            />

            <FormField
              label="Fondo Fijo Asignado (Q)"
              type="number"
              maxLength={12}
              mono
              placeholder="Ej. 2500.00"
              value={formEditar.fondoAsignado === "" ? "" : String(formEditar.fondoAsignado)}
              onChange={(e) => onChangeFormEditar("fondoAsignado", e.target.value)}
              error={formEditarErrors.fondoAsignado}
              hint="Nuevo monto de fondo fijo asignado"
              required
            />

            <div className="cpx-field" style={{ width: "100%" }}>
              <label className="cpx-field__label">Estado del Fondo</label>
              <select
                className="cpx-field__input"
                value={formEditar.estado}
                onChange={(e) => onChangeFormEditar("estado", e.target.value as "A" | "I")}
              >
                <option value="A">ACTIVA (Fondo Operativo)</option>
                <option value="I">INACTIVA (Fondo Cerrado / Baja)</option>
              </select>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button
              type="button"
              variant="danger"
              icon={<X size={15} />}
              onClick={() => setModalEditarCaja(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={saving}
              icon={<Save size={16} />}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
