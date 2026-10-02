import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getContrasenasPago,
  crearContrasenaPago as apiCrearContrasena,
  actualizarContrasenaPago as apiActualizarContrasena,
  anularContrasenaPago as apiAnularContrasena,
  registrarPagoContrasena as apiRegistrarPago,
  getEmpleadosAutorizan,
} from "./contrasenaPago.api";
import { getFacturasProveedor } from "../FacturaProveedor/facturaProveedor.api";
import type { FacturaProveedor } from "../FacturaProveedor/facturaProveedor.types";
import { useToast } from "../../components/common/Toast";
import { fmt, todayISO } from "../../utils/format";
import type {
  ContrasenaPago,
  CrearContrasenaPagoInput,
  ActualizarContrasenaPagoInput,
  EmpleadoAutoriza,
} from "./contrasenaPago.types";

/** Formulario vacio; se genera al momento para que la fecha sea la de hoy (hora local). */
const crearFormInicial = (): CrearContrasenaPagoInput => ({
  idFacturaProveedor: 0,
  fecha: todayISO(),
  formaPago: "CHEQUE",
  monto: 0,
  idEmpleadoAutoriza: null,
});

/** Devuelve el mensaje de error del monto, o null si es valido. */
function validarMonto(monto: number, disponible: number | null): string | null {
  if (!monto || monto <= 0) return "El monto debe ser mayor a cero";
  if (disponible != null && monto > disponible) {
    return `El monto excede lo disponible de la factura (${fmt(disponible)})`;
  }
  return null;
}

/** Extrae el mensaje de error que devuelve el backend. */
function mensajeError(err: any, porDefecto: string): string {
  return err?.response?.data?.details ?? err?.response?.data?.message ?? porDefecto;
}

export function useContrasenaPago() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const [contrasenas, setContrasenas] = useState<ContrasenaPago[]>([]);
  const [facturas, setFacturas] = useState<FacturaProveedor[]>([]);
  const [empleados, setEmpleados] = useState<EmpleadoAutoriza[]>([]);
  const [form, setForm] = useState<CrearContrasenaPagoInput>(crearFormInicial);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Error de validacion del monto (crear / editar), mostrado bajo el campo. */
  const [montoError, setMontoError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<ContrasenaPago | null>(null);
  const [editForm, setEditForm] = useState<ActualizarContrasenaPagoInput>({
    formaPago: "CHEQUE",
    monto: 0,
    idEmpleadoAutoriza: null,
  });

  const cargarContrasenas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getContrasenasPago();
      setContrasenas(data);
    } catch (err: any) {
      const msg = mensajeError(err, "Error al cargar contraseñas de pago");
      setError(msg);
      toastRef.current.error("Error al cargar datos", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarFacturas = useCallback(async () => {
    try {
      const data = await getFacturasProveedor();
      setFacturas(data);
    } catch (err) {
      console.warn("No se pudieron cargar facturas para el selector:", err);
    }
  }, []);

  const cargarEmpleados = useCallback(async () => {
    try {
      const data = await getEmpleadosAutorizan();
      setEmpleados(data);
    } catch (err) {
      console.warn("No se pudieron cargar empleados para el selector:", err);
    }
  }, []);

  useEffect(() => {
    cargarContrasenas();
    cargarFacturas();
    cargarEmpleados();
  }, [cargarContrasenas, cargarFacturas, cargarEmpleados]);

  /** Recarga contraseñas y facturas (las acciones de pago cambian el saldo de la factura). */
  const recargarTodo = useCallback(async () => {
    await Promise.all([cargarContrasenas(), cargarFacturas()]);
  }, [cargarContrasenas, cargarFacturas]);

  /**
   * Monto disponible para contraseñas de una factura: saldo pendiente menos lo
   * comprometido en otras contraseñas PENDIENTES (las EMITIDAS/PAGADAS ya estan
   * descontadas del saldo). Misma regla que PKG_CP_CONTRASENA_PAGO.VALIDAR_MONTO.
   */
  const montoDisponible = useCallback(
    (idFactura: number, excluirContrasena?: number): number | null => {
      const factura = facturas.find((f) => f.idFacturaProveedor === idFactura);
      if (!factura) return null;
      const comprometido = contrasenas
        .filter(
          (c) =>
            c.idFacturaProveedor === idFactura &&
            c.estado === "PENDIENTE" &&
            c.idContrasena !== excluirContrasena
        )
        .reduce((acc, c) => acc + (c.monto || 0), 0);
      return Math.max(0, Math.round((factura.saldoPendiente - comprometido) * 100) / 100);
    },
    [facturas, contrasenas]
  );

  /** Disponible de la factura seleccionada en el formulario de creacion. */
  const disponibleForm = useMemo(
    () => (form.idFacturaProveedor ? montoDisponible(form.idFacturaProveedor) : null),
    [form.idFacturaProveedor, montoDisponible]
  );

  /** Disponible de la factura de la contraseña en edicion (excluyendola a ella misma). */
  const disponibleEdicion = useMemo(
    () =>
      editingItem ? montoDisponible(editingItem.idFacturaProveedor, editingItem.idContrasena) : null,
    [editingItem, montoDisponible]
  );

  const onChangeForm = useCallback(
    (campo: keyof CrearContrasenaPagoInput, valor: any) => {
      if (campo === "monto" || campo === "idFacturaProveedor") setMontoError(null);
      setForm((prev) => {
        let nuevoMonto = prev.monto;
        if (campo === "idFacturaProveedor") {
          const disponible = montoDisponible(Number(valor));
          if (disponible != null) {
            nuevoMonto = disponible;
          }
        }
        return {
          ...prev,
          [campo]:
            campo === "idFacturaProveedor" || campo === "monto"
              ? Math.max(0, Number(valor) || 0)
              : campo === "idEmpleadoAutoriza"
              ? valor ? Math.max(0, Number(valor)) : null
              : valor,
          monto: campo === "idFacturaProveedor" ? nuevoMonto : campo === "monto" ? Math.max(0, Number(valor) || 0) : prev.monto,
        };
      });
    },
    [montoDisponible]
  );

  const onChangeEditForm = useCallback(
    (campo: keyof ActualizarContrasenaPagoInput, valor: any) => {
      if (campo === "monto") setMontoError(null);
      setEditForm((prev) => ({
        ...prev,
        [campo]:
          campo === "monto"
            ? Math.max(0, Number(valor) || 0)
            : campo === "idEmpleadoAutoriza"
            ? valor ? Math.max(0, Number(valor)) : null
            : valor,
      }));
    },
    []
  );

  /** Reinicia el formulario de creacion (fecha de hoy, sin factura seleccionada). */
  const resetForm = useCallback(() => {
    setForm(crearFormInicial());
    setMontoError(null);
  }, []);

  const abrirEdicion = useCallback((item: ContrasenaPago) => {
    setMontoError(null);
    setEditingItem(item);
    setEditForm({
      formaPago: item.formaPago,
      monto: item.monto,
      idEmpleadoAutoriza: item.idEmpleadoAutoriza,
    });
  }, []);

  const cerrarEdicion = useCallback(() => {
    setEditingItem(null);
  }, []);

  /** Crea la contraseña de pago y recarga la lista. Devuelve si tuvo exito. */
  const registrarContrasena = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      e?.preventDefault();
      if (!form.idFacturaProveedor) {
        toastRef.current.warning("Campos incompletos", "Selecciona la factura de proveedor a pagar.");
        return false;
      }
      const errorMonto = validarMonto(form.monto, disponibleForm);
      if (errorMonto) {
        setMontoError(errorMonto);
        return false;
      }
      setSaving(true);
      setError(null);
      try {
        await apiCrearContrasena(form);
        setForm(crearFormInicial());
        toastRef.current.success("Contraseña de pago registrada", "La contraseña se generó exitosamente.");
        await recargarTodo();
        return true;
      } catch (err: any) {
        const msg = mensajeError(err, "Error al registrar contraseña de pago");
        setError(msg);
        toastRef.current.error("Error al registrar", msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [form, disponibleForm, recargarTodo]
  );

  /** Guarda los cambios de la contraseña en edicion. Devuelve si tuvo exito. */
  const guardarEdicion = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      e?.preventDefault();
      if (!editingItem) return false;
      const errorMonto = validarMonto(editForm.monto, disponibleEdicion);
      if (errorMonto) {
        setMontoError(errorMonto);
        return false;
      }
      setSaving(true);
      setError(null);
      try {
        await apiActualizarContrasena(editingItem.idContrasena, editForm);
        setEditingItem(null);
        toastRef.current.success("Contraseña de pago actualizada");
        await recargarTodo();
        return true;
      } catch (err: any) {
        const msg = mensajeError(err, "Error al actualizar contraseña de pago");
        setError(msg);
        toastRef.current.error("Error al actualizar", msg);
        return false;
      } finally {
        setSaving(false);
      }
    },
    [editingItem, editForm, disponibleEdicion, recargarTodo]
  );

  /**
   * Anula la contraseña con un motivo escrito (queda en NOTAS). La confirmación y
   * el motivo se piden en la UI, igual que en Caja Chica Movimiento.
   */
  const anularContrasena = useCallback(
    async (id: number, motivo: string): Promise<boolean> => {
      setError(null);
      try {
        await apiAnularContrasena(id, motivo.trim());
        toastRef.current.success("Contraseña de pago anulada");
        await recargarTodo();
        return true;
      } catch (err: any) {
        const msg = mensajeError(err, "Error al anular contraseña de pago");
        setError(msg);
        toastRef.current.error("Error al anular", msg);
        return false;
      }
    },
    [recargarTodo]
  );

  /**
   * Registra el pago directo de una contraseña TRANSFERENCIA / EFECTIVO:
   * PENDIENTE -> PAGADA y descuenta el saldo de la factura. Devuelve si tuvo exito.
   */
  const registrarPago = useCallback(
    async (id: number): Promise<boolean> => {
      setError(null);
      try {
        await apiRegistrarPago(id);
        toastRef.current.success("Pago registrado", "La contraseña quedó PAGADA y se actualizó el saldo de la factura.");
        await recargarTodo();
        return true;
      } catch (err: any) {
        const msg = mensajeError(err, "Error al registrar el pago");
        setError(msg);
        toastRef.current.error("Error al registrar pago", msg);
        return false;
      }
    },
    [recargarTodo]
  );

  return {
    contrasenas,
    facturas,
    empleados,
    form,
    editForm,
    editingItem,
    loading,
    saving,
    error,
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
    cargarContrasenas: recargarTodo,
  };
}
