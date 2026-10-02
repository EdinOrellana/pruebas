import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Building2,
  Calendar,
  CircleCheck,
  Clock,
  CornerDownRight,
  Eye,
  FileMinus,
  FilePlus,
  FileText,
  Info,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Ruler,
  Save,
  Trash2,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useFacturaProveedor } from "./useFacturaProveedor";
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
import { SH } from "../../components/common/SH";
import { Modal } from "../../components/common/Modal";
import { formatDate, fmt, todayISO } from "../../utils/format";
import {
  esNota,
  type FacturaProveedor,
  type EstadoFacturaProveedor,
  type TipoDocumento,
} from "./facturaProveedor.types";

type FiltroEstado = "TODOS" | "VENCIDAS" | EstadoFacturaProveedor;
type FiltroTipo = "TODOS" | TipoDocumento;

/** Una factura cuenta como vencida si aun tiene saldo por pagar y su fecha ya paso. */
function esVencida(f: FacturaProveedor, hoy: Date): boolean {
  if (!f.fechaVencimiento) return false;
  if (f.estado !== "PENDIENTE" && f.estado !== "PAGADA_PARCIAL") return false;
  return new Date(f.fechaVencimiento) < hoy;
}

/** Mapea el estado del documento al color del StatusBadge. */
const estadoColor: Record<EstadoFacturaProveedor, "warning" | "accent" | "success" | "purple" | "neutral"> = {
  PENDIENTE: "warning",
  PAGADA_PARCIAL: "accent",
  PAGADA: "success",
  APLICADA: "purple",
  ANULADA: "neutral",
};

/** Texto legible del tipo de documento. */
const tipoDocumentoLabel: Record<TipoDocumento, string> = {
  FACTURA: "FACTURA",
  FACTURA_ESPECIAL: "FACTURA ESPECIAL",
  NOTA_CREDITO: "NOTA CRÉDITO",
  NOTA_DEBITO: "NOTA DÉBITO",
};

/** Opciones de tipo de documento para el SearchableSelect. */
const TIPOS_DOCUMENTO_OPTIONS: SelectOption[] = [
  { id: "FACTURA", nombre: "FACTURA", detalle: "Documento tributario electrónico (DTE) estándar", icon: FileText },
  { id: "FACTURA_ESPECIAL", nombre: "FACTURA ESPECIAL", detalle: "Emitida por el comprador a proveedores sin factura", icon: Receipt },
  { id: "NOTA_CREDITO", nombre: "NOTA CRÉDITO", detalle: "Se aplica a una factura y disminuye su saldo", icon: FileMinus },
  { id: "NOTA_DEBITO", nombre: "NOTA DÉBITO", detalle: "Se aplica a una factura y aumenta su saldo", icon: FilePlus },
];

/** Badge de estado con el texto legible (PAGADA_PARCIAL -> PAGADA PARCIAL). */
function EstadoBadge({ estado }: { estado: EstadoFacturaProveedor }) {
  return (
    <StatusBadge
      status={estado}
      label={estado.replace("_", " ")}
      color={estadoColor[estado]}
      forceDot={estado === "ANULADA" ? "filled" : undefined}
    />
  );
}

/** Texto "Serie Numero" del DTE. */
const dteTexto = (f: FacturaProveedor) => `${f.serieDte || ""} ${f.numeroDte || ""}`.trim();

/**
 * Motivo por el que no se puede editar el documento (null = se puede).
 * Mismas reglas que PKG_CP_FACTURA_PROVEEDOR.SP_ACTUALIZAR_FACTURA.
 */
function motivoNoEditable(f: FacturaProveedor): string | null {
  if (f.estado === "ANULADA") return "está ANULADA";
  if (esNota(f.tipoDocumento)) return null;
  if (f.contrasenasActivas > 0) return "tiene contraseñas de pago";
  if (f.estado !== "PENDIENTE") return `está ${f.estado.replace("_", " ")}`;
  return null;
}

/** Motivo por el que no se puede anular (null = se puede). Igual que SP_ANULAR_FACTURA. */
function motivoNoAnulable(f: FacturaProveedor): string | null {
  if (f.estado === "ANULADA") return "ya está ANULADA";
  if (esNota(f.tipoDocumento)) return null;
  if (f.contrasenasActivas > 0) return "tiene contraseñas de pago activas";
  if (f.notasActivas > 0) return "tiene notas de crédito/débito aplicadas";
  return null;
}

/** Fila "concepto ...... monto" del resumen de saldo. */
function FilaResumen({ label, value, signo, fuerte }: { label: string; value: number; signo?: "-" | "+"; fuerte?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        fontWeight: fuerte ? 700 : undefined,
        borderTop: fuerte ? "1px solid var(--cpx-border)" : undefined,
        paddingTop: fuerte ? 4 : undefined,
      }}
    >
      <span>{signo ? `${signo} ` : ""}{label}</span>
      <span className="cpx-mono">{fmt(value)}</span>
    </div>
  );
}

/**
 * FacturaProveedorPage: SOLO UI. Toda la logica vive en useFacturaProveedor().
 */
export function FacturaProveedorPage() {
  const {
    facturas,
    proveedores,
    unidades,
    form,
    formErrors,
    montoTotalForm,
    editForm,
    editErrors,
    editingItem,
    viewingItem,
    loadingDetails,
    lineaForm,
    setLineaForm,
    lineaError,
    loading,
    saving,
    onChangeForm,
    onChangeEditForm,
    resetForm,
    agregarLineaDetalle,
    eliminarLineaDetalle,
    verDetalleFactura,
    cerrarDetalleFactura,
    abrirEdicion,
    cerrarEdicion,
    registrarFactura,
    guardarEdicion,
    anularFactura,
    cargarFacturas,
  } = useFacturaProveedor();

  const [showGuide, setShowGuide] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>("TODOS");
  const [tipoFiltro, setTipoFiltro] = useState<FiltroTipo>("TODOS");

  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [limitePorPagina, setLimitePorPagina] = useState<number>(10);

  const [anulandoItem, setAnulandoItem] = useState<FacturaProveedor | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [anulando, setAnulando] = useState(false);

  const abrirModalNueva = () => {
    resetForm();
    setModalOpen(true);
  };

  const onSubmitRegistrar = async (e?: React.FormEvent) => {
    const ok = await registrarFactura(e);
    if (ok) setModalOpen(false);
  };

  const abrirAnulacion = (f: FacturaProveedor) => {
    setMotivoAnulacion("");
    setAnulandoItem(f);
  };

  /** Anula con el motivo escrito (obligatorio, se guarda en NOTAS). */
  const confirmarAnularFactura = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!anulandoItem || !motivoAnulacion.trim()) return;
    setAnulando(true);
    const ok = await anularFactura(anulandoItem.idFacturaProveedor, motivoAnulacion);
    setAnulando(false);
    if (ok) {
      setAnulandoItem(null);
      setMotivoAnulacion("");
    }
  };

  /** Opciones de proveedor (tabla PROVEEDOR) para el SearchableSelect. */
  const proveedoresOptions = useMemo<SelectOption[]>(
    () =>
      proveedores.map((p) => ({
        id: p.idProveedor,
        codigo: p.nit,
        nombre: p.razonSocial,
        detalle: [p.nombreComercial, p.diasCredito > 0 ? `${p.diasCredito} días de crédito` : null]
          .filter(Boolean)
          .join(" · "),
        icon: Building2,
      })),
    [proveedores]
  );

  /** Opciones de unidad de medida para las lineas. */
  const unidadesOptions = useMemo<SelectOption[]>(
    () => unidades.map((u) => ({ id: u.idUnidadMedida, nombre: u.descripcion, icon: Ruler })),
    [unidades]
  );

  const unidadPorId = useMemo(() => new Map(unidades.map((u) => [u.idUnidadMedida, u.descripcion])), [unidades]);

  /**
   * Facturas a las que se puede aplicar una nota: FACTURA / FACTURA ESPECIAL del mismo
   * proveedor y no anuladas (misma regla que VALIDAR_CABECERA).
   */
  const opcionesReferencia = (idProveedor: number, excluir?: number): SelectOption[] =>
    facturas
      .filter(
        (f) =>
          !esNota(f.tipoDocumento) &&
          f.estado !== "ANULADA" &&
          f.idProveedor === idProveedor &&
          f.idFacturaProveedor !== excluir
      )
      .map((f) => ({
        id: f.idFacturaProveedor,
        codigo: `#${f.idFacturaProveedor}`,
        nombre: `DTE ${dteTexto(f) || "-"}`,
        detalle: `Total ${fmt(f.montoTotal)} · Saldo ${fmt(f.saldoPendiente)} (${f.estado.replace("_", " ")})`,
        icon: FileText,
      }));

  /** Contadores e importes calculados sobre el arreglo completo (no afectados por busqueda/filtro). */
  const resumen = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const facturasPagables = facturas.filter((f) => !esNota(f.tipoDocumento) && f.estado !== "ANULADA");
    const contar = (estado: EstadoFacturaProveedor) => facturas.filter((f) => f.estado === estado).length;
    const contarTipo = (tipo: TipoDocumento) => facturas.filter((f) => f.tipoDocumento === tipo).length;

    return {
      pendientes: contar("PENDIENTE"),
      parciales: contar("PAGADA_PARCIAL"),
      pagadas: contar("PAGADA"),
      aplicadas: contar("APLICADA"),
      anuladas: contar("ANULADA"),
      vencidas: facturas.filter((f) => esVencida(f, hoy)).length,
      factura: contarTipo("FACTURA"),
      facturaEspecial: contarTipo("FACTURA_ESPECIAL"),
      notaCredito: contarTipo("NOTA_CREDITO"),
      notaDebito: contarTipo("NOTA_DEBITO"),
      montoPendiente: facturasPagables.reduce((acc, f) => acc + (f.saldoPendiente || 0), 0),
      montoTotal: facturasPagables.reduce((acc, f) => acc + (f.montoTotal || 0), 0),
      montoPagado: facturasPagables.reduce((acc, f) => acc + (f.montoPagado || 0), 0),
      facturasPagables: facturasPagables.length,
    };
  }, [facturas]);

  /** Documentos visibles segun texto buscado + filtros de estado y tipo de documento (AND). */
  const facturasVisibles = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const term = busqueda.trim().toLowerCase();

    return facturas.filter((f) => {
      if (estadoFiltro === "VENCIDAS") {
        if (!esVencida(f, hoy)) return false;
      } else if (estadoFiltro !== "TODOS" && f.estado !== estadoFiltro) {
        return false;
      }
      if (tipoFiltro !== "TODOS" && f.tipoDocumento !== tipoFiltro) return false;
      if (!term) return true;
      return (
        String(f.idFacturaProveedor).includes(term) ||
        String(f.idProveedor).includes(term) ||
        (f.nombreProveedor || "").toLowerCase().includes(term) ||
        (f.nitProveedor || "").toLowerCase().includes(term) ||
        (f.numeroDte || "").toLowerCase().includes(term) ||
        (f.serieDte || "").toLowerCase().includes(term) ||
        f.estado.toLowerCase().includes(term)
      );
    });
  }, [facturas, busqueda, estadoFiltro, tipoFiltro]);

  /** Reinicia la pagina actual cuando cambia la busqueda o algun filtro. */
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, estadoFiltro, tipoFiltro]);

  const totalRegistros = facturasVisibles.length;
  const totalPaginas = Math.ceil(totalRegistros / limitePorPagina) || 1;

  const facturasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * limitePorPagina;
    return facturasVisibles.slice(inicio, inicio + limitePorPagina);
  }, [facturasVisibles, paginaActual, limitePorPagina]);

  const hoyLocal = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const columns: Column<FacturaProveedor>[] = [
    {
      header: "ID",
      width: "6%",
      render: (f) => (
        <span style={{ fontWeight: 600, color: "var(--cpx-accent)" }} className="cpx-mono">
          #{f.idFacturaProveedor}
        </span>
      ),
    },
    {
      header: "Proveedor",
      width: "17%",
      render: (f) => (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Building2 size={14} color="var(--cpx-text-secondary)" style={{ flexShrink: 0 }} />
          <span style={{ minWidth: 0 }}>
            <span
              style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
              title={f.nombreProveedor ?? `Proveedor #${f.idProveedor} (no registrado en el catálogo)`}
            >
              {f.nombreProveedor ?? <span className="cpx-mono">#{f.idProveedor}</span>}
            </span>
            {f.nitProveedor && (
              <span className="cpx-mono" style={{ display: "block", fontSize: 11, color: "var(--cpx-text-muted)" }}>
                NIT {f.nitProveedor}
              </span>
            )}
          </span>
        </span>
      ),
    },
    {
      header: "Tipo Doc.",
      width: "11%",
      render: (f) => (
        <span style={{ fontSize: 12 }}>
          {tipoDocumentoLabel[f.tipoDocumento] ?? f.tipoDocumento}
          {f.idFacturaReferencia && (
            <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--cpx-text-muted)" }}>
              <CornerDownRight size={11} /> Factura #{f.idFacturaReferencia}
            </span>
          )}
        </span>
      ),
    },
    {
      header: "Serie / N° DTE",
      mono: true,
      width: "13%",
      render: (f) =>
        dteTexto(f) ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
            <FileText size={14} color="var(--cpx-text-secondary)" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600 }}>{dteTexto(f)}</span>
          </span>
        ) : (
          "-"
        ),
    },
    {
      header: "Emisión",
      mono: true,
      width: "9%",
      render: (f) => (
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--cpx-text-secondary)", fontSize: "12px", whiteSpace: "nowrap" }}>
          <Calendar size={13} color="var(--cpx-text-muted)" />
          <span style={{ fontFamily: "var(--cpx-font-mono)" }}>{formatDate(f.fechaEmision)}</span>
        </span>
      ),
    },
    {
      header: "Vencimiento",
      mono: true,
      width: "9%",
      render: (f) => {
        const vencida = esVencida(f, hoyLocal);
        return (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: "12px",
              whiteSpace: "nowrap",
              color: vencida ? "var(--cpx-danger)" : "var(--cpx-text-secondary)",
              fontWeight: vencida ? 600 : undefined,
            }}
            title={vencida ? "Factura vencida con saldo pendiente" : undefined}
          >
            {vencida ? (
              <AlertTriangle size={13} color="var(--cpx-danger)" />
            ) : (
              <Calendar size={13} color="var(--cpx-text-muted)" />
            )}
            <span style={{ fontFamily: "var(--cpx-font-mono)" }}>{formatDate(f.fechaVencimiento)}</span>
          </span>
        );
      },
    },
    {
      header: "Monto Total",
      numeric: true,
      width: "10%",
      render: (f) => fmt(f.montoTotal),
    },
    {
      header: "Saldo Pend.",
      numeric: true,
      width: "10%",
      render: (f) =>
        esNota(f.tipoDocumento) ? (
          <span style={{ color: "var(--cpx-text-muted)" }}>-</span>
        ) : (
          <span style={{ fontWeight: 700 }}>{fmt(f.saldoPendiente)}</span>
        ),
    },
    {
      header: "Estado",
      width: "9%",
      render: (f) => (
        <span style={{ display: "block", minWidth: 0 }}>
          <EstadoBadge estado={f.estado} />
          {f.notas && (
            <span
              title={`Motivo de anulación: ${f.notas}`}
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
              {f.notas}
            </span>
          )}
        </span>
      ),
    },
    {
      header: "Acciones",
      width: "9%",
      render: (f) => {
        const noEditable = motivoNoEditable(f);
        const noAnulable = motivoNoAnulable(f);
        return (
          <div style={{ display: "inline-flex", gap: 6 }}>
            <IconBtn
              icon={Eye}
              label={`Ver detalles del documento #${f.idFacturaProveedor}`}
              variant="ghost"
              onClick={() => verDetalleFactura(f)}
            />
            <IconBtn
              icon={Pencil}
              label={`Editar documento #${f.idFacturaProveedor}${noEditable ? ` (${noEditable})` : ""}`}
              variant="ghost"
              disabled={Boolean(noEditable)}
              onClick={() => abrirEdicion(f)}
            />
            <IconBtn
              icon={Ban}
              label={`Anular documento #${f.idFacturaProveedor}${noAnulable ? ` (${noAnulable})` : ""}`}
              variant="danger"
              disabled={Boolean(noAnulable)}
              onClick={() => abrirAnulacion(f)}
            />
          </div>
        );
      },
    },
  ];

  const formEsNota = esNota(form.tipoDocumento);
  const editEsNota = editingItem ? esNota(editingItem.tipoDocumento) : false;

  return (
    <>
      <GuideBanner
        title="Primeros Pasos: Registro de Facturas de Proveedor"
        visible={showGuide}
        onToggle={setShowGuide}
        steps={[
          {
            number: "1",
            title: "Identifica el Documento",
            description: "Elige el proveedor, el tipo de documento y la serie / número del DTE. Las notas de crédito y débito se aplican a una factura.",
          },
          {
            number: "2",
            title: "Agrega las Partidas",
            description: "Registra al menos una línea con su unidad de medida; el monto total es la suma de las líneas.",
          },
          {
            number: "3",
            title: "Retenciones y Pago",
            description: "Registra las retenciones en la vista Retenciones (se restan del saldo) y luego genera la contraseña de pago.",
          },
        ]}
      />

      {/* 5 tarjetas: minimo mas angosto que el default (220px) para que quepan en una fila. */}
      <StatGrid style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
        <StatCard
          label="Facturas Pendientes"
          value={resumen.pendientes}
          valueColor="warning"
          subtitle={`${resumen.parciales} con pago parcial`}
          icon={Clock}
          color="warning"
        />
        <StatCard
          label="Facturas Vencidas"
          value={resumen.vencidas}
          valueColor="danger"
          subtitle="Con saldo y fecha de vencimiento pasada"
          icon={AlertTriangle}
          color="danger"
        />
        <StatCard
          label="Monto Pendiente"
          value={fmt(resumen.montoPendiente)}
          subtitle="Saldo por pagar a proveedores"
          icon={Wallet}
          color="accent"
        />
        <StatCard
          label="Monto Pagado"
          value={fmt(resumen.montoPagado)}
          valueColor="success"
          subtitle="Pagos emitidos (contraseñas)"
          icon={CircleCheck}
          color="success"
        />
        <StatCard
          label="Monto Total Facturado"
          value={fmt(resumen.montoTotal)}
          subtitle={`${resumen.facturasPagables} facturas no anuladas`}
          icon={TrendingUp}
          color="teal"
        />
      </StatGrid>

      <Card>
        <div style={{ padding: "20px 20px 10px 20px" }}>
          <SH
            title="Facturas de Proveedores (DTE)"
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <IconBtn
                  icon={RefreshCw}
                  label="Refrescar"
                  variant="ghost"
                  onClick={cargarFacturas}
                  disabled={loading}
                />
                <Button variant="primary" onClick={abrirModalNueva} icon={<Plus size={15} />}>
                  Nueva factura
                </Button>
              </div>
            }
          />
        </div>

        <TableSearchBar
          searchTerm={busqueda}
          onSearchChange={setBusqueda}
          placeholder="Buscar por proveedor, NIT, N° DTE, serie, ID..."
          totalResults={facturas.length}
          filteredResults={facturasVisibles.length}
          filters={
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <FilterDropdown<FiltroEstado>
                label="Estado"
                options={[
                  { key: "PENDIENTE", label: "Pendientes", count: resumen.pendientes },
                  { key: "PAGADA_PARCIAL", label: "Pagadas parcialmente", count: resumen.parciales },
                  { key: "PAGADA", label: "Pagadas", count: resumen.pagadas },
                  { key: "APLICADA", label: "Notas aplicadas", count: resumen.aplicadas },
                  { key: "ANULADA", label: "Anuladas", count: resumen.anuladas },
                  { key: "VENCIDAS", label: "Vencidas (con saldo)", count: resumen.vencidas },
                ]}
                value={estadoFiltro}
                onChange={setEstadoFiltro}
                allOptionKey="TODOS"
                allOptionLabel="Todos los estados"
                totalCount={facturas.length}
                searchPlaceholder="Filtrar por estado..."
              />
              <FilterDropdown<FiltroTipo>
                label="Tipo documento"
                options={[
                  { key: "FACTURA", label: "Factura", count: resumen.factura },
                  { key: "FACTURA_ESPECIAL", label: "Factura especial", count: resumen.facturaEspecial },
                  { key: "NOTA_CREDITO", label: "Nota de crédito", count: resumen.notaCredito },
                  { key: "NOTA_DEBITO", label: "Nota de débito", count: resumen.notaDebito },
                ]}
                value={tipoFiltro}
                onChange={setTipoFiltro}
                allOptionKey="TODOS"
                allOptionLabel="Todos los tipos"
                totalCount={facturas.length}
                searchPlaceholder="Filtrar por tipo..."
              />
            </div>
          }
        />

        <Table
          columns={columns}
          data={facturasPaginadas}
          rowKey={(f) => f.idFacturaProveedor}
          emptyMessage={
            loading
              ? "Cargando facturas..."
              : busqueda || estadoFiltro !== "TODOS" || tipoFiltro !== "TODOS"
              ? "No hay documentos que coincidan con la búsqueda o los filtros seleccionados"
              : "No hay facturas de proveedor registradas"
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
          etiquetaRegistros="documentos"
        />
      </Card>

      {/* Modal de Detalle (READ FULL) */}
      <Modal
        open={Boolean(viewingItem)}
        title={`Detalle del documento #${viewingItem?.idFacturaProveedor}`}
        onClose={cerrarDetalleFactura}
      >
        {viewingItem && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 16 }}>
              <div>
                <strong>Proveedor:</strong> {viewingItem.nombreProveedor ?? `#${viewingItem.idProveedor}`}
                {viewingItem.nitProveedor && <span className="cpx-mono"> (NIT {viewingItem.nitProveedor})</span>}
              </div>
              <div><strong>Tipo Documento:</strong> {tipoDocumentoLabel[viewingItem.tipoDocumento] ?? viewingItem.tipoDocumento}</div>
              <div><strong>Serie / Número DTE:</strong> {dteTexto(viewingItem) || "-"}</div>
              <div><strong>Fecha Emisión:</strong> {formatDate(viewingItem.fechaEmision)}</div>
              <div><strong>Fecha Documento:</strong> {formatDate(viewingItem.fechaDocumento)}</div>
              <div><strong>Fecha Vencimiento:</strong> {formatDate(viewingItem.fechaVencimiento)}</div>
              <div><strong>Estado:</strong> <EstadoBadge estado={viewingItem.estado} /></div>
              {viewingItem.idFacturaReferencia && (
                <div><strong>Aplicada a:</strong> Factura #{viewingItem.idFacturaReferencia}</div>
              )}
              {viewingItem.notas && (
                <div style={{ gridColumn: "1 / -1" }}><strong>Motivo de anulación:</strong> {viewingItem.notas}</div>
              )}
            </div>

            {!esNota(viewingItem.tipoDocumento) && (
              <div
                style={{
                  maxWidth: 360,
                  marginBottom: 16,
                  padding: 12,
                  borderRadius: 10,
                  background: "rgba(0,0,0,0.02)",
                  display: "grid",
                  gap: 4,
                  fontSize: 13,
                }}
              >
                <strong style={{ marginBottom: 4 }}>Resumen de saldo</strong>
                <FilaResumen label="Total (suma de líneas)" value={viewingItem.montoTotal} />
                <FilaResumen label="Retención IVA" value={viewingItem.montoRetencionIva} signo="-" />
                <FilaResumen label="Retención ISR" value={viewingItem.montoRetencionIsr} signo="-" />
                {viewingItem.montoNotasCredito > 0 && (
                  <FilaResumen label="Notas de crédito" value={viewingItem.montoNotasCredito} signo="-" />
                )}
                {viewingItem.montoNotasDebito > 0 && (
                  <FilaResumen label="Notas de débito" value={viewingItem.montoNotasDebito} signo="+" />
                )}
                <FilaResumen
                  label="Neto a pagar"
                  value={
                    viewingItem.montoTotal -
                    viewingItem.montoRetencionIva -
                    viewingItem.montoRetencionIsr -
                    viewingItem.montoNotasCredito +
                    viewingItem.montoNotasDebito
                  }
                  fuerte
                />
                <FilaResumen label="Pagos emitidos" value={viewingItem.montoPagado} signo="-" />
                <FilaResumen label="Saldo pendiente" value={viewingItem.saldoPendiente} fuerte />
              </div>
            )}

            <h4 style={{ marginBottom: 8 }}>Partidas / Líneas de Detalle</h4>
            {loadingDetails ? (
              <p>Cargando detalles...</p>
            ) : viewingItem.detalles && viewingItem.detalles.length > 0 ? (
              <table className="cpx-table" style={{ width: "100%" }}>
                <thead>
                  <tr>
                    <th className="cpx-table__th">Artículo</th>
                    <th className="cpx-table__th">Descripción</th>
                    <th className="cpx-table__th">Unidad</th>
                    <th className="cpx-table__th cpx-table__cell--num">Cantidad</th>
                    <th className="cpx-table__th cpx-table__cell--num">P. Unitario</th>
                    <th className="cpx-table__th cpx-table__cell--num">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewingItem.detalles.map((det, idx) => (
                    <tr key={det.idFacturaProvDetalle || idx} className="cpx-table__row">
                      <td className="cpx-table__td cpx-mono">{det.idArticulo || "-"}</td>
                      <td className="cpx-table__td">{det.descripcion}</td>
                      <td className="cpx-table__td">{det.unidadMedida ?? "-"}</td>
                      <td className="cpx-table__td cpx-table__cell--num">{det.cantidad}</td>
                      <td className="cpx-table__td cpx-table__cell--num">{fmt(det.precioUnitario)}</td>
                      <td className="cpx-table__td cpx-table__cell--num">{fmt(det.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: "var(--cpx-text-secondary)" }}>No hay líneas de detalle registradas para este documento.</p>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Registro (CREATE) */}
      <Modal
        open={modalOpen}
        title="Registrar nuevo documento de proveedor"
        onClose={() => setModalOpen(false)}
        maxWidth={900}
      >
        <form onSubmit={onSubmitRegistrar} noValidate>
          {proveedores.length === 0 && (
            <div className="cpx-alert--error" style={{ marginBottom: 12 }}>
              No hay proveedores activos en el catálogo (tabla PROVEEDOR). Registra proveedores antes de ingresar facturas.
            </div>
          )}
          {/* Fila 1: proveedor y tipo de documento (y la factura de referencia si es nota) */}
          <div className="cpx-form-grid cpx-form-grid--principal">
            <div>
              <SearchableSelect
                label="Proveedor"
                value={form.idProveedor || ""}
                options={proveedoresOptions}
                onChange={(val) => onChangeForm("idProveedor", val)}
                placeholder="-- Seleccionar Proveedor --"
                searchPlaceholder="Buscar por NIT o razón social..."
                tooltip="Proveedor activo del catálogo. Si tiene días de crédito, se sugiere la fecha de vencimiento."
                error={formErrors.idProveedor}
                required
              />
            </div>

            <div>
              <SearchableSelect
                label="Tipo Documento"
                value={form.tipoDocumento}
                options={TIPOS_DOCUMENTO_OPTIONS}
                onChange={(val) => onChangeForm("tipoDocumento", val as TipoDocumento)}
                searchPlaceholder="Buscar tipo de documento..."
                tooltip="Las notas de crédito y débito no se pagan: se aplican a una factura y modifican su saldo."
                required
              />
            </div>

            {formEsNota && (
              <div className="cpx-grid-full">
                <SearchableSelect
                  label="Aplicar a la factura"
                  value={form.idFacturaReferencia ?? ""}
                  options={opcionesReferencia(form.idProveedor)}
                  onChange={(val) => onChangeForm("idFacturaReferencia", val)}
                  placeholder={form.idProveedor ? "-- Seleccionar Factura --" : "Primero elige el proveedor"}
                  searchPlaceholder="Buscar por ID o DTE..."
                  tooltip="Factura (no anulada) del mismo proveedor cuyo saldo modifica esta nota."
                  error={formErrors.idFacturaReferencia}
                  disabled={!form.idProveedor}
                  required
                />
              </div>
            )}
          </div>

          {/* Fila 2: DTE y fechas, en una sola fila cuando el ancho lo permite */}
          <div className="cpx-form-grid">
            <FormField
              label="Serie DTE"
              maxLength={50}
              value={form.serieDte}
              onChange={(e) => onChangeForm("serieDte", e.target.value)}
              tooltip="Serie del DTE tal como aparece en el documento certificado."
              error={formErrors.serieDte}
              required
            />

            <FormField
              label="Número DTE"
              maxLength={50}
              mono
              value={form.numeroDte}
              onChange={(e) => onChangeForm("numeroDte", e.target.value)}
              tooltip="Número del DTE asignado por el certificador. No puede repetirse para el mismo proveedor."
              error={formErrors.numeroDte}
              required
            />

            <FormField
              label="Fecha Emisión"
              type="date"
              maxLength={10}
              max={todayISO()}
              value={form.fechaEmision}
              onChange={(e) => onChangeForm("fechaEmision", e.target.value)}
              tooltip="Fecha en que el proveedor emitió el documento (no puede ser futura)."
              error={formErrors.fechaEmision}
              required
            />

            <FormField
              label="Fecha Documento"
              type="date"
              maxLength={10}
              value={form.fechaDocumento}
              onChange={(e) => onChangeForm("fechaDocumento", e.target.value)}
              tooltip="Fecha en que se recibe / registra el documento (no anterior a la emisión)."
              error={formErrors.fechaDocumento}
              required
            />

            {!formEsNota && (
              <FormField
                label="Fecha Vencimiento"
                type="date"
                maxLength={10}
                value={form.fechaVencimiento}
                onChange={(e) => onChangeForm("fechaVencimiento", e.target.value)}
                tooltip="Fecha límite de pago (no anterior a la emisión). Se sugiere según los días de crédito del proveedor."
                error={formErrors.fechaVencimiento}
              />
            )}
          </div>

          <div style={{ borderTop: "1px solid var(--cpx-border)", paddingTop: 16, marginTop: 16 }}>
            <h4 style={{ margin: "0 0 8px" }}>Líneas de Detalle (Partidas)</h4>
            <div className="cpx-form-grid cpx-form-grid--linea">
              <FormField
                label="ID Artículo"
                type="number"
                maxLength={10}
                mono
                value={lineaForm.idArticulo}
                onChange={(e) => setLineaForm((prev) => ({ ...prev, idArticulo: e.target.value }))}
                tooltip="Opcional. Código del artículo en el catálogo."
              />
              <FormField
                label="Descripción"
                maxLength={100}
                value={lineaForm.descripcion}
                onChange={(e) => setLineaForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                tooltip="Descripción del bien o servicio facturado."
              />
              <div>
                <SearchableSelect
                  label="Unidad"
                  value={lineaForm.idUnidadMedida}
                  options={unidadesOptions}
                  onChange={(val) => setLineaForm((prev) => ({ ...prev, idUnidadMedida: String(val) }))}
                  placeholder="-- Unidad --"
                  searchPlaceholder="Buscar unidad..."
                  tooltip="Unidad de medida de la línea (catálogo Unidad Medida)."
                />
              </div>
              <FormField
                label="Cantidad"
                type="number"
                step="0.01"
                min={0}
                maxLength={10}
                mono
                value={lineaForm.cantidad}
                onChange={(e) => setLineaForm((prev) => ({ ...prev, cantidad: e.target.value }))}
              />
              <FormField
                label="Precio Unitario"
                type="number"
                step="0.01"
                min={0}
                maxLength={10}
                mono
                placeholder="0.00"
                value={lineaForm.precioUnitario}
                onChange={(e) => setLineaForm((prev) => ({ ...prev, precioUnitario: e.target.value }))}
              />
              <div>
                <Button type="button" variant="secondary" onClick={agregarLineaDetalle} icon={<Plus size={14} />}>
                  Agregar línea
                </Button>
              </div>
            </div>
            {lineaError && <span className="cpx-field__error">{lineaError}</span>}

            {form.detalles.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <table className="cpx-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th className="cpx-table__th">Artículo</th>
                      <th className="cpx-table__th">Descripción</th>
                      <th className="cpx-table__th">Unidad</th>
                      <th className="cpx-table__th cpx-table__cell--num">Cant.</th>
                      <th className="cpx-table__th cpx-table__cell--num">P. Unitario</th>
                      <th className="cpx-table__th cpx-table__cell--num">Subtotal</th>
                      <th className="cpx-table__th" style={{ width: 40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.detalles.map((det, index) => (
                      <tr key={index} className="cpx-table__row">
                        <td className="cpx-table__td cpx-mono">{det.idArticulo || "-"}</td>
                        <td className="cpx-table__td">{det.descripcion}</td>
                        <td className="cpx-table__td">{det.idUnidadMedida ? unidadPorId.get(det.idUnidadMedida) ?? "-" : "-"}</td>
                        <td className="cpx-table__td cpx-table__cell--num">{det.cantidad}</td>
                        <td className="cpx-table__td cpx-table__cell--num">{fmt(det.precioUnitario)}</td>
                        <td className="cpx-table__td cpx-table__cell--num">{fmt(det.subtotal)}</td>
                        <td className="cpx-table__td">
                          <IconBtn
                            icon={Trash2}
                            label="Eliminar línea"
                            variant="danger"
                            onClick={() => eliminarLineaDetalle(index)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              formErrors.detalles && <span className="cpx-field__error">{formErrors.detalles}</span>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, gap: 12, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--cpx-text-secondary)" }}>
                <Info size={14} />
                {formEsNota
                  ? "El monto de la nota modificará el saldo de la factura seleccionada."
                  : "Las retenciones IVA/ISR se registran en la vista Retenciones y se restan del saldo."}
              </span>
              <span style={{ fontSize: 15 }}>
                Monto total: <strong className="cpx-mono">{fmt(montoTotalForm)}</strong>
              </span>
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
              {saving ? "Guardando..." : formEsNota ? "Registrar nota" : "Registrar factura"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Edición (UPDATE: solo encabezado) */}
      <Modal
        open={Boolean(editingItem)}
        title={`Editar documento #${editingItem?.idFacturaProveedor}`}
        onClose={cerrarEdicion}
        maxWidth={900}
      >
        <form onSubmit={guardarEdicion} noValidate>
          <div className="cpx-form-grid" style={{ gridTemplateColumns: editEsNota ? "minmax(0, 1fr) minmax(0, 1fr)" : "minmax(0, 1fr)" }}>
            <div>
              <SearchableSelect
                label="Proveedor"
                value={editForm.idProveedor || ""}
                options={proveedoresOptions}
                onChange={(val) => onChangeEditForm("idProveedor", val)}
                searchPlaceholder="Buscar por NIT o razón social..."
                tooltip={
                  editingItem && editingItem.notasActivas > 0
                    ? "No se puede cambiar: la factura tiene notas de crédito/débito aplicadas."
                    : "Proveedor activo del catálogo."
                }
                error={editErrors.idProveedor}
                disabled={Boolean(editingItem && editingItem.notasActivas > 0)}
                required
              />
            </div>

            {editEsNota && editingItem && (
              <div>
                <SearchableSelect
                  label="Aplicar a la factura"
                  value={editForm.idFacturaReferencia ?? ""}
                  options={opcionesReferencia(editForm.idProveedor, editingItem.idFacturaProveedor)}
                  onChange={(val) => onChangeEditForm("idFacturaReferencia", val)}
                  searchPlaceholder="Buscar por ID o DTE..."
                  tooltip="Factura (no anulada) del mismo proveedor cuyo saldo modifica esta nota."
                  error={editErrors.idFacturaReferencia}
                  required
                />
              </div>
            )}

          </div>

          <div className="cpx-form-grid">
            <FormField
              label="Serie DTE"
              maxLength={50}
              value={editForm.serieDte}
              onChange={(e) => onChangeEditForm("serieDte", e.target.value)}
              error={editErrors.serieDte}
              required
            />

            <FormField
              label="Número DTE"
              maxLength={50}
              mono
              value={editForm.numeroDte}
              onChange={(e) => onChangeEditForm("numeroDte", e.target.value)}
              error={editErrors.numeroDte}
              required
            />

            <FormField
              label="Fecha Emisión"
              type="date"
              maxLength={10}
              max={todayISO()}
              value={editForm.fechaEmision}
              onChange={(e) => onChangeEditForm("fechaEmision", e.target.value)}
              error={editErrors.fechaEmision}
              required
            />

            <FormField
              label="Fecha Documento"
              type="date"
              maxLength={10}
              value={editForm.fechaDocumento}
              onChange={(e) => onChangeEditForm("fechaDocumento", e.target.value)}
              error={editErrors.fechaDocumento}
              required
            />

            {!editEsNota && (
              <FormField
                label="Fecha Vencimiento"
                type="date"
                maxLength={10}
                value={editForm.fechaVencimiento}
                onChange={(e) => onChangeEditForm("fechaVencimiento", e.target.value)}
                error={editErrors.fechaVencimiento}
              />
            )}
          </div>

          <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--cpx-text-secondary)", margin: "12px 0 0" }}>
            <Info size={14} />
            El monto total se calcula con las líneas (vista Detalle Factura Proveedor) y las retenciones se registran en la vista Retenciones.
          </p>

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

      {/* Anulación con motivo obligatorio (igual que Caja Chica Movimiento) */}
      <Modal
        open={anulandoItem !== null}
        title={`Anular Documento #${anulandoItem?.idFacturaProveedor ?? ""}`}
        onClose={() => setAnulandoItem(null)}
      >
        <form
          onSubmit={confirmarAnularFactura}
          style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 4 }}
        >
          <div>
            <div style={{ fontSize: 13, color: "var(--cpx-text-primary)", marginBottom: 8 }}>
              ¿Está seguro de que desea anular este documento? Esta acción cambiará su estado a{" "}
              <strong>ANULADA</strong>
              {anulandoItem && esNota(anulandoItem.tipoDocumento)
                ? ` y revertirá su efecto en el saldo de la factura #${anulandoItem.idFacturaReferencia}.`
                : " y ya no se podrá pagar."}
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
                <div><strong>ID Documento:</strong> #{anulandoItem.idFacturaProveedor}</div>
                <div><strong>Tipo:</strong> {tipoDocumentoLabel[anulandoItem.tipoDocumento] ?? anulandoItem.tipoDocumento}</div>
                <div>
                  <strong>Proveedor:</strong> {anulandoItem.nombreProveedor ?? `#${anulandoItem.idProveedor}`}
                  {anulandoItem.nitProveedor ? ` (NIT ${anulandoItem.nitProveedor})` : ""}
                </div>
                <div><strong>Serie / N° DTE:</strong> {dteTexto(anulandoItem) || "-"}</div>
                <div><strong>Monto Total:</strong> {fmt(anulandoItem.montoTotal)}</div>
              </div>
            )}
          </div>

          <FormField
            label="Motivo de la Anulación"
            required
            maxLength={300}
            style={{ width: "100%" }}
            placeholder="Ej: DTE emitido con datos incorrectos / Servicio cancelado por el proveedor"
            value={motivoAnulacion}
            onChange={(e) => setMotivoAnulacion(e.target.value)}
            tooltip="Indica de forma clara y justificada la razón. Quedará registrada en las notas del documento."
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
