import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Ban,
  Banknote,
  Calendar,
  CircleCheck,
  Clock,
  FileOutput,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  UserCheck,
  Wallet,
  X,
} from "lucide-react";
import { useContrasenaPago } from "./useContrasenaPago";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { SearchableSelect, type SelectOption } from "../../components/common/SearchableSelect";
import { Table, type Column } from "../../components/common/Table";
import {
  FilterDropdown,
  GuideBanner,
  Pagination,
  StatCard,
  StatGrid,
  StatusBadge,
  TableSearchBar,
} from "../../components/common";
import { IconBtn } from "../../components/common/IconBtn";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { SH } from "../../components/common/SH";
import { Modal } from "../../components/common/Modal";
import { formatDate, fmt } from "../../utils/format";
import type { ContrasenaPago, EstadoContrasenaPago, FormaPago } from "./contrasenaPago.types";

type FiltroEstado = "TODOS" | EstadoContrasenaPago;
type FiltroFormaPago = "TODAS" | FormaPago;

const estadoColor: Record<EstadoContrasenaPago, "warning" | "accent" | "success" | "neutral"> = {
  PENDIENTE: "warning",
  EMITIDA: "accent",
  PAGADA: "success",
  ANULADA: "neutral",
};

/** Opciones de forma de pago para el SearchableSelect (crear y editar). */
const FORMAS_PAGO_OPTIONS: SelectOption[] = [
  { id: "CHEQUE", nombre: "CHEQUE", detalle: "Se emitirá un cheque contra esta contraseña", icon: FileText },
  { id: "TRANSFERENCIA", nombre: "TRANSFERENCIA", detalle: "Pago por transferencia bancaria", icon: ArrowLeftRight },
  { id: "EFECTIVO", nombre: "EFECTIVO", detalle: "Pago en efectivo al proveedor", icon: Banknote },
];

/**
 * ContrasenaPagoPage: SOLO UI. Toda la logica vive en useContrasenaPago().
 */
export function ContrasenaPagoPage() {
  const {
    contrasenas,
    facturas,
    empleados,
    form,
    editForm,
    editingItem,
    loading,
    saving,
    montoError,
    montoDisponible,
    disponibleForm,
    disponibleEdicion,
    onChangeForm,
    onChangeEditForm,
    resetForm,
    abrirEdicion,
    cerrarEdicion,
    registrarContrasena,
    guardarEdicion,
    anularContrasena,
    registrarPago,
    cargarContrasenas,
  } = useContrasenaPago();

  const [showGuide, setShowGuide] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>("TODOS");
  const [formaPagoFiltro, setFormaPagoFiltro] = useState<FiltroFormaPago>("TODAS");

  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [limitePorPagina, setLimitePorPagina] = useState<number>(10);

  const [anulandoItem, setAnulandoItem] = useState<ContrasenaPago | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [anulando, setAnulando] = useState(false);
  const [pagando, setPagando] = useState<ContrasenaPago | null>(null);

  const abrirModalNueva = () => {
    resetForm();
    setModalOpen(true);
  };

  const onSubmitRegistrar = async (e?: React.FormEvent) => {
    const ok = await registrarContrasena(e);
    if (ok) setModalOpen(false);
  };

  const confirmarRegistrarPago = async () => {
    if (!pagando) return;
    const id = pagando.idContrasena;
    setPagando(null);
    await registrarPago(id);
  };

  const abrirAnulacion = (c: ContrasenaPago) => {
    setMotivoAnulacion("");
    setAnulandoItem(c);
  };

  /** Anula con el motivo escrito (obligatorio, se guarda en NOTAS). */
  const confirmarAnularContrasena = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!anulandoItem || !motivoAnulacion.trim()) return;
    setAnulando(true);
    const ok = await anularContrasena(anulandoItem.idContrasena, motivoAnulacion);
    setAnulando(false);
    if (ok) {
      setAnulandoItem(null);
      setMotivoAnulacion("");
    }
  };

  /** Busca la factura asociada para mostrar proveedor y DTE en la tabla. */
  const facturaPorId = useMemo(
    () => new Map(facturas.map((f) => [f.idFacturaProveedor, f])),
    [facturas]
  );

  /**
   * Opciones de Factura para el SearchableSelect. Solo se listan facturas PENDIENTES o
   * PAGADAS PARCIALMENTE con monto disponible (saldo menos contraseñas pendientes).
   */
  const facturasOptions = useMemo<SelectOption[]>(
    () =>
      facturas
        .filter((f) => f.estado === "PENDIENTE" || f.estado === "PAGADA_PARCIAL")
        .map((f) => ({ f, disponible: montoDisponible(f.idFacturaProveedor) ?? 0 }))
        .filter(({ disponible }) => disponible > 0)
        .map(({ f, disponible }) => {
          const dte = `${f.serieDte || ""} ${f.numeroDte || ""}`.trim();
          const comprometido = f.saldoPendiente - disponible;
          return {
            id: f.idFacturaProveedor,
            codigo: `#${f.idFacturaProveedor}`,
            nombre: `${f.nombreProveedor ?? `Proveedor #${f.idProveedor}`}${dte ? ` · DTE ${dte}` : ""}`,
            detalle:
              `Disponible: ${fmt(disponible)}` +
              (comprometido > 0 ? ` (saldo ${fmt(f.saldoPendiente)})` : "") +
              ` · Vence: ${formatDate(f.fechaVencimiento)}`,
            icon: FileText,
          };
        }),
    [facturas, montoDisponible]
  );

  /** Empleados activos para el selector "Autoriza". */
  const empleadosOptions = useMemo<SelectOption[]>(
    () =>
      empleados.map((e) => ({
        id: e.id,
        codigo: e.codigo,
        nombre: e.nombre,
        icon: UserCheck,
      })),
    [empleados]
  );

  const empleadoPorId = useMemo(
    () => new Map(empleados.map((e) => [e.id, e])),
    [empleados]
  );

  /** Tooltip del monto: incluye el disponible de la factura cuando se conoce. */
  const tooltipMonto = (disponible: number | null) =>
    disponible != null
      ? `Monto a pagar en Quetzales (total o abono parcial). Disponible de la factura: ${fmt(disponible)}.`
      : "Monto a pagar en Quetzales. Puede ser el saldo total o un abono parcial.";

  /** Contadores e importes calculados sobre el arreglo completo (no afectados por busqueda/filtro). */
  const resumen = useMemo(() => {
    const contar = (estado: EstadoContrasenaPago) =>
      contrasenas.filter((c) => c.estado === estado).length;
    const contarForma = (forma: FormaPago) =>
      contrasenas.filter((c) => c.formaPago === forma).length;
    const montoPorPagar = contrasenas
      .filter((c) => c.estado === "PENDIENTE" || c.estado === "EMITIDA")
      .reduce((acc, c) => acc + (c.monto || 0), 0);
    const montoPagado = contrasenas
      .filter((c) => c.estado === "PAGADA")
      .reduce((acc, c) => acc + (c.monto || 0), 0);

    return {
      pendientes: contar("PENDIENTE"),
      emitidas: contar("EMITIDA"),
      pagadas: contar("PAGADA"),
      anuladas: contar("ANULADA"),
      cheque: contarForma("CHEQUE"),
      transferencia: contarForma("TRANSFERENCIA"),
      efectivo: contarForma("EFECTIVO"),
      montoPorPagar,
      montoPagado,
    };
  }, [contrasenas]);

  /** Contraseñas visibles segun texto buscado + filtros de estado y forma de pago (AND). */
  const contrasenasVisibles = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return contrasenas.filter((c) => {
      if (estadoFiltro !== "TODOS" && c.estado !== estadoFiltro) return false;
      if (formaPagoFiltro !== "TODAS" && c.formaPago !== formaPagoFiltro) return false;
      if (!term) return true;
      const factura = facturaPorId.get(c.idFacturaProveedor);
      return (
        String(c.idContrasena).includes(term) ||
        String(c.idFacturaProveedor).includes(term) ||
        c.formaPago.toLowerCase().includes(term) ||
        c.estado.toLowerCase().includes(term) ||
        (factura?.numeroDte || "").toLowerCase().includes(term) ||
        (factura?.serieDte || "").toLowerCase().includes(term)
      );
    });
  }, [contrasenas, busqueda, estadoFiltro, formaPagoFiltro, facturaPorId]);

  /** Reinicia la pagina actual cuando cambia la busqueda o algun filtro. */
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, estadoFiltro, formaPagoFiltro]);

  const totalRegistros = contrasenasVisibles.length;
  const totalPaginas = Math.ceil(totalRegistros / limitePorPagina) || 1;

  const contrasenasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * limitePorPagina;
    return contrasenasVisibles.slice(inicio, inicio + limitePorPagina);
  }, [contrasenasVisibles, paginaActual, limitePorPagina]);

  const columns: Column<ContrasenaPago>[] = [
    {
      header: "ID",
      width: "7%",
      render: (c) => (
        <span style={{ fontWeight: 600, color: "var(--cpx-accent)" }} className="cpx-mono">
          #{c.idContrasena}
        </span>
      ),
    },
    {
      header: "Factura",
      width: "20%",
      render: (c) => {
        const factura = facturaPorId.get(c.idFacturaProveedor);
        const dte = factura ? `${factura.serieDte || ""} ${factura.numeroDte || ""}`.trim() : "";
        const subtitulo = factura ? `${factura.nombreProveedor ?? `Prov. #${factura.idProveedor}`}${dte ? ` · ${dte}` : ""}` : "";
        return (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <FileText size={14} color="var(--cpx-text-secondary)" style={{ flexShrink: 0 }} />
            <span style={{ minWidth: 0 }}>
              <span className="cpx-mono" style={{ fontWeight: 600 }}>#{c.idFacturaProveedor}</span>
              {factura && (
                <span
                  title={subtitulo}
                  style={{
                    display: "block",
                    fontSize: 11,
                    color: "var(--cpx-text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {subtitulo}
                </span>
              )}
            </span>
          </span>
        );
      },
    },
    {
      header: "Fecha",
      mono: true,
      width: "12%",
      render: (c) => (
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--cpx-text-secondary)", fontSize: "12px", whiteSpace: "nowrap" }}>
          <Calendar size={13} color="var(--cpx-text-muted)" />
          <span style={{ fontFamily: "var(--cpx-font-mono)" }}>{formatDate(c.fecha)}</span>
        </span>
      ),
    },
    {
      header: "Forma de Pago",
      width: "14%",
      render: (c) => {
        const Icono = c.formaPago === "TRANSFERENCIA" ? ArrowLeftRight : c.formaPago === "EFECTIVO" ? Banknote : FileText;
        return (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Icono size={14} color="var(--cpx-text-secondary)" />
            {c.formaPago}
          </span>
        );
      },
    },
    {
      header: "Monto",
      numeric: true,
      width: "13%",
      render: (c) => <span style={{ fontWeight: 700 }}>{fmt(c.monto)}</span>,
    },
    {
      header: "Autoriza",
      width: "13%",
      render: (c) => {
        if (!c.idEmpleadoAutoriza) return "-";
        const empleado = empleadoPorId.get(c.idEmpleadoAutoriza);
        return (
          <span
            style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
            title={empleado ? `${empleado.codigo} · ${empleado.nombre}` : `Empleado #${c.idEmpleadoAutoriza} (no encontrado o inactivo)`}
          >
            <UserCheck size={14} color="var(--cpx-text-secondary)" style={{ flexShrink: 0 }} />
            {empleado ? empleado.nombre : <span className="cpx-mono">#{c.idEmpleadoAutoriza}</span>}
          </span>
        );
      },
    },
    {
      header: "Estado",
      width: "11%",
      render: (c) => (
        <span style={{ display: "block", minWidth: 0 }}>
          <StatusBadge
            status={c.estado}
            color={estadoColor[c.estado]}
            forceDot={c.estado === "ANULADA" ? "filled" : undefined}
          />
          {c.notas && (
            <span
              title={`Motivo de anulación: ${c.notas}`}
              style={{
                display: "block",
                marginTop: 3,
                fontSize: 11,
                color: "var(--cpx-text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c.notas}
            </span>
          )}
        </span>
      ),
    },
    {
      header: "Acciones",
      width: "12%",
      render: (c) => {
        // Solo una contraseña PENDIENTE se edita, anula o paga directamente.
        // EMITIDA: se gestiona desde su cheque (cobrar / anular el cheque).
        const pendiente = c.estado === "PENDIENTE";
        const motivoBloqueo =
          c.estado === "EMITIDA"
            ? " (tiene cheque emitido: gestiónelo desde Cheques)"
            : pendiente
            ? ""
            : ` (está ${c.estado})`;
        return (
          <div style={{ display: "inline-flex", gap: 6 }}>
            {pendiente && c.formaPago !== "CHEQUE" && (
              <IconBtn
                icon={CircleCheck}
                label={`Registrar pago de la contraseña ${c.idContrasena}`}
                variant="ghost"
                onClick={() => setPagando(c)}
              />
            )}
            <IconBtn
              icon={Pencil}
              label={`Editar contraseña de pago ${c.idContrasena}${motivoBloqueo}`}
              variant="ghost"
              disabled={!pendiente}
              onClick={() => abrirEdicion(c)}
            />
            <IconBtn
              icon={Ban}
              label={`Anular contraseña de pago ${c.idContrasena}${motivoBloqueo}`}
              variant="danger"
              disabled={!pendiente}
              onClick={() => abrirAnulacion(c)}
            />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <GuideBanner
        title="Primeros Pasos: Flujo de Contraseñas de Pago"
        visible={showGuide}
        onToggle={setShowGuide}
        steps={[
          {
            number: "1",
            title: "Selecciona la Factura",
            description: "Elige la factura de proveedor con saldo pendiente que se va a programar para pago.",
          },
          {
            number: "2",
            title: "Define Forma de Pago y Monto",
            description: "Indica si se pagará con cheque, transferencia o efectivo, y el monto (total o abono parcial).",
          },
          {
            number: "3",
            title: "Emite el Pago",
            description: "CHEQUE: regístralo en la vista de Cheques (al emitirlo baja el saldo de la factura). TRANSFERENCIA o EFECTIVO: usa el botón ✓ \"Registrar pago\".",
          },
        ]}
      />

      <StatGrid>
        <StatCard
          label="Contraseñas Pendientes"
          value={resumen.pendientes}
          valueColor="warning"
          subtitle="Aún sin emitir el pago"
          icon={Clock}
          color="warning"
        />
        <StatCard
          label="Contraseñas Emitidas"
          value={resumen.emitidas}
          valueColor="accent"
          subtitle="Con pago emitido, por liquidar"
          icon={FileOutput}
          color="accent"
        />
        <StatCard
          label="Monto por Pagar"
          value={fmt(resumen.montoPorPagar)}
          subtitle="Pendientes + emitidas"
          icon={Wallet}
          color="danger"
        />
        <StatCard
          label="Monto Total Pagado"
          value={fmt(resumen.montoPagado)}
          valueColor="success"
          subtitle={`${resumen.pagadas} contraseñas pagadas`}
          icon={CircleCheck}
          color="success"
        />
      </StatGrid>

      <Card>
        <div style={{ padding: "20px 20px 10px 20px" }}>
          <SH
            title="Contraseñas de Pago Registradas"
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <IconBtn
                  icon={RefreshCw}
                  label="Refrescar"
                  variant="ghost"
                  onClick={cargarContrasenas}
                  disabled={loading}
                />
                <Button variant="primary" onClick={abrirModalNueva} icon={<Plus size={15} />}>
                  Nueva contraseña
                </Button>
              </div>
            }
          />
        </div>

        <TableSearchBar
          searchTerm={busqueda}
          onSearchChange={setBusqueda}
          placeholder="Buscar por ID, factura, DTE, forma de pago..."
          totalResults={contrasenas.length}
          filteredResults={contrasenasVisibles.length}
          filters={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <FilterDropdown<FiltroEstado>
                label="Estado"
                options={[
                  { key: "PENDIENTE", label: "Pendientes", count: resumen.pendientes },
                  { key: "EMITIDA", label: "Emitidas", count: resumen.emitidas },
                  { key: "PAGADA", label: "Pagadas", count: resumen.pagadas },
                  { key: "ANULADA", label: "Anuladas", count: resumen.anuladas },
                ]}
                value={estadoFiltro}
                onChange={setEstadoFiltro}
                allOptionKey="TODOS"
                allOptionLabel="Todos los estados"
                totalCount={contrasenas.length}
                searchPlaceholder="Filtrar por estado..."
              />
              <FilterDropdown<FiltroFormaPago>
                label="Forma de pago"
                options={[
                  { key: "CHEQUE", label: "Cheque", count: resumen.cheque },
                  { key: "TRANSFERENCIA", label: "Transferencia", count: resumen.transferencia },
                  { key: "EFECTIVO", label: "Efectivo", count: resumen.efectivo },
                ]}
                value={formaPagoFiltro}
                onChange={setFormaPagoFiltro}
                allOptionKey="TODAS"
                allOptionLabel="Todas las formas"
                totalCount={contrasenas.length}
                searchPlaceholder="Filtrar forma de pago..."
              />
            </div>
          }
        />

        <Table
          columns={columns}
          data={contrasenasPaginadas}
          rowKey={(c) => c.idContrasena}
          emptyMessage={
            loading
              ? "Cargando contraseñas de pago..."
              : busqueda || estadoFiltro !== "TODOS" || formaPagoFiltro !== "TODAS"
              ? "No hay contraseñas que coincidan con la búsqueda o los filtros seleccionados"
              : "No hay contraseñas de pago registradas"
          }
        />

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
          etiquetaRegistros="contraseñas"
        />
      </Card>

      {/* Modal de Registro (CREATE) */}
      <Modal
        open={modalOpen}
        title="Registrar nueva contraseña de pago"
        onClose={() => setModalOpen(false)}
        maxWidth={600}
      >
        <form onSubmit={onSubmitRegistrar}>
          {/* Fila 1: factura a todo el ancho (sus opciones son largas) */}
          <div className="cpx-form-grid cpx-form-grid--completo">
            <div>
              <SearchableSelect
                label="Factura de Proveedor"
                value={form.idFacturaProveedor || ""}
                options={facturasOptions}
                onChange={(val) => onChangeForm("idFacturaProveedor", val)}
                placeholder="-- Seleccionar Factura --"
                searchPlaceholder="Buscar por ID, proveedor, DTE o saldo..."
                tooltip="Solo se listan facturas con saldo pendiente (no anuladas ni pagadas). Al elegirla, el monto se llena con su saldo."
                required
              />
            </div>
          </div>

          {/* Fila 2: fecha y forma de pago */}
          <div className="cpx-form-grid">
            <FormField
              label="Fecha"
              type="date"
              maxLength={10}
              value={form.fecha}
              onChange={(e) => onChangeForm("fecha", e.target.value)}
              tooltip="Fecha en que se genera la contraseña de pago."
              required
            />

            <div>
              <SearchableSelect
                label="Forma de Pago"
                value={form.formaPago}
                options={FORMAS_PAGO_OPTIONS}
                onChange={(val) => onChangeForm("formaPago", val as FormaPago)}
                searchPlaceholder="Buscar forma de pago..."
                tooltip="Medio con el que se liquidará la factura al proveedor."
                required
              />
            </div>
          </div>

          {/* Fila 3: monto (angosto) y empleado que autoriza (ancho) */}
          <div className="cpx-form-grid cpx-form-grid--angosto-ancho">
            <FormField
              label="Monto (GTQ)"
              type="number"
              step="0.01"
              min={0}
              maxLength={14}
              mono
              placeholder="0.00"
              value={form.monto || ""}
              onChange={(e) => onChangeForm("monto", e.target.value)}
              tooltip={tooltipMonto(disponibleForm)}
              error={montoError ?? undefined}
              required
            />

            <div>
              <SearchableSelect
                label="Empleado que Autoriza"
                value={form.idEmpleadoAutoriza ?? ""}
                options={empleadosOptions}
                onChange={(val) => onChangeForm("idEmpleadoAutoriza", val)}
                placeholder="-- Opcional --"
                searchPlaceholder="Buscar por código o nombre..."
                tooltip="Opcional. Empleado activo que autoriza el pago."
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button
              type="button"
              variant="danger"
              icon={<X size={15} />}
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={saving}
              disabled={saving}
              icon={<Save size={16} />}
            >
              {saving ? "Guardando..." : "Registrar contraseña"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Edición (UPDATE) */}
      <Modal
        open={Boolean(editingItem)}
        title={`Editar Contraseña de Pago #${editingItem?.idContrasena}`}
        onClose={cerrarEdicion}
        maxWidth={600}
      >
        <form onSubmit={guardarEdicion}>
          <div className="cpx-form-grid cpx-form-grid--completo">
            <div>
              <SearchableSelect
                label="Forma de Pago"
                value={editForm.formaPago}
                options={FORMAS_PAGO_OPTIONS}
                onChange={(val) => onChangeEditForm("formaPago", val as FormaPago)}
                searchPlaceholder="Buscar forma de pago..."
                tooltip="Medio con el que se liquidará la factura al proveedor."
                required
              />
            </div>
          </div>

          <div className="cpx-form-grid cpx-form-grid--angosto-ancho">
            <FormField
              label="Monto (GTQ)"
              type="number"
              step="0.01"
              min={0}
              maxLength={14}
              mono
              placeholder="0.00"
              value={editForm.monto || ""}
              onChange={(e) => onChangeEditForm("monto", e.target.value)}
              tooltip={tooltipMonto(disponibleEdicion)}
              error={montoError ?? undefined}
              required
            />

            <div>
              <SearchableSelect
                label="Empleado que Autoriza"
                value={editForm.idEmpleadoAutoriza ?? ""}
                options={empleadosOptions}
                onChange={(val) => onChangeEditForm("idEmpleadoAutoriza", val)}
                placeholder="-- Opcional --"
                searchPlaceholder="Buscar por código o nombre..."
                tooltip="Opcional. Empleado activo que autoriza el pago."
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
            <Button type="button" variant="danger" icon={<X size={15} />} onClick={cerrarEdicion}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="success"
              loading={saving}
              disabled={saving}
              icon={<Save size={16} />}
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirmación de pago directo (TRANSFERENCIA / EFECTIVO) */}
      <ConfirmDialog
        open={pagando !== null}
        title="Registrar pago"
        message={
          pagando
            ? `¿Confirmas que la contraseña #${pagando.idContrasena} se pagó por ${pagando.formaPago} (${fmt(pagando.monto)})? Quedará PAGADA y se descontará del saldo de la factura #${pagando.idFacturaProveedor}.`
            : ""
        }
        confirmLabel="Registrar pago"
        onConfirm={confirmarRegistrarPago}
        onClose={() => setPagando(null)}
      />

      {/* Anulación con motivo obligatorio (igual que Caja Chica Movimiento) */}
      <Modal
        open={anulandoItem !== null}
        title={`Anular Contraseña de Pago #${anulandoItem?.idContrasena ?? ""}`}
        onClose={() => setAnulandoItem(null)}
      >
        <form
          onSubmit={confirmarAnularContrasena}
          style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 4 }}
        >
          <div>
            <div style={{ fontSize: 13, color: "var(--cpx-text-primary)", marginBottom: 8 }}>
              ¿Está seguro de que desea anular esta contraseña de pago? Esta acción cambiará su estado a{" "}
              <strong>ANULADA</strong> y no se puede deshacer.
            </div>
            {anulandoItem && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 8,
                  background: "#F8F9FA",
                  border: "1px solid var(--cpx-border)",
                  fontSize: 12,
                  color: "var(--cpx-text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                <div><strong>ID Contraseña:</strong> #{anulandoItem.idContrasena}</div>
                <div>
                  <strong>Factura:</strong> #{anulandoItem.idFacturaProveedor}
                  {(() => {
                    const f = facturaPorId.get(anulandoItem.idFacturaProveedor);
                    const dte = f ? `${f.serieDte || ""} ${f.numeroDte || ""}`.trim() : "";
                    return f ? ` · ${f.nombreProveedor ?? `Proveedor #${f.idProveedor}`}${dte ? ` · ${dte}` : ""}` : "";
                  })()}
                </div>
                <div><strong>Forma de pago:</strong> {anulandoItem.formaPago}</div>
                <div><strong>Monto:</strong> {fmt(anulandoItem.monto)}</div>
              </div>
            )}
          </div>

          <FormField
            label="Motivo de la Anulación"
            required
            maxLength={300}
            style={{ width: "100%" }}
            placeholder="Ej: El proveedor solicitó pagar junto con el saldo restante / Monto digitado incorrecto"
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            tooltip="Indica de forma clara y justificada la razón. Quedará registrada en las notas de la contraseña."
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <Button
              type="button"
              variant="danger"
              icon={<X size={15} />}
              onClick={() => setAnulandoItem(null)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={anulando}
              disabled={anulando || !motivoAnulacion.trim()}
              icon={<Ban size={16} />}
            >
              {anulando ? "Anulando..." : "Confirmar Anulación"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
