import { useState, useCallback, useEffect } from "react";
import type { Retencion, RetencionForm } from "./RetencionTypes";
import { 
  obtenerRetenciones, 
  crearRetencion, 
  eliminarRetencion, 
  actualizarRetencion 
} from "./retencion.api";

const INITIAL_FORM: RetencionForm = {
  idFacturaProveedor: "",
  tipoRetencion: "",
  baseImponible: "",
  porcentaje: "",
  monto: "",
  numeroConstancia: "",
};

export function useRetencion() {
  const [retenciones, setRetenciones] = useState<Retencion[]>([]);
  const [form, setForm] = useState<RetencionForm>(INITIAL_FORM);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const cargarRetenciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerRetenciones();
      setRetenciones(data);
    } catch (err: any) {
      setError("Ocurrió un error al cargar el catálogo de retenciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarRetenciones();
  }, [cargarRetenciones]);

  const onChangeForm = (field: keyof RetencionForm, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const guardarRetencion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (
      form.idFacturaProveedor === "" || 
      !form.tipoRetencion || 
      form.baseImponible === "" || 
      form.porcentaje === "" || 
      form.monto === ""
    ) {
      setError("Todos los campos numéricos y el tipo de retención son obligatorios.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: RetencionForm = {
        ...form,
        idFacturaProveedor: Number(form.idFacturaProveedor),
        baseImponible: Number(form.baseImponible),
        porcentaje: Number(form.porcentaje),
        monto: Number(form.monto),
      };

      if (editandoId) {
        await actualizarRetencion(editandoId, payload);
      } else {
        await crearRetencion(payload);
      }

      await cargarRetenciones();
      setForm(INITIAL_FORM);
      setEditandoId(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo guardar la retención. Intente nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const eliminarRetencionItem = async (id: number) => {
    const confirmar = window.confirm("¿Estás seguro de que deseas eliminar esta retención?");
    if (!confirmar) return;

    try {
      await eliminarRetencion(id);
      await cargarRetenciones();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "No se pudo eliminar la retención. Verifica que no esté en uso.");
    }
  };

  const prepararEdicion = (retencion: Retencion) => {
    setForm({
      idFacturaProveedor: retencion.idFacturaProveedor,
      tipoRetencion: retencion.tipoRetencion,
      baseImponible: retencion.baseImponible,
      porcentaje: retencion.porcentaje,
      monto: retencion.monto,
      numeroConstancia: retencion.numeroConstancia || "",
    });
    setEditandoId(retencion.idRetencion);
    setError(null);
  };

  const cancelarEdicion = () => {
    setForm(INITIAL_FORM);
    setEditandoId(null);
    setError(null);
  };

  return {
    retenciones,
    form,
    loading,
    saving,
    error,
    editandoId,
    onChangeForm,
    guardarRetencion,
    cargarRetenciones,
    eliminarRetencion: eliminarRetencionItem,
    prepararEdicion,
    cancelarEdicion,
  };
}