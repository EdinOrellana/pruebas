import { Router } from 'express';
import { CajaChicaMovimientoHandler } from '../handlers/cajaChicaMovimiento.handler';

const router = Router();

router.get('/tipos', CajaChicaMovimientoHandler.getTiposMovimiento);
router.get('/cajas', CajaChicaMovimientoHandler.getCajasDisponibles);
router.get('/:idCaja/estado', CajaChicaMovimientoHandler.getEstado);
router.get('/:idCaja', CajaChicaMovimientoHandler.getMovimientos);
router.get('/', CajaChicaMovimientoHandler.getMovimientos);
router.post('/:idCaja', CajaChicaMovimientoHandler.registrarMovimiento);
router.post('/', CajaChicaMovimientoHandler.registrarMovimiento);
router.put('/movimiento/:id/anular', CajaChicaMovimientoHandler.anularMovimiento);
router.put('/:id/anular', CajaChicaMovimientoHandler.anularMovimiento);

export default router;