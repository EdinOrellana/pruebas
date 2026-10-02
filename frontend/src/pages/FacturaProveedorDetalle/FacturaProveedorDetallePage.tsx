import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useFacturaProveedorDetalle } from "./useFacturaProveedorDetalle";
import { useSearch } from "../../components/common/SearchContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { Table, type Column } from "../../components/common/Table";
import { IconBtn } from "../../components/common/IconBtn";
import { SH } from "../../components/common/SH";
import { Modal } from "../../components/common/Modal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { useToast } from "../../components/common/Toast";
import { fmt } from "../../utils/format";
import type { FacturaProveedorDetalle } from "./facturaProveedorDetalle.types";

/**
 * FacturaProveedorDetallePage: SOLO UI. Toda la logica vive en useFacturaProveedorDetalle().
 */
export function FacturaProveedorDetallePage() {
  const {
    detalles,
    unidadesMedida,
    form,
    loading,
    saving,
    error,
    onChangeForm,
    registrarDetalle,
    eliminarDetalle,
    cargarDetalles,
  } = useFacturaProveedorDetalle();

  const { searchTerm } = useSearch();

  const [modalOpen, setModalOpen] = useState(false);

  const { success } = useToast();

  const [confirmEliminarOpen, setConfirmEliminarOpen] = useState(false);
  const [detalleAEliminar, setDetalleAEliminar] =
    useState<FacturaProveedorDetalle | null>(null);

  /** Cierra el modal automaticamente cuando un guardado termina sin error. */
  const wasSaving = useRef(false);
  useEffect(() => {
    if (wasSaving.current && !saving && !error) {
      setModalOpen(false);
    }
    wasSaving.current = saving;
  }, [saving, error]);

  const onSubmitRegistrarDetalle = async (e?: React.FormEvent) => {
    const ok = await registrarDetalle(e);
    if (ok) success("Detalle registrado con exito");
  };

  const abrirConfirmEliminar = (d: FacturaProveedorDetalle) => {
    setDetalleAEliminar(d);
    setConfirmEliminarOpen(true);
  };

  const confirmarEliminar = async () => {
    if (!detalleAEliminar) return;
    const ok = await eliminarDetalle(detalleAEliminar.idFacturaProvDetalle);
    setConfirmEliminarOpen(false);
    setDetalleAEliminar(null);
    if (ok) success("Detalle eliminado con exito");
  };

  /** Filtra la lista por Descripcion, sin distinguir mayusculas/minusculas. */
  const detallesFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return detalles;
    return detalles.filter((d) => d.descripcion.toLowerCase().includes(term));
  }, [detalles, searchTerm]);

  const columns: Column<FacturaProveedorDetalle>[] = [
    { header: "ID", numeric: true, render: (d) => d.idFacturaProvDetalle },
    {
      header: "ID Factura Proveedor",
      numeric: true,
      render: (d) => d.idFacturaProveedor,
    },
    {
      header: "ID Articulo",
      numeric: true,
      render: (d) => d.idArticulo ?? "-",
    },
    { header: "Descripcion", render: (d) => d.descripcion },
    { header: "Cantidad", numeric: true, render: (d) => d.cantidad },
    {
      header: "Precio Unitario",
      numeric: true,
      render: (d) => fmt(d.precioUnitario),
    },
    {
      header: "Unidad de Medida",
      render: (d) => {
        const unidad = unidadesMedida.find(
          (u) => u.idUnidadMedida === d.idUnidadMedida
        );
        return unidad ? unidad.descripcion : d.idUnidadMedida ?? "-";
      },
    },
    {
      header: "Subtotal",
      numeric: true,
      render: (d) => fmt(d.subtotal),
    },
    {
      header: "Acciones",
      render: (d) => (
        <IconBtn
          icon={Trash2}
          label={`Eliminar detalle ${d.idFacturaProvDetalle}`}
          variant="danger"
          onClick={() => abrirConfirmEliminar(d)}
        />
      ),
    },
  ];

  return (
    <>
      {error && <div className="cpx-alert--error">{error}</div>}

      <Card>
        <SH
          title="Detalle de Factura de Proveedor"
          actions={
            <>
              <IconBtn
                icon={RefreshCw}
                label="Refrescar"
                variant="ghost"
                onClick={cargarDetalles}
                disabled={loading}
              />
              <Button
                variant="primary"
                onClick={() => setModalOpen(true)}
                style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Plus size={14} />
                Nuevo Detalle
              </Button>
            </>
          }
        />
        <Table
          columns={columns}
          data={detallesFiltrados}
          rowKey={(d) => d.idFacturaProvDetalle}
          emptyMessage={loading ? "Cargando..." : "No hay detalle registrado"}
        />
      </Card>

      <Modal
        open={modalOpen}
        title="Registrar nuevo detalle"
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={onSubmitRegistrarDetalle}>
          <div className="cpx-form-row">
            <FormField
              label="ID Factura Proveedor"
              type="number"
              maxLength={10}
              mono
              placeholder="Ej: 1"
              value={String(form.idFacturaProveedor)}
              onChange={(e) => onChangeForm("idFacturaProveedor", e.target.value)}
              required
            />
            <FormField
              label="ID Articulo"
              type="number"
              maxLength={10}
              mono
              placeholder="Ej: 1"
              hint="Se conectara al modulo de Inventarios"
              value={form.idArticulo == null ? "" : String(form.idArticulo)}
              onChange={(e) => onChangeForm("idArticulo", e.target.value)}
            />
            <FormField
              label="Descripcion"
              maxLength={300}
              placeholder="Ej: Escritorios de oficina"
              value={form.descripcion}
              onChange={(e) => onChangeForm("descripcion", e.target.value)}
              required
            />
            <FormField
              label="Cantidad"
              type="number"
              maxLength={6}
              mono
              placeholder="Ej: 10"
              value={String(form.cantidad)}
              onChange={(e) => onChangeForm("cantidad", e.target.value)}
              required
            />
            <FormField
              label="Precio Unitario"
              type="number"
              maxLength={12}
              mono
              placeholder="Ej: 500.00"
              value={String(form.precioUnitario)}
              onChange={(e) => onChangeForm("precioUnitario", e.target.value)}
              required
            />
            <div className="cpx-field" style={{ width: "calc(24ch + 24px)" }}>
              <label className="cpx-field__label">Unidad de Medida</label>
              <select
                className="cpx-field__input"
                value={form.idUnidadMedida == null ? "" : String(form.idUnidadMedida)}
                onChange={(e) => onChangeForm("idUnidadMedida", e.target.value)}
              >
                <option value="">Sin unidad de medida</option>
                {unidadesMedida.map((u) => (
                  <option key={u.idUnidadMedida} value={u.idUnidadMedida}>
                    {u.descripcion}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Registrar detalle"}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmEliminarOpen}
        title="Eliminar detalle"
        message="¿Seguro que deseas eliminar este detalle? Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmarEliminar}
        onClose={() => setConfirmEliminarOpen(false)}
      />
    </>
  );
}
