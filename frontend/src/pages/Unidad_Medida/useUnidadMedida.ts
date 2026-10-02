// src/pages/Unidad_Medida/useUnidadMedida.ts
import { useState, useCallback, useEffect } from "react";
import type { UnidadMedida, UnidadMedidaForm } from "./UnidadMedidaTypes";
import { 
  obtenerUnidadesMedida, 
  crearUnidadMedida, 
  actualizarUnidadMedidaAPI, 
  eliminarUnidadMedidaAPI 
} from "./unidadMedida.api";

const INITIAL_FORM: UnidadMedidaForm = { descripcion: "" };

export function useUnidadMedida() {
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [form, setForm] = useState<UnidadMedidaForm>(INITIAL_FORM);
  const [editingId, setEditingId] = useState<number | null>(null); // Estado para saber si editamos
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cargarUnidades = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerUnidadesMedida();
      setUnidades(data);
    } catch (err) {
      setError("Ocurrió un error al cargar el catálogo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarUnidades();
  }, [cargarUnidades]);

  const onChangeForm = (field: keyof UnidadMedidaForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Función para pre-llenar el modal cuando le damos a "Editar"
  const prepararEdicion = (unidad: UnidadMedida) => {
    setEditingId(unidad.idUnidadMedida);
    setForm({ descripcion: unidad.descripcion });
    setError(null);
  };

  // Función para limpiar el modal
  const cancelarEdicion = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setError(null);
  };

  const guardarUnidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.descripcion.trim()) {
      setError("La descripción es obligatoria.");
      return false; // Retornamos false para que la vista no cierre el modal
    }

    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        // Si hay un ID, actualizamos
        await actualizarUnidadMedidaAPI(editingId, form);
      } else {
        // Si no hay ID, creamos uno nuevo
        await crearUnidadMedida(form);
      }
      
      // FORZAMOS LA RECARGA DE LA LISTA DESDE LA BASE DE DATOS
      await cargarUnidades();
      cancelarEdicion();
      return true; // Retornamos true para indicar éxito
    } catch (err) {
      setError("No se pudo guardar la información.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const eliminarUnidad = async (id: number) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar esta unidad de medida?");
    if (!confirmar) return;

    try {
      await eliminarUnidadMedidaAPI(id);
      // FORZAMOS LA RECARGA DE LA LISTA DESDE LA BASE DE DATOS
      await cargarUnidades(); 
    } catch (err) {
      setError("No se pudo eliminar la unidad de medida.");
    }
  };

  return {
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
  };
}