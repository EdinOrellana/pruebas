// src/pages/Unidad_Medida/UnidadMedidaPage.tsx
import { useState } from "react";
import { Plus, RefreshCw, Edit, Trash2 } from "lucide-react";
import { useUnidadMedida } from "./useUnidadMedida";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { FormField } from "../../components/common/FormField";
import { Table, type Column } from "../../components/common/Table";
import { IconBtn } from "../../components/common/IconBtn";
import { SH } from "../../components/common/SH";
import { Modal } from "../../components/common/Modal";
import type { UnidadMedida } from "./UnidadMedidaTypes";

export function UnidadMedidaPage() {
  const {
    unidades,
    form,
    editingId,
    loading,
    saving,
    error,
    onChangeForm,
    prepararEdicion,
    cancelarEdicion,
    guardarUnidad,
    cargarUnidades,
    eliminarUnidad,
  } = useUnidadMedida();

  const [modalOpen, setModalOpen] = useState(false);

  const handleNuevaUnidad = () => {
    cancelarEdicion();
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    cancelarEdicion();
    setModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    const exito = await guardarUnidad(e);
    if (exito) {
      setModalOpen(false);
    }
  };

  const columns: Column<UnidadMedida>[] = [
    {
      header: "ID",
      mono: true,
      render: (u) => <span className="text-muted">#{u.idUnidadMedida}</span>
    },
    {
      header: "Descripción",
      render: (u) => <strong className="font-semibold">{u.descripcion}</strong>
    },
    {
      header: "Acciones",
      render: (u) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <IconBtn
            icon={Edit}
            label={`Editar ${u.descripcion}`}
            variant="primary"
            onClick={() => {
              prepararEdicion(u);
              setModalOpen(true);
            }}
          />
          <IconBtn
            icon={Trash2}
            label={`Borrar ${u.descripcion}`}
            variant="danger"
            onClick={() => eliminarUnidad(u.idUnidadMedida)}
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
          title="Catálogo de Tipos de Unidad de Medida"
          actions={
            <>
              <IconBtn
                icon={RefreshCw}
                label="Refrescar catálogo"
                variant="ghost"
                onClick={cargarUnidades}
                disabled={loading}
              />
              <IconBtn
                icon={Plus}
                label="Nueva Unidad"
                variant="primary"
                onClick={handleNuevaUnidad}
              />
            </>
          }
        />

        <Table
          columns={columns}
          data={unidades}
          rowKey={(u) => u.idUnidadMedida}
          emptyMessage={loading ? "Cargando catálogo..." : "No hay unidades registradas"}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editingId ? "Editar Unidad de Medida" : "Nueva Unidad de Medida"}
        onClose={handleCloseModal}
      >
        <form onSubmit={handleSubmit} style={{ width: '100%', boxSizing: 'border-box' }}>
          <div style={{ marginBottom: '20px', width: '100%' }}>
            <FormField
              label="Descripción de la Unidad"
              maxLength={100}
              placeholder="Ej: Quintal, Galón, Caja..."
              value={form.descripcion}
              onChange={(e) => onChangeForm("descripcion", e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={handleCloseModal}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              variant="primary" 
              disabled={saving}
            >
              {saving ? "Guardando..." : (editingId ? "Actualizar" : "Guardar")}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}