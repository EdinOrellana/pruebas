import { useState, useEffect, useCallback, FormEvent } from 'react';
import type {
  EstadoCajaChica,
  CajaChicaMovimientoItem,
  TipoMovimientoItem,
  CajaChicaInfo,
} from './cajaChicaMovimiento.types';
import {
  getEstadoCaja,
  getMovimientosCaja,
  getTiposMovimientoDB,
  getCajasDisponiblesDB,
  registrarMovimientoCaja,
  anularMovimientoCaja,
} from './cajaChicaMovimiento.api';

import type { ToastType } from '../../components/common';

export type ModalType = 'CREAR' | 'ANULAR' | null;

export interface ModalState {
  type: ModalType;
  item?: CajaChicaMovimientoItem | null;
}

export interface ToastState {
  type: ToastType;
  title: string;
  message: string;
}

export function useCajaChicaMovimiento(idCajaChica?: number) {
  const [estado, setEstado] = useState<EstadoCajaChica | null>(null);
  const [movimientos, setMovimientos] = useState<CajaChicaMovimientoItem[]>([]);
  const [tiposMovimiento, setTiposMovimiento] = useState<TipoMovimientoItem[]>([]);
  const [cajasDisponibles, setCajasDisponibles] = useState<CajaChicaInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((type: ToastType, title: string, message: string) => {
    setToast({ type, title, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  // Object-based Modal State
  const [activeModal, setActiveModal] = useState<ModalState>({ type: null, item: null });

  const openModal = (type: ModalType, item: CajaChicaMovimientoItem | null = null) => {
    setActiveModal({ type, item });
    setErrorMsg(null);
  };

  const closeModal = () => {
    setActiveModal({ type: null, item: null });
    setErrorMsg(null);
  };

  // Pagination State
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [limitePorPagina, setLimitePorPagina] = useState<number>(10);
  const [totalRegistros, setTotalRegistros] = useState<number>(0);

  // Form State
  const [cajaSeleccionada, setCajaSeleccionada] = useState<number>(idCajaChica || 1);
  const [tipoMovimiento, setTipoMovimiento] = useState<string>('GASTO');
  const [concepto, setConcepto] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [numeroComprobante, setNumeroComprobante] = useState<string>('');

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const [dataEstado, dataMovs, dataTipos, dataCajas] = await Promise.allSettled([
        getEstadoCaja(idCajaChica || 1),
        getMovimientosCaja(idCajaChica),
        getTiposMovimientoDB(),
        getCajasDisponiblesDB(),
      ]);

      if (dataEstado.status === 'fulfilled' && dataEstado.value) {
        setEstado(dataEstado.value);
      }

      if (dataMovs.status === 'fulfilled' && dataMovs.value) {
        setMovimientos(dataMovs.value.movimientos || []);
        setTotalRegistros((dataMovs.value.movimientos || []).length);
      } else {
        setMovimientos([]);
        setTotalRegistros(0);
      }

      if (dataTipos.status === 'fulfilled' && Array.isArray(dataTipos.value) && dataTipos.value.length > 0) {
        setTiposMovimiento(dataTipos.value);
        setTipoMovimiento((prev) => prev || dataTipos.value[0].codigo);
      }

      if (dataCajas.status === 'fulfilled' && Array.isArray(dataCajas.value) && dataCajas.value.length > 0) {
        setCajasDisponibles(dataCajas.value);
        setCajaSeleccionada(idCajaChica || dataCajas.value[0]?.idCajaChica || 1);
      }
    } catch (error: any) {
      console.error('Error al cargar movimientos:', error);
      const msg = error?.message || 'Error al conectar con la base de datos Oracle';
      setErrorMsg(msg);
      showToast('error', 'Error de Conexión', msg);
    } finally {
      setLoading(false);
    }
  }, [idCajaChica, showToast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const registrar = async (e: FormEvent<HTMLFormElement>): Promise<boolean> => {
    e.preventDefault();

    if (!concepto.trim() || !monto || Number(monto) <= 0 || !numeroComprobante.trim()) {
      return false;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const cajaDestino = Number(cajaSeleccionada) || idCajaChica || 1;

      const response = await registrarMovimientoCaja(cajaDestino, {
        idCajaChica: cajaDestino,
        tipoMovimiento: tipoMovimiento.trim(),
        concepto: concepto.trim(),
        monto: Number(monto),
        numeroComprobante: numeroComprobante.trim() || undefined,
      });

      setConcepto('');
      setMonto('');
      setNumeroComprobante('');
      closeModal();
      await cargarDatos();

      showToast(
        'success',
        '¡Movimiento Registrado!',
        response.message || `Movimiento de ${tipoMovimiento.toLowerCase()} registrado con éxito en Oracle.`
      );
      return true;
    } catch (error: any) {
      console.error('Error al registrar movimiento:', error);
      const msg = error?.response?.data?.error || error?.message || 'Error al registrar movimiento en Oracle.';
      setErrorMsg(msg);
      showToast('error', 'Error al Registrar', msg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const anular = async (idMovimientoCaja: number, motivo: string): Promise<boolean> => {
    if (!idMovimientoCaja || !motivo.trim()) return false;

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const response = await anularMovimientoCaja(idMovimientoCaja, motivo.trim());
      closeModal();
      await cargarDatos();

      showToast(
        'success',
        '¡Movimiento Anulado!',
        response.message || `El movimiento #${idMovimientoCaja} ha sido anulado correctamente.`
      );
      return true;
    } catch (error: any) {
      console.error('Error al anular movimiento:', error);
      const msg = error?.response?.data?.error || error?.message || 'Error al anular el movimiento en Oracle.';
      setErrorMsg(msg);
      showToast('error', 'Error de Anulación', msg);
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    estado,
    movimientos,
    tiposMovimiento,
    cajasDisponibles,
    loading,
    submitting,
    errorMsg,
    toast,
    dismissToast,
    modal: {
      activeModal,
      openModal,
      closeModal,
    },
    pagination: {
      paginaActual,
      setPaginaActual,
      limitePorPagina,
      setLimitePorPagina: (nuevoLimite: number) => {
        setLimitePorPagina(nuevoLimite);
        setPaginaActual(1);
      },
      totalRegistros,
      totalPaginas: Math.ceil((totalRegistros || 0) / limitePorPagina) || 1,
    },
    form: {
      cajaSeleccionada,
      setCajaSeleccionada,
      tipoMovimiento,
      setTipoMovimiento,
      concepto,
      setConcepto,
      monto,
      setMonto,
      numeroComprobante,
      setNumeroComprobante,
      registrar,
    },
    anular,
    cargarDatos,
  };
}