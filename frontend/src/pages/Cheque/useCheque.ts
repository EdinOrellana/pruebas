import { useCallback, useEffect, useState } from "react";
import {
  getCheques,
  crearCheque as apiCrearCheque,
  cobrarCheque as apiCobrarCheque,
  anularCheque as apiAnularCheque,
} from "./cheque.api";
import { getContrasenasPago } from "../ContrasenaPago/contrasenaPago.api";
import type { ContrasenaPago } from "../ContrasenaPago/contrasenaPago.types";
import { getFacturasProveedor } from "../FacturaProveedor/facturaProveedor.api";
import type { FacturaProveedor } from "../FacturaProveedor/facturaProveedor.types";
import { todayISO } from "../../utils/format";
import type { Cheque, CrearChequeInput } from "./cheque.types";

const formInicial: CrearChequeInput = {
  idContrasenaPago: 0,
  banco: "",
  numeroCheque: "",
  fechaEmision: new Date().toISOString().split("T")[0],
};

export function useCheque() {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [contrasenas, setContrasenas] = useState<ContrasenaPago[]>([]);
  const [facturas, setFacturas] = useState<FacturaProveedor[]>([]);
  const [form, setForm] = useState<CrearChequeInput>(formInicial);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaEmisionError, setFechaEmisionError] = useState<string | null>(null);

  const cargarCheques = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCheques();
      setCheques(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Error al cargar cheques");
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarContrasenas = useCallback(async () => {
    try {
      const data = await getContrasenasPago();
      // Solo se puede emitir un cheque contra una contraseña PENDIENTE de tipo CHEQUE
      // (al emitirlo pasa a EMITIDA). EMITIDA, PAGADA o ANULADA quedan bloqueadas
      // para no duplicar pagos; lo mismo valida PKG_CP_CONTRASENA_PAGO.SP_EMITIR_PAGO.
      setContrasenas(
        data.filter((c) => c.formaPago === "CHEQUE" && c.estado === "PENDIENTE")
      );
    } catch (err) {
      console.warn("No se pudieron cargar contraseñas para el selector de cheques:", err);
    }
  }, []);

  /** Facturas de proveedor, usadas para mostrar el saldo pendiente real en el selector de contraseñas. */
  const cargarFacturas = useCallback(async () => {
    try {
      const data = await getFacturasProveedor();
      setFacturas(data);
    } catch (err) {
      console.warn("No se pudieron cargar facturas para el selector de cheques:", err);
    }
  }, []);

  useEffect(() => {
    cargarCheques();
    cargarContrasenas();
    cargarFacturas();
  }, [cargarCheques, cargarContrasenas, cargarFacturas]);

  const onChangeForm = useCallback(
    (campo: keyof CrearChequeInput, valor: string) => {
      if (campo === "fechaEmision") {
        setFechaEmisionError(null);
      }
      setForm((prev) => ({
        ...prev,
        [campo]: campo === "idContrasenaPago" ? Number(valor) : valor,
      }));
    },
    []
  );


  /** Envia el formulario para crear un cheque y recarga la lista. Devuelve si tuvo exito. */
  const registrarCheque = useCallback(
    async (e?: React.FormEvent): Promise<boolean> => {
      e?.preventDefault();

      if (form.fechaEmision > todayISO()) {
        setFechaEmisionError("La fecha de emision no puede ser futura");
        return false;
      }

      setSaving(true);
      setError(null);
      try {
        await apiCrearCheque(form);
        setForm(formInicial);
        // Emitir/cobrar/anular tambien cambia la contraseña y el saldo de la factura.
        await Promise.all([cargarCheques(), cargarContrasenas(), cargarFacturas()]);
        return true;
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Error al registrar cheque");
        return false;
      } finally {
        setSaving(false);
      }
    },
    [form, cargarCheques, cargarContrasenas, cargarFacturas]
  );

  /** Marca un cheque como COBRADO (solo si estaba EMITIDO) y recarga la lista. Devuelve si tuvo exito. */
  const cobrarCheque = useCallback(
    async (id: number, fechaCobro: string): Promise<boolean> => {
      setCobrando(true);
      setError(null);
      try {
        await apiCobrarCheque(id, fechaCobro);
        // Emitir/cobrar/anular tambien cambia la contraseña y el saldo de la factura.
        await Promise.all([cargarCheques(), cargarContrasenas(), cargarFacturas()]);
        return true;
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Error al cobrar cheque");
        return false;
      } finally {
        setCobrando(false);
      }
    },
    [cargarCheques, cargarContrasenas, cargarFacturas]
  );

  /**
   * Anula un cheque (no borra fisico) y recarga la lista. Devuelve si tuvo exito.
   * La confirmacion del usuario se pide en la UI (ConfirmDialog) antes de llamar esto.
   */
  const anularCheque = useCallback(
    async (id: number): Promise<boolean> => {
      setError(null);
      try {
        await apiAnularCheque(id);
        // Emitir/cobrar/anular tambien cambia la contraseña y el saldo de la factura.
        await Promise.all([cargarCheques(), cargarContrasenas(), cargarFacturas()]);
        return true;
      } catch (err: any) {
        setError(err?.response?.data?.message ?? "Error al anular cheque");
        return false;
      }
    },
    [cargarCheques, cargarContrasenas, cargarFacturas]
  );

  return {
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
  };
}
