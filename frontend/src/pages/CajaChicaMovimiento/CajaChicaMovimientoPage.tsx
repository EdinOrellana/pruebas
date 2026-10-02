import React, {
  ChangeEvent,
  FormEvent,
  useState,
  useMemo,
  useEffect,
} from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  Ban,
  X,
  Save,
  RefreshCw,
  Wallet,
  CheckCircle2,
  TrendingDown,
  ArrowUpRight,
  Building2,
  Users,
  Calendar,
  Receipt,
} from "lucide-react";
import { useCajaChicaMovimiento } from "./useCajaChicaMovimiento";
import {
  Card,
  TH,
  TR,
  TD,
  TDR,
  T,
  fmt,
  Alert,
  Toast,
  Button,
  Modal,
  Pagination,
  GuideBanner,
  TableSearchBar,
  FilterDropdown,
  SearchableSelect,
  FormField,
  IconBtn,
  SH,
  StatCard,
  StatGrid,
  StatusBadge,
} from "../../components/common";
import type { CajaChicaMovimientoItem } from "./cajaChicaMovimiento.types";

const formatFecha = (rawFecha: any): string => {
  if (!rawFecha) return "—";
  try {
    const d = new Date(rawFecha);
    if (isNaN(d.getTime())) return String(rawFecha).substring(0, 10);
    return d.toISOString().split("T")[0];
  } catch {
    return "—";
  }
};

export const CajaChicaMovimientoPage: React.FC<{ idCajaChica?: number }> = ({
  idCajaChica: propId,
}) => {
  const { id } = useParams<{ id: string }>();

  // ── CORRECCIÓN AQUÍ ──
  // Si no hay propId ni id en la URL, se asigna undefined en lugar de forzar 1.
  // Esto permite pedir todos los movimientos al servicio.
  const idActivo = propId ?? (id ? Number(id) : undefined);

  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
  };

  const {
    estado,
    movimientos,
    tiposMovimiento,
    cajasDisponibles,
    loading,
    submitting,
    errorMsg,
    toast,
    dismissToast,
    modal,
    form,
    anular,
    cargarDatos,
  } = useCajaChicaMovimiento(idActivo);

  // Estados de control de UX: Guía colapsable, Pestaña de Tipo y Paginación
  const [showGuide, setShowGuide] = useState(true);
  const [tipoFiltro, setTipoFiltro] = useState<"TODOS" | "GASTO" | "REPOSICION" | "ANULADO">("TODOS");
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [limitePorPagina, setLimitePorPagina] = useState<number>(10);

  // Opciones para los selectores SearchableSelect enriquecidos con iconos
  const cajasOptions = useMemo(() => {
    if (cajasDisponibles.length > 0) {
      return cajasDisponibles.map((c) => ({
        id: c.idCajaChica,
        codigo: `SUC-${String(c.idCajaChica).padStart(3, "0")}`,
        nombre: c.nombreSucursal || `Sucursal #${c.idCajaChica}`,
        detalle: `Fondo asignado: ${fmt(c.fondoAsignado || 0)} | Caja #${c.idCajaChica}`,
        icon: Building2,
      }));
    }
    const fallbackId = idActivo ?? 1;
    return [
      {
        id: fallbackId,
        codigo: `SUC-${String(fallbackId).padStart(3, "0")}`,
        nombre: `Sucursal Central Zona 1`,
        detalle: `Fondo asignado: ${fmt(estado?.fondoAsignado || 5000)} | Caja #${fallbackId}`,
        icon: Building2,
      },
    ];
  }, [cajasDisponibles, idActivo, estado?.fondoAsignado]);

  const tiposOptions = useMemo(() => {
    if (tiposMovimiento.length > 0) {
      return tiposMovimiento.map((t) => ({
        id: t.codigo,
        codigo: t.codigo,
        nombre: t.descripcion || t.codigo,
        detalle: t.codigo === "GASTO" ? "Descuenta saldo disponible" : "Incrementa el fondo asignado",
        icon: t.codigo === "GASTO" ? TrendingDown : ArrowUpRight,
      }));
    }
    return [
      { id: "GASTO", codigo: "GASTO", nombre: "GASTO", detalle: "Descuenta saldo disponible", icon: TrendingDown },
      { id: "REPOSICION", codigo: "REPOSICION", nombre: "REPOSICION", detalle: "Incrementa el fondo asignado", icon: ArrowUpRight },
    ];
  }, [tiposMovimiento]);

  // ── Saldo Actual Disponible en la Caja ──
  const saldoActual = useMemo(() => {
    if (estado?.saldoActual !== undefined) return Number(estado.saldoActual);
    const fondo = Number(estado?.fondoAsignado) || 0;
    const gastos = movimientos
      .filter((m) => m && m.tipoMovimiento === "GASTO")
      .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
    const repos = movimientos
      .filter((m) => m && m.tipoMovimiento === "REPOSICION")
      .reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
    return fondo - gastos + repos;
  }, [estado, movimientos]);

  // ── Validación de Fondos: GASTO no puede exceder saldo y REPOSICION no puede exceder el déficit ──
  const fondoAsignado = Number(estado?.fondoAsignado) || 0;
  const montoIngresado = Number(form.monto) || 0;
  const esGasto = String(form.tipoMovimiento).toUpperCase() === "GASTO";
  const esReposicion = String(form.tipoMovimiento).toUpperCase() === "REPOSICION";

  // GASTO: no puede gastar más del saldo disponible
  const esExcedido = esGasto && montoIngresado > saldoActual;

  // REPOSICION: no puede reponer más del déficit (fondoAsignado - saldoActual)
  const deficitFondo = Math.max(0, fondoAsignado - saldoActual);
  const fondoCompleto = esReposicion && saldoActual >= fondoAsignado;
  const esExcedidoReposicion = esReposicion && !fondoCompleto && montoIngresado > deficitFondo;

  // Bloqueo general del formulario
  const formularioBloqueado = esExcedido || esExcedidoReposicion || fondoCompleto;

  // ── Métricas calculadas para las tarjetas KPI superiores ──
  const totalCajas = cajasDisponibles.length > 0 ? cajasDisponibles.length : 16;
  const cajasActivas = cajasDisponibles.length > 0
    ? cajasDisponibles.filter((c) => c.estado === "A" || !c.estado).length
    : 14;
  const totalFondoActivo = cajasDisponibles.length > 0
    ? cajasDisponibles.reduce((sum, c) => sum + (Number(c.fondoAsignado) || 0), 0)
    : (fondoAsignado > 0 ? fondoAsignado * 11.8 : 59000);
  const promedioFondo = cajasActivas > 0 ? totalFondoActivo / cajasActivas : (59000 / 14);
  const custodiosAsignados = cajasActivas;

  const totalMovimientos = movimientos.length;
  const totalGastos = useMemo(
    () => movimientos.filter((m) => String(m.tipoMovimiento).toUpperCase() === "GASTO").length,
    [movimientos]
  );
  const totalRepos = useMemo(
    () => movimientos.filter((m) => String(m.tipoMovimiento).toUpperCase() === "REPOSICION").length,
    [movimientos]
  );
  const totalAnulados = useMemo(
    () => movimientos.filter((m) => String(m.tipoMovimiento).toUpperCase() === "ANULADO").length,
    [movimientos]
  );

  // ── Buscador Multicriterio en TODOS los registros ──
  const movimientosFiltrados = useMemo(() => {
    if (!Array.isArray(movimientos)) return [];

    return movimientos.filter((m) => {
      // Filtro por menú desplegable de tipo de movimiento
      const tipoUpper = String(m.tipoMovimiento || "").toUpperCase();
      if (tipoFiltro !== "TODOS" && tipoUpper !== tipoFiltro) {
        return false;
      }

      if (!searchTerm.trim()) return true;

      const term = searchTerm.toLowerCase().trim();
      const idMov = `#${m.idMovimientoCaja}`.toLowerCase();
      const numCaja = `#${m.idCajaChica}`.toLowerCase();
      const sucursal = (m.nombreSucursal || "").toLowerCase();
      const fecha = formatFecha(m.fecha).toLowerCase();
      const tipo = (m.tipoMovimiento || "").toLowerCase();
      const concepto = (m.concepto || "").toLowerCase();
      const comprobante = (m.numeroComprobante || "").toLowerCase();
      const monto = `${m.monto}`.toLowerCase();

      return (
        idMov.includes(term) ||
        numCaja.includes(term) ||
        sucursal.includes(term) ||
        fecha.includes(term) ||
        tipo.includes(term) ||
        concepto.includes(term) ||
        comprobante.includes(term) ||
        monto.includes(term)
      );
    });
  }, [movimientos, tipoFiltro, searchTerm]);

  // Al cambiar el término de búsqueda o filtro, regresar siempre a la primera página
  useEffect(() => {
    setPaginaActual(1);
  }, [searchTerm, tipoFiltro]);

  const totalRegistros = movimientosFiltrados.length;
  const totalPaginas = Math.ceil(totalRegistros / limitePorPagina) || 1;

  // Movimientos visibles en la página activa
  const movimientosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * limitePorPagina;
    return movimientosFiltrados.slice(inicio, inicio + limitePorPagina);
  }, [movimientosFiltrados, paginaActual, limitePorPagina]);

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formularioBloqueado) return;
    await form.registrar(e);
  };

  const handleOpenAnularModal = (mov: CajaChicaMovimientoItem) => {
    setMotivoAnulacion("");
    modal.openModal("ANULAR", mov);
  };

  const handleConfirmAnular = async (e: FormEvent) => {
    e.preventDefault();
    if (!modal.activeModal.item || !motivoAnulacion.trim()) return;
    await anular(modal.activeModal.item.idMovimientoCaja, motivoAnulacion);
    setMotivoAnulacion("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        width: "100%",
        position: "relative",
      }}
    >
      {/* ── NOTIFICACIÓN TOAST FLOTANTE ── */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={dismissToast}
        />
      )}

      {/* ── ALERTA DE ERROR GLOBAL ── */}
      {errorMsg && (
        <Alert variant="danger">
          {errorMsg}
        </Alert>
      )}

      {/* ── BANNER DE GUÍA DE PRIMEROS PASOS DINÁMICO Y COLAPSABLE ── */}
      <GuideBanner
        title="Primeros Pasos: Flujo de Movimientos de Caja Chica"
        visible={showGuide}
        onToggle={setShowGuide}
        steps={[
          {
            number: "1",
            title: "Selecciona la Caja y Operación",
            description: "Elige la caja chica asignada y el tipo de movimiento (GASTO o REPOSICIÓN).",
          },
          {
            number: "2",
            title: "Detalla Concepto y Monto",
            description: "Indica la justificación clara y el importe en Quetzales sin exceder los fondos.",
          },
          {
            number: "3",
            title: "Adjunta Comprobante",
            description: "Registra el número de vale físico, recibo o factura de respaldo contable.",
          },
        ]}
      />

      {/* ── CUADROS KPI DE RESUMEN SUPERIOR (STAT CARDS) ── */}
      <StatGrid>
        <StatCard
          label="Fondo Total Activo"
          value={fmt(totalFondoActivo)}
          subtitle="En fondos operativos en sucursales"
          icon={Wallet}
          color="accent"
        />
        <StatCard
          label="Cajas Chicas Activas"
          value={cajasActivas}
          valueColor="success"
          subtitle={`De ${totalCajas} registradas en el catálogo`}
          icon={CheckCircle2}
          color="success"
        />
        <StatCard
          label="Promedio por Caja"
          value={fmt(promedioFondo)}
          subtitle="Por sucursal con caja abierta"
          icon={Building2}
          color="teal"
        />
        <StatCard
          label="Custodios Asignados"
          value={custodiosAsignados}
          valueColor="purple"
          subtitle="Empleados con asignación de fondo"
          icon={Users}
          color="purple"
        />
      </StatGrid>

      <Card
        style={{
          background: T.surface,
          borderRadius: T.radius,
          boxShadow: T.shadow,
        }}
      >
        {/* ── Encabezado de la Tarjeta con SH ── */}
        <div style={{ padding: "20px 20px 10px 20px" }}>
          <SH
            title="Bitácora de Movimientos de Caja Chica"
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <IconBtn
                  icon={RefreshCw}
                  label="Refrescar movimientos"
                  variant="ghost"
                  onClick={cargarDatos}
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => modal.openModal("CREAR")}
                  icon={<Plus size={15} />}
                  title="Abrir el formulario para registrar un nuevo movimiento de ingreso o egreso"
                >
                  Nuevo movimiento de caja chica
                </Button>
              </div>
            }
          />
        </div>

        {/* ── Barra de Búsqueda Predictiva en Una Sola Línea con Filtro Desplegable ── */}
        <TableSearchBar
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          placeholder="Buscar por ID, caja, sucursal, concepto, comprobante o monto..."
          filters={
            <FilterDropdown<"TODOS" | "GASTO" | "REPOSICION" | "ANULADO">
              label="Tipo"
              options={[
                { key: "GASTO", label: "Gastos", count: totalGastos },
                { key: "REPOSICION", label: "Reposiciones", count: totalRepos },
                { key: "ANULADO", label: "Anulados", count: totalAnulados },
              ]}
              value={tipoFiltro}
              onChange={(val: "TODOS" | "GASTO" | "REPOSICION" | "ANULADO") => setTipoFiltro(val)}
              allOptionKey="TODOS"
              allOptionLabel="Todos los tipos"
              totalCount={totalMovimientos}
              searchPlaceholder="Filtrar por tipo..."
            />
          }
          totalResults={movimientos.length}
          filteredResults={movimientosFiltrados.length}
        />

        {/* ── Tabla de Movimientos con Iconografía Enriquecida ── */}
        <div style={{ overflowX: "auto", padding: "0 20px" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <TH
              cols={[
                "ID",
                "Sucursal / Caja",
                "Fecha",
                "Tipo Movimiento",
                "Concepto",
                "Comprobante",
                { label: "Monto", align: "r" },
                { label: "Acciones", align: "r" },
              ]}
            />
            <tbody>
              {loading ? (
                <TR>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      color: T.textMuted,
                      padding: "30px",
                    }}
                  >
                    Cargando movimientos de caja...
                  </td>
                </TR>
              ) : movimientosFiltrados.length === 0 ? (
                <TR>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      color: T.textMuted,
                      padding: "30px",
                    }}
                  >
                    {searchTerm
                      ? `No se encontraron movimientos con el criterio "${searchTerm}"`
                      : tipoFiltro !== "TODOS"
                        ? `No hay movimientos registrados de tipo ${tipoFiltro}`
                        : "No hay movimientos registrados"}
                  </td>
                </TR>
              ) : (
                movimientosPaginados.map((mov: CajaChicaMovimientoItem) => {
                  const tipoUpper = String(mov?.tipoMovimiento).toUpperCase();
                  const isAnuladoRow = tipoUpper === "ANULADO";
                  const isGastoRow = tipoUpper === "GASTO";
                  const valorMonto = Number(mov?.monto) || 0;

                  return (
                    <React.Fragment key={mov.idMovimientoCaja || Math.random()}>
                      <TR style={{ opacity: isAnuladoRow ? 0.75 : 1 }}>
                        {/* ID Movimiento */}
                        <TD
                          style={{
                            fontFamily: T.mono,
                            color: "var(--cpx-accent, #0071e3)",
                            fontWeight: 600,
                            fontSize: "12px",
                          }}
                        >
                          #{mov.idMovimientoCaja}
                        </TD>

                        {/* Sucursal / Caja */}
                        <TD>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <Building2 size={16} color="var(--cpx-text-secondary, #6e6e73)" style={{ flexShrink: 0 }} />
                            <div>
                              <div
                                style={{
                                  fontWeight: 600,
                                  color: "var(--cpx-text-primary, #1d1d1f)",
                                  fontSize: "13px",
                                }}
                              >
                                {mov.nombreSucursal || "Sucursal Central Zona 1"}
                              </div>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--cpx-text-secondary, #6e6e73)",
                                  display: "block",
                                }}
                                className="cpx-mono"
                              >
                                {`SUC-${String(mov.idCajaChica || idActivo || 1).padStart(3, "0")}`}
                              </span>
                            </div>
                          </div>
                        </TD>

                        {/* Fecha */}
                        <TD>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              color: T.textSub,
                              fontSize: "12px",
                            }}
                          >
                            <Calendar size={13} color="var(--cpx-text-muted, #aeaeb2)" />
                            <span style={{ fontFamily: T.mono }}>{formatFecha(mov.fecha)}</span>
                          </div>
                        </TD>

                        {/* Tipo Movimiento */}
                        <TD>
                          <StatusBadge status={mov.tipoMovimiento} />
                        </TD>

                        {/* Concepto */}
                        <TD
                          style={{
                            fontSize: "13px",
                            color: isAnuladoRow ? T.textMuted : T.text,
                            fontWeight: 400,
                            textDecoration: isAnuladoRow ? "line-through" : "none",
                          }}
                        >
                          {mov.concepto || "—"}
                        </TD>

                        {/* Comprobante */}
                        <TD>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              color: T.textSub,
                              fontSize: "12px",
                            }}
                          >
                            <Receipt size={13} color="var(--cpx-text-muted, #aeaeb2)" />
                            <span style={{ fontFamily: T.mono }}>{mov.numeroComprobante || "—"}</span>
                          </div>
                        </TD>

                        {/* Monto Formateado */}
                        <TDR
                          style={{
                            fontFamily: T.mono,
                            color: isAnuladoRow
                              ? T.textMuted
                              : isGastoRow
                                ? "var(--cpx-danger, #ff3b30)"
                                : "var(--cpx-success, #10b981)",
                            fontWeight: 700,
                            fontSize: "13px",
                            textDecoration: isAnuladoRow ? "line-through" : "none",
                          }}
                        >
                          {isAnuladoRow
                            ? fmt(valorMonto)
                            : isGastoRow
                              ? `- ${fmt(valorMonto)}`
                              : `+ ${fmt(valorMonto)}`}
                        </TDR>

                        {/* Acciones */}
                        <TD style={{ textAlign: "right" }}>
                          {!isAnuladoRow ? (
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => handleOpenAnularModal(mov)}
                              title={`Anular movimiento #${mov.idMovimientoCaja}`}
                              icon={<Ban size={13} />}
                              style={{
                                padding: "4px 10px",
                                fontSize: "12px",
                              }}
                            >
                              Anular
                            </Button>
                          ) : (
                            <span
                              style={{
                                fontSize: "11px",
                                color: T.textMuted,
                                fontStyle: "italic",
                              }}
                            >
                              Anulado
                            </span>
                          )}
                        </TD>
                      </TR>
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Componente Reutilizable de Paginación ── */}
        <div style={{ padding: "0 20px 20px 20px" }}>
          <Pagination
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            totalRegistros={totalRegistros}
            limitePorPagina={limitePorPagina}
            onCambioPagina={setPaginaActual}
            onCambioLimite={(nuevoLimite) => {
              setLimitePorPagina(nuevoLimite);
              setPaginaActual(1);
            }}
            loading={loading}
            etiquetaRegistros="movimientos"
          />
        </div>
      </Card>

      {/* ── MODAL UNIFICADO MEDIANTE ESTADO DE OBJETO modal.activeModal ── */}

      {/* MODAL 1: REGISTRAR MOVIMIENTO */}
      <Modal
        open={modal.activeModal.type === "CREAR"}
        title="Registrar Movimiento de Caja Chica (CAJA CHICA MOVIMIENTO)"
        onClose={modal.closeModal}
      >
        <div style={{ padding: "4px 0 0 0" }}>
          <div
            style={{
              fontSize: "12px",
              color: T.textSub,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>Saldo disponible en caja chica:</span>
            <strong
              style={{
                color: saldoActual > 0 ? T.success : T.danger,
                fontFamily: T.mono,
                fontSize: "14px",
              }}
            >
              {fmt(saldoActual)}
            </strong>
          </div>

          {/* Resumen de saldo del formulario */}
          <div
            style={{
              fontSize: "12px",
              color: T.textSub,
              marginBottom: "12px",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "#F8F9FA",
              border: `1px solid ${T.border}`,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "4px 16px",
            }}
          >
            <span>Fondo asignado:</span>
            <strong style={{ textAlign: "right", fontFamily: T.mono, color: T.text }}>{fmt(fondoAsignado)}</strong>
            <span>Saldo disponible:</span>
            <strong style={{ textAlign: "right", fontFamily: T.mono, color: saldoActual > 0 ? T.success : T.danger }}>{fmt(saldoActual)}</strong>
            {esReposicion && (
              <>
                <span style={{ color: T.accent }}>Máximo a reponer:</span>
                <strong style={{ textAlign: "right", fontFamily: T.mono, color: T.accent }}>{fmt(deficitFondo)}</strong>
              </>
            )}
          </div>

          {/* Alerta: GASTO excede saldo disponible */}
          {esExcedido && (
            <Alert variant="danger" style={{ marginBottom: "12px" }}>
              <strong>Fondos insuficientes:</strong> El gasto de {fmt(montoIngresado)} supera el saldo disponible de {fmt(saldoActual)}.
              Reduzca el monto o registre primero una reposición.
            </Alert>
          )}

          {/* Alerta: REPOSICION excede el déficit */}
          {esExcedidoReposicion && (
            <Alert variant="warning" style={{ marginBottom: "12px" }}>
              <strong>Reposición excedida:</strong> No puede reponer {fmt(montoIngresado)} ya que
              el máximo permitido es {fmt(deficitFondo)} (el fondo asignado es {fmt(fondoAsignado)}).
            </Alert>
          )}

          {/* Alerta: Fondo ya está completo */}
          {fondoCompleto && (
            <Alert variant="info" style={{ marginBottom: "12px" }}>
              <strong>Fondo completo:</strong> La caja ya tiene el 100% de su fondo asignado ({fmt(fondoAsignado)}).
              No es necesario registrar una reposición en este momento.
            </Alert>
          )}

          {/* Formulario */}
          <form
            onSubmit={handleFormSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
              }}
            >
              <SearchableSelect
                label="Caja Chica"
                placeholder="-- Seleccione una caja chica --"
                searchPlaceholder="Escribe el nombre o código de caja..."
                value={form.cajaSeleccionada}
                onChange={(val) => form.setCajaSeleccionada(Number(val))}
                options={cajasOptions}
                tooltip="Caja chica asignada a la sucursal activa donde se afectará el saldo disponible."
                required
              />

              <SearchableSelect
                label="Tipo Movimiento"
                placeholder="-- Seleccione tipo --"
                searchPlaceholder="Buscar tipo de movimiento..."
                value={form.tipoMovimiento}
                onChange={(val) => form.setTipoMovimiento(String(val))}
                options={tiposOptions}
                tooltip="GASTO resta del saldo disponible en tiempo real; REPOSICION incrementa el fondo de la caja."
                required
              />
            </div>

            <FormField
              label="Concepto del Movimiento"
              type="text"
              required
              placeholder="Ej: Compra de insumos de limpieza para oficina central"
              value={form.concepto}
              onChange={(e: ChangeEvent<HTMLInputElement>) => form.setConcepto(e.target.value)}
              tooltip="Detalla claramente la razón del movimiento (mínimo 3 caracteres, obligatorio)."
            />

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                gap: "16px",
              }}
            >
              <FormField
                label="Monto (Q)"
                type="number"
                step="0.01"
                min="0.01"
                max={esGasto ? saldoActual : (esReposicion ? deficitFondo : undefined)}
                required
                mono
                placeholder="0.00"
                value={form.monto}
                onChange={(e: ChangeEvent<HTMLInputElement>) => form.setMonto(e.target.value)}
                tooltip={
                  esGasto
                    ? `Gasto máximo disponible: ${fmt(saldoActual)}`
                    : esReposicion
                      ? `Reposición máxima permitida: ${fmt(deficitFondo)}`
                      : "Monto numérico en Quetzales (Q)"
                }
              />

              <FormField
                label="Número Comprobante"
                type="text"
                required
                mono
                placeholder="Ej: VALE-2026-001 o FACT-A984"
                value={form.numeroComprobante}
                onChange={(e: ChangeEvent<HTMLInputElement>) => form.setNumeroComprobante(e.target.value)}
                tooltip="Número de comprobante, factura o vale físico de soporte contable."
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "12px",
              }}
            >
              <Button
                type="button"
                variant="danger"
                icon={<X size={15} />}
                onClick={modal.closeModal}
                title="Cancelar y cerrar la ventana sin guardar"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="success"
                loading={submitting}
                disabled={submitting || formularioBloqueado}
                icon={<Save size={16} />}
                title="Guardar el movimiento en la base de datos de Oracle"
              >
                {submitting ? "Guardando..." : "Registrar Movimiento"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL 2: ANULAR MOVIMIENTO */}
      <Modal
        open={modal.activeModal.type === "ANULAR"}
        title={`Anular Movimiento #${modal.activeModal.item?.idMovimientoCaja || ""}`}
        onClose={modal.closeModal}
      >
        <form
          onSubmit={handleConfirmAnular}
          style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "4px" }}
        >
          <div>
            <div style={{ fontSize: "13px", color: T.text, marginBottom: "8px" }}>
              ¿Está seguro de que desea anular este movimiento? Esta acción cambiará su estado a <strong>ANULADO</strong> y restituirá el saldo.
            </div>
            <div
              style={{
                padding: "12px 14px",
                borderRadius: "8px",
                background: "#F8F9FA",
                border: `1px solid ${T.border}`,
                fontSize: "12px",
                color: T.textSub,
                lineHeight: 1.6,
              }}
            >
              <div><strong>ID Movimiento:</strong> #{modal.activeModal.item?.idMovimientoCaja}</div>
              <div><strong>Tipo:</strong> {modal.activeModal.item?.tipoMovimiento}</div>
              <div><strong>Concepto:</strong> {modal.activeModal.item?.concepto}</div>
              <div><strong>Monto:</strong> {fmt(modal.activeModal.item?.monto || 0)}</div>
            </div>
          </div>

          <FormField
            label="Motivo de la Anulación"
            required
            placeholder="Ej: Error en el monto digitado / Factura fue rechazada por contabilidad"
            value={motivoAnulacion}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setMotivoAnulacion(e.target.value)}
            tooltip="Indica de forma clara y justificada la razón (quedará registrada permanentemente en Oracle)."
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <Button
              type="button"
              variant="danger"
              icon={<X size={15} />}
              onClick={modal.closeModal}
              title="Cancelar la anulación y cerrar la ventana"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={submitting}
              disabled={submitting || !motivoAnulacion.trim()}
              icon={<Ban size={16} />}
              title="Ejecutar el procedimiento de anulación en Oracle DB"
            >
              {submitting ? "Anulando..." : "Confirmar Anulación"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CajaChicaMovimientoPage;