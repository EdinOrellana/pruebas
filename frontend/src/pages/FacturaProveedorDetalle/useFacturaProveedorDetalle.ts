import { useCallback, useEffect, useState } from "react";
import {
  getFacturaProveedorDetalles,
  crearFacturaProveedorDetalle as apiCrearFacturaProveedorDetalle,
  eliminarFacturaProveedorDetalle as apiEliminarFacturaProveedorDetalle,
} from "./facturaProveedorDetalle.api";
import { getUnidadesMedida } from "./unidadMedidaCatalogo.api";
import type {
  FacturaProveedorDetalle,
  CrearFacturaProveedorDetalleInput,
  UnidadMedida,
} from "./facturaProveedorDetalle.types";

/** Campos numericos opcionales del formulario (se guardan como null si estan vacios). */
const CAMPOS_NUMERICOS_OPCIONALES = new Set(["idArticulo", "idUnidadMedida"]);
/** Campos numericos requeridos del formulario. */
const CAMPOS_NUMERICOS_REQUERIDOS = new Set([
  "idFacturaProveedor",
  "cantidad",
  "precioUnitario",
]);

/** Estado inicial del formulario de creacion. */
const formInicial: CrearFacturaProveedorDetalleInput = {
  idFacturaProveedor: 0,
  idArticulo: null,
  descripcion: "",
  cantidad: 1,
  precioUnitario: 0,
  idUnidadMedida: null,
};

/**
 * Hook con TODA la logica y estados de la vista de Detalle de Factura de Proveedor.
 * La pagina (FacturaProveedorDetallePage) solo consume esto y pinta UI.
 */
export function useFacturaProveedorDetalle() {
  const [detalles, setDetalles] = useState<FacturaProveedorDetalle[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<UnidadMedida[]>([]);
  const [form, setForm] = useState<CrearFacturaProveedorDetalleInput>(formInicial);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Carga la lista desde el backend (sin filtro: trae todo). */
  const cargarDetalles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFacturaProveedorDetalles();
      setDetalles(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Error al cargar el detalle");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDetalles();
  }, [cargarDetalles]);

  /** Carga el catalogo de unidades de medida una sola vez (para el dropdown del formulario). */
  useEffect(() => {
    getUnidadesMedida()
      .then(setUnidadesMedida)
      .catch((err) => {
        console.error("Error al cargar unidades de medida:", err);
      });
  }, []);

  /** Actualiza un campo del formulario. */
  const onChangeForm = useCallback(
    (campo: keyof CrearFacturaProveedorDetalleInput, valor: string) => {
      setForm((prev) => {
        if (CAMPOS_NUMERICOS_OPCIONALES.has(campo)) {
          return { ...prev, [campo]: valor === "" ? null : Number(valor) };
        }
        if (CAMPOS_NUMERICOS_REQUERIDOS.has(campo)) {
          return { ...prev, [campo]: Number(valor) };
        }
        return { ...prev, [campo]: valor };
      });
    },
    []
  );

  /** Envia el formulario para crear un detalle y recarga la lista. Devuelve si tuvo exito. */
  const registrarDetalle = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      e?.preventDefault();
      setSaving(true);
      setError(null);
      try {
        await apiCrearFacturaProveedorDetalle(form);
        setForm(formInicial);
        await cargarDetalles();
        return true;
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Error al registrar el detalle");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [form, cargarDetalles]
  );

  /**
   * Elimina un detalle (borrado fisico e irreversible) y recarga la lista. Devuelve si tuvo exito.
   * La confirmacion del usuario se pide en la UI (ConfirmDialog) antes de llamar esto.
   */
  const eliminarDetalle = useCallback(
    async (id: number): Promise<boolean> => {
      setError(null);
      try {
        await apiEliminarFacturaProveedorDetalle(id);
        await cargarDetalles();
        return true;
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Error al eliminar el detalle");
        return false;
      }
    },
    [cargarDetalles]
  );

  return {
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
  };
}
