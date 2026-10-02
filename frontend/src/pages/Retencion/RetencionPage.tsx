import { useEffect, useRef, useState } from "react";
import { Plus, RefreshCw, Edit, Trash2 } from "lucide-react"; 
import { useRetencion } from "./useRetencion";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { Table, type Column } from "../../components/common/Table";
import { IconBtn } from "../../components/common/IconBtn";
import { SH } from "../../components/common/SH";
import { Modal } from "../../components/common/Modal";
import type { Retencion } from "./RetencionTypes";

export function RetencionPage() {
  const {
    retenciones,
    form,
    loading,
    saving,
    error,
    editandoId, // Nuevo dato desde el hook
    onChangeForm,
    guardarRetencion,
    cargarRetenciones,
    eliminarRetencion,
    prepararEdicion, // Nueva función
    cancelarEdicion  // Nueva función
  } = useRetencion();

  const [modalOpen, setModalOpen] = useState(false);
  const wasSaving = useRef(false);

  useEffect(() => {
    if (wasSaving.current && !saving && !error) {
      setModalOpen(false);
    }
    wasSaving.current = saving;
  }, [saving, error]);

  const handleCloseModal = () => {
    cancelarEdicion();
    setModalOpen(false);
  };

  const columns: Column<Retencion>[] = [
    { header: "ID", mono: true, render: (r) => <span className="text-muted">#{r.idRetencion}</span> },
    { header: "Factura P.", render: (r) => <span>#{r.idFacturaProveedor}</span> },
    { header: "Tipo", render: (r) => <strong className="font-semibold">{r.tipoRetencion}</strong> },
    // SOLUCIÓN EXTRA: Usamos Number(r.valor || 0) para prevenir errores fatales si la base de datos devuelve null/undefined
    { header: "Base Imp.", render: (r) => <span>Q{Number(r.baseImponible || 0).toFixed(2)}</span> },
    { header: "Porcentaje", render: (r) => <span>{r.porcentaje}%</span> },
    { header: "Monto", render: (r) => <span className="font-medium text-success">Q{Number(r.monto || 0).toFixed(2)}</span> },
    { header: "Constancia", render: (r) => <span>{r.numeroConstancia || "N/A"}</span> },
    { 
      header: "Acciones", 
      render: (r) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <IconBtn
            icon={Edit}
            label={`Editar retención ${r.idRetencion}`}
            variant="primary"
            onClick={() => {
              prepararEdicion(r); // Cargamos los datos en el form
              setModalOpen(true); // Abrimos el modal
            }}
          />
          <IconBtn
            icon={Trash2}
            label={`Borrar retención ${r.idRetencion}`}
            variant="danger"
            onClick={() => eliminarRetencion(r.idRetencion)}
          />
        </div>
      ) 
    },
  ];

  return (
    <>
      {error && <div className="text-danger font-medium" style={{ marginBottom: 16 }}>{error}</div>}

      <Card>
        <SH
          title="Gestión de Retenciones de IVA e ISR (CP_RETENCION)"
          actions={
            <>
              <IconBtn icon={RefreshCw} label="Refrescar catálogo" variant="ghost" onClick={cargarRetenciones} disabled={loading} />
              <IconBtn icon={Plus} label="Nueva Retención" variant="primary" onClick={() => setModalOpen(true)} />
            </>
          }
        />
        
        <Table
          columns={columns}
          data={retenciones}
          rowKey={(r) => r.idRetencion}
          emptyMessage={loading ? "Cargando retenciones..." : "No hay retenciones registradas"}
        />
      </Card>

      {/* El título cambia si estamos editando o creando */}
      <Modal open={modalOpen} title={editandoId ? `Editar Retención #${editandoId}` : "Nueva Retención"} onClose={handleCloseModal}>
        <form onSubmit={guardarRetencion}>
          <div className="form-row">
            <FormField 
              label="ID Factura" 
              type="number" 
              maxLength={10} 
              value={form.idFacturaProveedor} 
              onChange={(e) => onChangeForm("idFacturaProveedor", Number(e.target.value))} 
              required 
              style={{ width: '100%' }} 
            />

            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
              <label style={{ fontSize: "13px", color: "#666", fontWeight: 500 }}>
                Tipo (IVA o ISR)
              </label>
              <div style={{ position: "relative", width: "100%" }}>
                <select
                  value={form.tipoRetencion}
                  onChange={(e) => onChangeForm("tipoRetencion", e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    border: "1px solid #e5e7eb",
                    backgroundColor: "#f9fafb",
                    fontSize: "14px",
                    color: "#111827",
                    outline: "none",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    cursor: "pointer",
                    transition: "border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#2563eb";
                    e.target.style.backgroundColor = "#ffffff";
                    e.target.style.boxShadow = "0 0 0 3px rgba(37, 99, 235, 0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#e5e7eb";
                    e.target.style.backgroundColor = "#f9fafb";
                    e.target.style.boxShadow = "none";
                  }}
                >
                  <option value="" disabled>Seleccione un tipo...</option>
                  <option value="IVA">IVA</option>
                  <option value="ISR">ISR</option>
                </select>
                <span
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderTop: "5px solid #6b7280",
                  }}
                />
              </div>
            </div>
          </div>

          <div className="form-row">
            <FormField 
              label="Base Imponible (Q)" 
              type="number" 
              step="0.01" 
              maxLength={14} 
              value={form.baseImponible} 
              onChange={(e) => onChangeForm("baseImponible", Number(e.target.value))} 
              required 
              style={{ width: '100%' }} 
            />
            <FormField 
              label="Porcentaje (%)" 
              type="number" 
              step="0.01" 
              maxLength={5} 
              value={form.porcentaje} 
              onChange={(e) => onChangeForm("porcentaje", Number(e.target.value))} 
              required 
              style={{ width: '100%' }} 
            />
          </div>

          <div className="form-row">
            <FormField 
              label="Monto Retenido (Q)" 
              type="number" 
              step="0.01" 
              maxLength={14} 
              value={form.monto} 
              onChange={(e) => onChangeForm("monto", Number(e.target.value))} 
              required 
              style={{ width: '100%' }} 
            />
            <FormField 
              label="No. Constancia (Opcional)" 
              maxLength={50} 
              value={form.numeroConstancia} 
              onChange={(e) => onChangeForm("numeroConstancia", e.target.value)} 
              style={{ width: '100%' }} 
            />
          </div>

          <div className="form-actions" style={{ marginTop: "16px" }}>
            <Button type="button" onClick={handleCloseModal}>Cancelar</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Guardando..." : (editandoId ? "Actualizar" : "Guardar")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}