import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  Calendar,
  CircleCheck,
  FileText,
  KeyRound,
  Landmark,
  Plus,
  RefreshCw,
  Save,
  X,
} from "lucide-react";
import { useCheque } from "./useCheque";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { SearchableSelect, type SelectOption } from "../../components/common/SearchableSelect";
import { Table, type Column } from "../../components/common/Table";
import { Pagination, FilterDropdown, GuideBanner, StatusBadge, TableSearchBar } from "../../components/common";
import { IconBtn } from "../../components/common/IconBtn";
import { SH } from "../../components/common/SH";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useToast } from "../../components/common/Toast";
import { formatDate, fmt, todayISO } from "../../utils/format";
import type { Cheque, EstadoCheque } from "./cheque.types";

const estadoColor: Record<EstadoCheque, "accent" | "success" | "danger"> = {
  EMITIDO: "accent",
  COBRADO: "success",
  ANULADO: "danger",
};

/** Lista fija de bancos comunes de Guatemala para el select del formulario. */
const BANCOS_GUATEMALA = [
  "Banco Industrial",
  "Banco G&T Continental",
  "Banco de Desarrollo Rural (Banrural)",
  "Banco Agromercantil (BAM)",
  "Banco Promerica",
  "Banco de los Trabajadores (Bantrab)",
  "Banco Azteca",
  "Vivibanco",
];

/**
 * ChequePage: SOLO UI. Toda la logica vive en useCheque().
 */
export function ChequePage() {
  const {
    cheques,
    contrasenas,
    facturas,
    form,
    loading,
    saving,
    cobrando,
    error,
    fechaEmisionError,
    onChangeForm,
    registrarCheque,
    cobrarCheque,
    anularCheque,
    cargarCheques,
  } = useCheque();

  const { success, warning } = useToast();

  const [showGuide, setShowGuide] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState<"TODOS" | "EMITIDO" | "COBRADO" | "ANULADO">("TODOS");

  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [limitePorPagina, setLimitePorPagina] = useState<number>(10);

  const [cobrarModalOpen, setCobrarModalOpen] = useState(false);
  const [chequeACobrar, setChequeACobrar] = useState<Cheque | null>(null);
  const [fechaCobroInput, setFechaCobroInput] = useState(todayISO());
  const [fechaCobroError, setFechaCobroError] = useState<string | null>(null);

  const [confirmAnularOpen, setConfirmAnularOpen] = useState(false);
  const [chequeAAnular, setChequeAAnular] = useState<Cheque | null>(null);

  /** Cierra el modal de creacion automaticamente cuando un guardado termina sin error. */
  const wasSaving = useRef(false);
  useEffect(() => {
    if (wasSaving.current && !saving && !error) {
      setModalOpen(false);
    }
    wasSaving.current = saving;
  }, [saving, error]);

  /** Cierra el modal de cobro automaticamente cuando el cobro termina sin error. */
  const wasCobrando = useRef(false);
  useEffect(() => {
    if (wasCobrando.current && !cobrando && !error) {
      setCobrarModalOpen(false);
      setChequeACobrar(null);
    }
    wasCobrando.current = cobrando;
  }, [cobrando, error]);

  /**
   * Opciones de Contraseña de Pago para el SearchableSelect del formulario.
   * Muestra el monto a pagar junto con el saldo pendiente de la factura asociada,
   * para que quede claro si esta contraseña cubre el total o es un pago parcial.
   */
  const contrasenasOptions = useMemo<SelectOption[]>(
    () =>
      contrasenas.map((cp) => {
        const factura = facturas.find((f) => f.idFacturaProveedor === cp.idFacturaProveedor);
        const saldoTexto = factura
          ? `Saldo pendiente factura: ${fmt(factura.saldoPendiente)}`
          : `Monto: ${fmt(cp.monto)}`;
        return {
          id: cp.idContrasena,
          nombre: `#${cp.idContrasena} - Factura #${cp.idFacturaProveedor}`,
          detalle: `Monto a pagar: ${fmt(cp.monto)} · ${saldoTexto} (${cp.estado})`,
        };
      }),
    [contrasenas, facturas]
  );

  /** Opciones de Banco para el SearchableSelect del formulario. */
  const bancosOptions = useMemo<SelectOption[]>(
    () => BANCOS_GUATEMALA.map((banco) => ({ id: banco, nombre: banco })),
    []
  );

  /** Cheques visibles segun el texto buscado (N° de cheque, banco, estado o IDs) y el estado filtrado. */
  const chequesVisibles = useMemo(() => {
    const term = busqueda.trim().toLowerCase();
    return cheques.filter((c) => {
      if (estadoFiltro !== "TODOS" && c.estado !== estadoFiltro) {
        return false;
      }
      if (!term) return true;
      return (
        String(c.idCheque).includes(term) ||
        String(c.idContrasenaPago).includes(term) ||
        c.banco.toLowerCase().includes(term) ||
        c.numeroCheque.toLowerCase().includes(term) ||
        c.estado.toLowerCase().includes(term)
      );
    });
  }, [cheques, busqueda, estadoFiltro]);

  /** Reinicia la pagina actual cuando cambia el texto de busqueda o el filtro de estado. */
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, estadoFiltro]);

  /** Contadores por estado, calculados sobre el arreglo completo (no afectados por busqueda/filtro). */
  const totalCheques = cheques.length;
  const totalEmitidos = useMemo(
    () => cheques.filter((c) => c.estado === "EMITIDO").length,
    [cheques]
  );
  const totalCobrados = useMemo(
    () => cheques.filter((c) => c.estado === "COBRADO").length,
    [cheques]
  );
  const totalAnulados = useMemo(
    () => cheques.filter((c) => c.estado === "ANULADO").length,
    [cheques]
  );

  const totalRegistros = chequesVisibles.length;
  const totalPaginas = Math.ceil(totalRegistros / limitePorPagina) || 1;

  /** Cheques de la pagina actual, recortados sobre chequesVisibles. */
  const chequesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * limitePorPagina;
    return chequesVisibles.slice(inicio, inicio + limitePorPagina);
  }, [chequesVisibles, paginaActual, limitePorPagina]);

  const abrirModalCobro = (c: Cheque) => {
    setChequeACobrar(c);
    setFechaCobroInput("");
    setFechaCobroError(null);
    setCobrarModalOpen(true);
  };

  const onChangeFechaCobro = (valor: string) => {
    setFechaCobroInput(valor);
    setFechaCobroError(null);
  };

  /** Fecha de emision del cheque a cobrar, en formato YYYY-MM-DD (o null si no aplica). */
  const fechaEmisionCobro =
    chequeACobrar && formatDate(chequeACobrar.fechaEmision) !== "-"
      ? formatDate(chequeACobrar.fechaEmision)
      : null;

  const confirmarCobro = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chequeACobrar) return;

    if (!fechaCobroInput) {
      setFechaCobroError("La fecha de cobro es obligatoria");
      warning("Campos incompletos", "Por favor revisa los campos señalados.");
      return;
    }

    if (fechaEmisionCobro && fechaCobroInput < fechaEmisionCobro) {
      setFechaCobroError(
        "La fecha de cobro no puede ser anterior a la fecha de emision"
      );
      return;
    }

    if (fechaCobroInput > todayISO()) {
      setFechaCobroError("La fecha de cobro no puede ser una fecha futura");
      return;
    }

    const ok = await cobrarCheque(chequeACobrar.idCheque, fechaCobroInput);
    if (ok) success("Cheque marcado como cobrado");
  };

  const onSubmitRegistrarCheque = async (e?: React.FormEvent) => {
    const ok = await registrarCheque(e);
    if (ok) success("Cheque registrado con exito");
  };

  const abrirConfirmAnular = (c: Cheque) => {
    setChequeAAnular(c);
    setConfirmAnularOpen(true);
  };

  const confirmarAnular = async () => {
    if (!chequeAAnular) return;
    const ok = await anularCheque(chequeAAnular.idCheque);
    setConfirmAnularOpen(false);
    setChequeAAnular(null);
    if (ok) success("Cheque anulado");
  };

  const columns: Column<Cheque>[] = [
    {
      header: "ID",
      width: "7%",
      render: (c) => (
        <span style={{ fontWeight: 600, color: "var(--cpx-accent)" }} className="cpx-mono">
          #{c.idCheque}
        </span>
      ),
    },
    {
      header: "ID Contraseña",
      mono: true,
      width: "11%",
      render: (c) => (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <KeyRound size={14} color="var(--cpx-text-secondary)" />
          {c.idContrasenaPago}
        </span>
      ),
    },
    {
      header: "Banco",
      width: "20%",
      render: (c) => (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Landmark size={14} color="var(--cpx-text-secondary)" />
          {c.banco}
        </span>
      ),
    },
    {
      header: "N° Cheque",
      mono: true,
      width: "13%",
      render: (c) => (
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FileText size={14} color="var(--cpx-text-secondary)" />
          <span style={{ fontWeight: 700 }}>{c.numeroCheque}</span>
        </span>
      ),
    },
    {
      header: "Emisión",
      mono: true,
      width: "13%",
      render: (c) => (
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--cpx-text-secondary)", fontSize: "12px" }}>
          <Calendar size={13} color="var(--cpx-text-muted)" />
          <span style={{ fontFamily: "var(--cpx-font-mono)" }}>{formatDate(c.fechaEmision)}</span>
        </span>
      ),
    },
    {
      header: "Cobro",
      mono: true,
      width: "13%",
      render: (c) => (
        <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--cpx-text-secondary)", fontSize: "12px" }}>
          <Calendar size={13} color="var(--cpx-text-muted)" />
          <span style={{ fontFamily: "var(--cpx-font-mono)" }}>{formatDate(c.fechaCobro)}</span>
        </span>
      ),
    },
    {
      header: "Estado",
      width: "10%",
      render: (c) => (
        <StatusBadge
          status={c.estado}
          color={estadoColor[c.estado]}
          forceDot={c.estado === "ANULADO" ? "filled" : undefined}
        />
      ),
    },
    {
      header: "Acciones",
      width: "13%",
      render: (c) => (
        <div style={{ display: "inline-flex", gap: 6 }}>
          {c.estado === "EMITIDO" && (
            <>
              <Button
                variant="success"
                icon={<CircleCheck size={13} />}
                onClick={() => abrirModalCobro(c)}
                style={{ padding: "4px 10px", fontSize: "12px" }}
              >
                Cobrar
              </Button>
              <Button
                variant="danger"
                icon={<Ban size={13} />}
                onClick={() => abrirConfirmAnular(c)}
                style={{ padding: "4px 10px", fontSize: "12px" }}
              >
                Anular
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {error && <div className="cpx-alert--error">{error}</div>}

      <GuideBanner
        title="Primeros Pasos: Flujo de Cheques"
        visible={showGuide}
        onToggle={setShowGuide}
        steps={[
          {
            number: "1",
            title: "Selecciona la Contraseña de Pago",
            description: "Elige la contraseña de pago aprobada contra la que se emitirá el cheque.",
          },
          {
            number: "2",
            title: "Completa Banco y Número de Cheque",
            description: "Indica el banco emisor y el número de cheque impreso en el talonario.",
          },
          {
            number: "3",
            title: "Registra la Fecha de Emisión",
            description: "La fecha no puede ser futura. Luego podrás cobrarlo o anularlo según su estado.",
          },
        ]}
      />

      <Card>
        <div style={{ padding: "20px 20px 10px 20px" }}>
          <SH
            title="Cheques Registrados"
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <IconBtn
                  icon={RefreshCw}
                  label="Refrescar catálogo"
                  variant="ghost"
                  onClick={cargarCheques}
                  disabled={loading}
                />
                <Button
                  variant="primary"
                  onClick={() => setModalOpen(true)}
                  icon={<Plus size={15} />}
                >
                  Nuevo cheque
                </Button>
              </div>
            }
          />
        </div>

        <TableSearchBar
          searchTerm={busqueda}
          onSearchChange={setBusqueda}
          placeholder="Buscar por N° cheque, banco, estado, ID..."
          filters={
            <FilterDropdown<"TODOS" | "EMITIDO" | "COBRADO" | "ANULADO">
              label="Estado"
              options={[
                { key: "EMITIDO", label: "Emitidos", count: totalEmitidos },
                { key: "COBRADO", label: "Cobrados", count: totalCobrados },
                { key: "ANULADO", label: "Anulados", count: totalAnulados },
              ]}
              value={estadoFiltro}
              onChange={(val) => setEstadoFiltro(val)}
              allOptionKey="TODOS"
              allOptionLabel="Todos los estados"
              totalCount={totalCheques}
              searchPlaceholder="Filtrar por estado..."
            />
          }
        />

        <Table
          columns={columns}
          data={chequesPaginados}
          rowKey={(c) => c.idCheque}
          emptyMessage={
            loading
              ? "Cargando cheques..."
              : busqueda
              ? `No se encontraron cheques con "${busqueda}"`
              : "No hay cheques registrados"
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
          etiquetaRegistros="cheques"
        />
      </Card>

      <Modal
        open={modalOpen}
        title="Registrar nuevo cheque"
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={onSubmitRegistrarCheque}>
          <div className="cpx-form-row">
            {/* Selector interactivo amarrado a Contraseña de Pago */}
            <div style={{ width: "calc(28ch + 24px)" }}>
              <SearchableSelect
                label="Contraseña de Pago"
                value={form.idContrasenaPago || ""}
                options={contrasenasOptions}
                onChange={(val) => onChangeForm("idContrasenaPago", String(val))}
                placeholder="-- Seleccionar Contraseña --"
                searchPlaceholder="Buscar por ID, factura o monto..."
                required
              />
            </div>

            <div style={{ width: "calc(38ch + 24px)" }}>
              <SearchableSelect
                label="Banco"
                value={form.banco}
                options={bancosOptions}
                onChange={(val) => onChangeForm("banco", String(val))}
                placeholder="Selecciona un banco"
                searchPlaceholder="Buscar banco..."
                required
              />
            </div>

            <FormField
              label="Número de cheque"
              placeholder="Ej: 000123"
              maxLength={20}
              mono
              tooltip="Número impreso en el talonario"
              value={form.numeroCheque}
              onChange={(e) => onChangeForm("numeroCheque", e.target.value)}
              required
            />

            <div>
              <FormField
                label="Fecha de emision"
                type="date"
                maxLength={10}
                max={todayISO()}
                value={form.fechaEmision}
                onChange={(e) => onChangeForm("fechaEmision", e.target.value)}
                required
              />
              {fechaEmisionError && (
                <span className="cpx-field__error">{fechaEmisionError}</span>
              )}
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
              {saving ? "Guardando..." : "Registrar cheque"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={cobrarModalOpen}
        title={
          chequeACobrar ? `Cobrar cheque ${chequeACobrar.idCheque}` : "Cobrar cheque"
        }
        onClose={() => setCobrarModalOpen(false)}
        maxWidth={320}
      >
        <form onSubmit={confirmarCobro} noValidate>
          <div className="cpx-form-row">
            <div>
              <FormField
                label="Fecha de cobro"
                type="date"
                maxLength={10}
                min={fechaEmisionCobro ?? undefined}
                max={todayISO()}
                value={fechaCobroInput}
                onChange={(e) => onChangeFechaCobro(e.target.value)}
                required
              />
              {fechaCobroError && (
                <span className="cpx-field__error">{fechaCobroError}</span>
              )}
            </div>
          </div>
          <Button type="submit" disabled={cobrando}>
            {cobrando ? "Cobrando..." : "Confirmar cobro"}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmAnularOpen}
        title="Anular cheque"
        message={
          chequeAAnular
            ? `¿Seguro que deseas anular el cheque ${chequeAAnular.numeroCheque}? Esta accion no se puede deshacer.`
            : ""
        }
        confirmLabel="Anular"
        danger
        onConfirm={confirmarAnular}
        onClose={() => setConfirmAnularOpen(false)}
      />
    </>
  );
}
