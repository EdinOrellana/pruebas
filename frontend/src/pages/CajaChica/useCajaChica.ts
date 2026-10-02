import { useCallback, useEffect, useRef, useState } from "react";
import {
  getCajasChicas,
  getCatalogosCajaChica,
  inactivarCajaChica as apiInactivarCaja,
  crearCajaChica as apiCrearCaja,
  actualizarCajaChica as apiActualizarCaja,
} from "./cajaChica.api";
import { useToast } from "../../components/common/Toast";
import type {
  CajaChica,
  CatalogoItem,
  CrearCajaChicaInput,
  ActualizarCajaChicaInput,
} from "./cajaChica.types";

const formCajaInicial: CrearCajaChicaInput = {
  idSucursal: "",
  idEmpleadoResponsable: "",
  fondoAsignado: "",
};

export function useCajaChica() {
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [cajas, setCajas] = useState<CajaChica[]>([]);
  const [sucursales, setSucursales] = useState<CatalogoItem[]>([]);
  const [empleados, setEmpleados] = useState<CatalogoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Errores de validación inline
  const [formErrors, setFormErrors] = useState<{
    idSucursal?: string;
    idEmpleadoResponsable?: string;
    fondoAsignado?: string;
  }>({});

  const [formEditarErrors, setFormEditarErrors] = useState<{
    idEmpleadoResponsable?: string;
    fondoAsignado?: string;
  }>({});

  // Modal Crear Nueva Caja
  const [modalNuevaCaja, setModalNuevaCaja] = useState(false);
  const [formCaja, setFormCaja] = useState<CrearCajaChicaInput>(formCajaInicial);

  // Modal Editar Caja
  const [modalEditarCaja, setModalEditarCaja] = useState(false);
  const [cajaEditando, setCajaEditando] = useState<CajaChica | null>(null);
  const [formEditar, setFormEditar] = useState<ActualizarCajaChicaInput>({
    idEmpleadoResponsable: "",
    fondoAsignado: "",
    estado: "A",
  });

  /** Carga la lista de Cajas Chicas */
  const cargarCajas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCajasChicas();
      setCajas(data);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Error al cargar cajas chicas. Verifique la conexión al servidor.";
      setError(msg);
      toastRef.current.error("Error al cargar datos", msg);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Carga los catálogos para los selects */
  const cargarCatalogos = useCallback(async () => {
    try {
      const cat = await getCatalogosCajaChica();
      setSucursales(cat.sucursales);
      setEmpleados(cat.empleados);
    } catch (err: any) {
      console.warn("No se pudieron cargar catálogos:", err);
    }
  }, []);

  useEffect(() => {
    cargarCajas();
    cargarCatalogos();
  }, [cargarCajas, cargarCatalogos]);

  /** Valida el formulario de creación */
  const validarFormCaja = () => {
    const errs: typeof formErrors = {};
    if (!formCaja.idSucursal) {
      errs.idSucursal = "Debes seleccionar una sucursal.";
    }
    if (!formCaja.idEmpleadoResponsable) {
      errs.idEmpleadoResponsable = "Debes asignar un custodio responsable.";
    }
    if (formCaja.fondoAsignado === "" || Number(formCaja.fondoAsignado) <= 0) {
      errs.fondoAsignado = "El monto debe ser un número mayor a 0 (ej. 1500.00).";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /** Valida el formulario de edición */
  const validarFormEditar = () => {
    const errs: typeof formEditarErrors = {};
    if (!formEditar.idEmpleadoResponsable) {
      errs.idEmpleadoResponsable = "Debes asignar un custodio responsable.";
    }
    if (formEditar.fondoAsignado === "" || Number(formEditar.fondoAsignado) <= 0) {
      errs.fondoAsignado = "El fondo fijo debe ser mayor a 0.";
    }
    setFormEditarErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /** Actualiza un campo del formulario de creación */
  const onChangeFormCaja = useCallback(
    (campo: keyof CrearCajaChicaInput, valor: string | number) => {
      setFormCaja((prev) => {
        const numVal = valor === "" ? "" : Number(valor);
        const next = {
          ...prev,
          [campo]: numVal,
        };
        // Si el usuario cambia de sucursal, reiniciar el custodio seleccionado
        if (campo === "idSucursal" && numVal !== prev.idSucursal) {
          next.idEmpleadoResponsable = "";
        }
        return next;
      });
      // Limpiar error del campo
      setFormErrors((prev) => ({ ...prev, [campo]: undefined }));
    },
    []
  );

  /** Guarda una nueva caja chica */
  const registrarCaja = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!validarFormCaja()) {
        toast.warning("Campos incompletos", "Por favor revisa los campos señalados.");
        return;
      }
      setSaving(true);
      setError(null);
      try {
        await apiCrearCaja(formCaja);
        toast.success(
          "Caja Chica Creada",
          "El fondo fijo de caja chica se registró exitosamente."
        );
        setFormCaja(formCajaInicial);
        setModalNuevaCaja(false);
        setFormErrors({});
        await cargarCajas();
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? "Error al registrar caja chica";
        setError(msg);
        toast.error("Error al registrar", msg);
      } finally {
        setSaving(false);
      }
    },
    [formCaja, cargarCajas, toast]
  );

  /** Abre el modal de edición */
  const abrirEdicion = useCallback((caja: CajaChica) => {
    setCajaEditando(caja);
    setFormEditar({
      idEmpleadoResponsable: caja.idEmpleadoResponsable,
      fondoAsignado: caja.fondoAsignado,
      estado: caja.estado,
    });
    setFormEditarErrors({});
    setError(null);
    setModalEditarCaja(true);
  }, []);

  /** Actualiza un campo del formulario de edición */
  const onChangeFormEditar = useCallback(
    (campo: keyof ActualizarCajaChicaInput, valor: any) => {
      setFormEditar((prev) => ({
        ...prev,
        [campo]: campo === "fondoAsignado" || campo === "idEmpleadoResponsable"
          ? (valor === "" ? "" : Number(valor))
          : valor,
      }));
      setFormEditarErrors((prev) => ({ ...prev, [campo]: undefined }));
    },
    []
  );

  /** Guarda los cambios de la caja chica editada */
  const guardarEdicion = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      if (!cajaEditando) return;
      if (!validarFormEditar()) {
        toast.warning("Campos incompletos", "Por favor revisa los valores a actualizar.");
        return;
      }
      setSaving(true);
      setError(null);
      try {
        await apiActualizarCaja(cajaEditando.idCajaChica, formEditar);
        toast.success(
          "Cambios Guardados",
          `La caja chica #${cajaEditando.idCajaChica} fue actualizada correctamente.`
        );
        setModalEditarCaja(false);
        setCajaEditando(null);
        setFormEditarErrors({});
        await cargarCajas();
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? "Error al actualizar caja chica";
        setError(msg);
        toast.error("Error al actualizar", msg);
      } finally {
        setSaving(false);
      }
    },
    [cajaEditando, formEditar, cargarCajas, toast]
  );

  /** Inactiva una caja chica (baja lógica) */
  const inactivarCaja = useCallback(
    async (id: number) => {
      const ok = window.confirm(
        `¿Confirmas la baja lógica de la caja chica #${id}?\nEsta acción cambiará su estado a INACTIVA y la archivará.`
      );
      if (!ok) return;
      setError(null);
      try {
        await apiInactivarCaja(id);
        toast.warning("Caja Inactivada", `La caja chica #${id} se dio de baja lógicamente.`);
        await cargarCajas();
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? "Error al inactivar caja chica";
        setError(msg);
        toast.error("Error de inactivación", msg);
      }
    },
    [cargarCajas, toast]
  );

  return {
    cajas,
    sucursales,
    empleados,
    loading,
    saving,
    error,
    setError,
    formErrors,
    formEditarErrors,
    // Crear
    modalNuevaCaja,
    setModalNuevaCaja,
    formCaja,
    onChangeFormCaja,
    registrarCaja,
    // Editar
    modalEditarCaja,
    setModalEditarCaja,
    cajaEditando,
    formEditar,
    abrirEdicion,
    onChangeFormEditar,
    guardarEdicion,
    // Otros
    inactivarCaja,
    cargarCajas,
  };
}
