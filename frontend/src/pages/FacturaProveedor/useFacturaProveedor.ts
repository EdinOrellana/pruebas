import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getFacturasProveedor,
  getFacturaProveedor,
  getProveedores,
  crearFacturaProveedor as apiCrearFactura,
  actualizarFacturaProveedor as apiActualizarFactura,
  anularFacturaProveedor as apiAnularFactura,
} from "./facturaProveedor.api";
import { getUnidadesMedida } from "../FacturaProveedorDetalle/unidadMedidaCatalogo.api";
import type { UnidadMedida } from "../FacturaProveedorDetalle/facturaProveedorDetalle.types";
import { useToast } from "../../components/common/Toast";
import { formatDate, todayISO } from "../../utils/format";
import {
  esNota,
  type FacturaProveedor,
  type CrearFacturaProveedorInput,
  type ActualizarFacturaProveedorInput,
  type LineaDetalleInput,
  type Proveedor,
} from "./facturaProveedor.types";

/** Suma dias a una fecha YYYY-MM-DD y devuelve YYYY-MM-DD (hora local). */
function sumarDias(fechaISO: string, dias: number): string {
  const [y, m, d] = fechaISO.split("-").map(Number);
  const fecha = new Date(y, m - 1, d + dias);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}

/** Estado inicial del formulario de creación; se genera al momento para usar la fecha de hoy (hora local). */
const crearFormInicial = (): CrearFacturaProveedorInput => {
  const hoy = todayISO();
  return {
    idProveedor: 0,
    tipoDocumento: "FACTURA",
    numeroDte: "",
    serieDte: "",
    fechaEmision: hoy,
    fechaDocumento: hoy,
    fechaVencimiento: sumarDias(hoy, 30),
    idFacturaReferencia: null,
    detalles: [],
  };
};

const lineaInicial = {
  idArticulo: "",
  descripcion: "",
  cantidad: "1",
  precioUnitario: "",
  idUnidadMedida: "",
};

/** Errores de validacion por campo (se muestran bajo cada input). */
export type ErroresFactura = Partial<
  Record<"idProveedor" | "serieDte" | "numeroDte" | "fechaEmision" | "fechaDocumento" | "fechaVencimiento" | "idFacturaReferencia" | "detalles", string>
>;

/**
 * Validaciones de encabezado, iguales a PKG_CP_FACTURA_PROVEEDOR.VALIDAR_CABECERA
 * (la base de datos vuelve a validarlas; aqui solo se adelanta el aviso).
 */
function validarCabecera(
  datos: ActualizarFacturaProveedorInput,
  tipo: CrearFacturaProveedorInput["tipoDocumento"]
): ErroresFactura {
  const errores: ErroresFactura = {};
  if (!datos.idProveedor) errores.idProveedor = "Selecciona el proveedor";
  if (!datos.serieDte.trim()) errores.serieDte = "La serie es obligatoria";
  if (!datos.numeroDte.trim()) errores.numeroDte = "El número es obligatorio";
  if (!datos.fechaEmision) errores.fechaEmision = "La fecha de emisión es obligatoria";
  else if (datos.fechaEmision > todayISO()) errores.fechaEmision = "No puede ser futura";
  if (!datos.fechaDocumento) errores.fechaDocumento = "La fecha de documento es obligatoria";
  else if (datos.fechaEmision && datos.fechaDocumento < datos.fechaEmision)
    errores.fechaDocumento = "No puede ser anterior a la emisión";
  if (datos.fechaVencimiento && datos.fechaEmision && datos.fechaVencimiento < datos.fechaEmision)
    errores.fechaVencimiento = "No puede ser anterior a la emisión";
  if (esNota(tipo) && !datos.idFacturaReferencia)
    errores.idFacturaReferencia = "Indica la factura a la que se aplica la nota";
  return errores;
}

/** Extrae el mensaje de error que devuelve el backend. */
function mensajeError(err: any, porDefecto: string): string {
  return err?.response?.data?.message ?? err?.response?.data?.details ?? porDefecto;
}

export function useFacturaProveedor() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [facturas, setFacturas] = useState<FacturaProveedor[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [unidades, setUnidades] = useState<UnidadMedida[]>([]);
  const [form, setForm] = useState<CrearFacturaProveedorInput>(crearFormInicial);
  const [formErrors, setFormErrors] = useState<ErroresFactura>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ver detalles completos de una factura
  const [viewingItem, setViewingItem] = useState<FacturaProveedor | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Edición de encabezado
  const [editingItem, setEditingItem] = useState<FacturaProveedor | null>(null);
  const [editForm, setEditForm] = useState<ActualizarFacturaProveedorInput>({
    idProveedor: 0,
    numeroDte: "",
    serieDte: "",
    fechaEmision: "",
    fechaDocumento: "",
    fechaVencimiento: "",
    idFacturaReferencia: null,
  });
  const [editErrors, setEditErrors] = useState<ErroresFactura>({});

  // Línea temporal para agregar al detalle en el formulario de creación
  const [lineaForm, setLineaForm] = useState(lineaInicial);
  const [lineaError, setLineaError] = useState<string | null>(null);

  /** Carga la lista desde el backend. */
  const cargarFacturas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFacturasProveedor();
      setFacturas(data);
    } catch (err: any) {
      const msg = mensajeError(err, "Error al cargar facturas de proveedor");
      setError(msg);
      toastRef.current.error("Error al cargar datos", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Catalogos de los selectores (proveedores y unidades de medida). */
  const cargarCatalogos = useCallback(async () => {
    const [prov, uni] = await Promise.allSettled([getProveedores(), getUnidadesMedida()]);
    if (prov.status === "fulfilled") setProveedores(prov.value);
    else toastRef.current.error("Error al cargar proveedores", mensajeError(prov.reason, "No se pudo cargar el catálogo"));
    if (uni.status === "fulfilled") setUnidades(uni.value);
    else console.warn("No se pudieron cargar las unidades de medida:", uni.reason);
  }, []);

  useEffect(() => {
    cargarFacturas();
    cargarCatalogos();
  }, [cargarFacturas, cargarCatalogos]);

  /** Total del documento = suma de sus lineas (la base de datos lo recalcula igual). */
  const montoTotalForm = useMemo(
    () => Math.round((form.detalles || []).reduce((acc, l) => acc + l.subtotal, 0) * 100) / 100,
    [form.detalles]
  );

  /** Actualiza campos del formulario principal. */
  const onChangeForm = useCallback(
    (campo: keyof CrearFacturaProveedorInput, valor: any) => {
      setFormErrors((prev) => ({ ...prev, [campo]: undefined }));
      setForm((prev) => {
        const next = { ...prev, [campo]: campo === "idProveedor" ? Number(valor) || 0 : valor };
        if (campo === "idProveedor") {
          // La factura de referencia debe ser del mismo proveedor.
          next.idFacturaReferencia = null;
          // Vencimiento sugerido segun los dias de credito del proveedor.
          const proveedor = proveedores.find((p) => p.idProveedor === Number(valor));
          if (proveedor && proveedor.diasCredito > 0 && !esNota(prev.tipoDocumento) && prev.fechaEmision) {
            next.fechaVencimiento = sumarDias(prev.fechaEmision, proveedor.diasCredito);
          }
        }
        if (campo === "tipoDocumento") {
          next.idFacturaReferencia = null;
          // Las notas no tienen vencimiento propio (no se pagan).
          if (esNota(valor)) next.fechaVencimiento = "";
          else if (!prev.fechaVencimiento) next.fechaVencimiento = sumarDias(prev.fechaEmision || todayISO(), 30);
        }
        if (campo === "idFacturaReferencia") {
          next.idFacturaReferencia = valor ? Number(valor) : null;
        }
        return next;
      });
    },
    [proveedores]
  );

  /** Agrega una línea al detalle del formulario de creación (valida como la base de datos). */
  const agregarLineaDetalle = useCallback(() => {
    const cant = Number(lineaForm.cantidad);
    const pu = Number(lineaForm.precioUnitario);
    if (!lineaForm.descripcion.trim()) return setLineaError("La descripción es obligatoria");
    if (!(cant > 0)) return setLineaError("La cantidad debe ser mayor a cero");
    if (!(pu > 0)) return setLineaError("El precio unitario debe ser mayor a cero");
    if (!lineaForm.idUnidadMedida) return setLineaError("Selecciona la unidad de medida");

    const nuevaLinea: LineaDetalleInput = {
      idArticulo: lineaForm.idArticulo ? Number(lineaForm.idArticulo) : null,
      descripcion: lineaForm.descripcion.trim(),
      cantidad: cant,
      precioUnitario: pu,
      idUnidadMedida: Number(lineaForm.idUnidadMedida),
      subtotal: Math.round(cant * pu * 100) / 100,
    };

    setForm((prev) => ({ ...prev, detalles: [...(prev.detalles || []), nuevaLinea] }));
    setFormErrors((prev) => ({ ...prev, detalles: undefined }));
    setLineaError(null);
    // Conserva la unidad elegida para la siguiente linea.
    setLineaForm({ ...lineaInicial, idUnidadMedida: lineaForm.idUnidadMedida });
  }, [lineaForm]);

  /** Quitar línea de detalle del formulario de creación. */
  const eliminarLineaDetalle = useCallback((index: number) => {
    setForm((prev) => ({ ...prev, detalles: (prev.detalles || []).filter((_, i) => i !== index) }));
  }, []);

  /** Reinicia el formulario de creación y la línea temporal de detalle. */
  const resetForm = useCallback(() => {
    setForm(crearFormInicial());
    setFormErrors({});
    setLineaForm(lineaInicial);
    setLineaError(null);
  }, []);

  /** Abrir modal de vista de detalle completo. */
  const verDetalleFactura = useCallback(async (item: FacturaProveedor) => {
    setViewingItem(item);
    setLoadingDetails(true);
    try {
      const fullData = await getFacturaProveedor(item.idFacturaProveedor);
      setViewingItem(fullData);
    } catch (err: any) {
      toastRef.current.error("Error al cargar detalle", mensajeError(err, "No se pudo cargar el detalle de la factura"));
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const cerrarDetalleFactura = useCallback(() => {
    setViewingItem(null);
  }, []);

  /** Edición (solo encabezado) */
  const abrirEdicion = useCallback((item: FacturaProveedor) => {
    const fecha = (v: string | null) => (v ? formatDate(v) : "");
    setEditErrors({});
    setEditingItem(item);
    setEditForm({
      idProveedor: item.idProveedor,
      numeroDte: item.numeroDte || "",
      serieDte: item.serieDte || "",
      fechaEmision: fecha(item.fechaEmision),
      fechaDocumento: fecha(item.fechaDocumento),
      fechaVencimiento: fecha(item.fechaVencimiento),
      idFacturaReferencia: item.idFacturaReferencia,
    });
  }, []);

  const cerrarEdicion = useCallback(() => {
    setEditingItem(null);
  }, []);

  const onChangeEditForm = useCallback(
    (campo: keyof ActualizarFacturaProveedorInput, valor: any) => {
      setEditErrors((prev) => ({ ...prev, [campo]: undefined }));
      setEditForm((prev) => {
        const next = { ...prev, [campo]: valor };
        if (campo === "idProveedor") {
          next.idProveedor = Number(valor) || 0;
          next.idFacturaReferencia = null;
        }
        if (campo === "idFacturaReferencia") next.idFacturaReferencia = valor ? Number(valor) : null;
        return next;
      });
    },
    []
  );

  /** Enviar registro (encabezado + lineas en una sola transaccion). Devuelve si tuvo exito. */
  const registrarFactura = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      e?.preventDefault();
      const errores = validarCabecera(form, form.tipoDocumento);
      if (!form.detalles || form.detalles.length === 0) {
        errores.detalles = "Agrega al menos una línea de detalle";
      }
      setFormErrors(errores);
      if (Object.keys(errores).length > 0) {
        toastRef.current.warning("Campos incompletos", "Revisa los campos señalados.");
        return false;
      }

      setSaving(true);
      setError(null);
      try {
        await apiCrearFactura(form);
        resetForm();
        toastRef.current.success("Documento registrado", "La factura de proveedor se registró exitosamente.");
        await cargarFacturas();
        return true;
      } catch (err: any) {
        const msg = mensajeError(err, "Error al registrar factura de proveedor");
        setError(msg);
        toastRef.current.error("Error al registrar", msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [form, cargarFacturas, resetForm]
  );

  /** Guardar edición. Devuelve si tuvo exito. */
  const guardarEdicion = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      e?.preventDefault();
      if (!editingItem) return false;
      const errores = validarCabecera(editForm, editingItem.tipoDocumento);
      setEditErrors(errores);
      if (Object.keys(errores).length > 0) {
        toastRef.current.warning("Campos incompletos", "Revisa los campos señalados.");
        return false;
      }

      setSaving(true);
      setError(null);
      try {
        await apiActualizarFactura(editingItem.idFacturaProveedor, editForm);
        setEditingItem(null);
        toastRef.current.success("Documento actualizado");
        await cargarFacturas();
        return true;
      } catch (err: any) {
        const msg = mensajeError(err, "Error al actualizar factura de proveedor");
        setError(msg);
        toastRef.current.error("Error al actualizar", msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [editingItem, editForm, cargarFacturas]
  );

  /**
   * Anula el documento con un motivo escrito (queda en NOTAS). La confirmación y
   * el motivo se piden en la UI, igual que en Caja Chica Movimiento.
   */
  const anularFactura = useCallback(
    async (id: number, motivo: string): Promise<boolean> => {
      setError(null);
      try {
        await apiAnularFactura(id, motivo.trim());
        toastRef.current.success("Documento anulado");
        await cargarFacturas();
        return true;
      } catch (err: any) {
        const msg = mensajeError(err, "Error al anular factura de proveedor");
        setError(msg);
        toastRef.current.error("Error al anular", msg);
        return false;
      }
    },
    [cargarFacturas]
  );

  return {
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
    error,
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
  };
}
