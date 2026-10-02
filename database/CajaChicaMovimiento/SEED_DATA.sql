-- ============================================================================
-- DATOS DE PRUEBA: Movimientos de Caja Chica (CP_CAJA_CHICA_MOVIMIENTO)
-- Requiere: database/CajaChica/SEED_DATA.sql ya ejecutado (usa las cajas de
-- SUC-001, SUC-002 y SUC-003 creadas ahi).
-- NO idempotente: cada corrida crea movimientos nuevos.
--
-- Usa el paquete CP_PKG_CAJA_CHICA_MOVIMIENTO.INSERTAR en vez de INSERT
-- directo para que respete la validacion de saldo disponible (un GASTO no
-- puede superar fondo + reposiciones - gastos previos).
-- ============================================================================

DECLARE
    v_id_mov      NUMBER;
    v_id_caja_1   CP_CAJA_CHICA.ID_CAJA_CHICA%TYPE;
    v_id_caja_2   CP_CAJA_CHICA.ID_CAJA_CHICA%TYPE;
    v_id_caja_3   CP_CAJA_CHICA.ID_CAJA_CHICA%TYPE;
BEGIN
    SELECT ID_CAJA_CHICA INTO v_id_caja_1 FROM CP_CAJA_CHICA
    WHERE ID_SUCURSAL = (SELECT ID_SUCURSAL FROM NOM_SUCURSAL WHERE CODIGO = 'SUC-001');

    SELECT ID_CAJA_CHICA INTO v_id_caja_2 FROM CP_CAJA_CHICA
    WHERE ID_SUCURSAL = (SELECT ID_SUCURSAL FROM NOM_SUCURSAL WHERE CODIGO = 'SUC-002');

    SELECT ID_CAJA_CHICA INTO v_id_caja_3 FROM CP_CAJA_CHICA
    WHERE ID_SUCURSAL = (SELECT ID_SUCURSAL FROM NOM_SUCURSAL WHERE CODIGO = 'SUC-003');

    -- Caja de SUC-001 (fondo Q2,500.00)
    CP_PKG_CAJA_CHICA_MOVIMIENTO.INSERTAR(v_id_caja_1, 'GASTO', 'Compra de suministros de limpieza', 150.00, 'FAC-A001', v_id_mov);
    CP_PKG_CAJA_CHICA_MOVIMIENTO.INSERTAR(v_id_caja_1, 'GASTO', 'Combustible para vehiculo de reparto', 300.00, 'FAC-A002', v_id_mov);
    CP_PKG_CAJA_CHICA_MOVIMIENTO.INSERTAR(v_id_caja_1, 'REPOSICION', 'Reposicion mensual de fondo', 450.00, 'REP-A001', v_id_mov);

    -- Caja de SUC-002 (fondo Q3,000.00)
    CP_PKG_CAJA_CHICA_MOVIMIENTO.INSERTAR(v_id_caja_2, 'GASTO', 'Papeleria y utiles de oficina', 220.00, 'FAC-B001', v_id_mov);
    CP_PKG_CAJA_CHICA_MOVIMIENTO.INSERTAR(v_id_caja_2, 'GASTO', 'Servicio de mensajeria urgente', 95.50, 'FAC-B002', v_id_mov);

    -- Caja de SUC-003, Oficinas Centrales (fondo Q12,000.00)
    CP_PKG_CAJA_CHICA_MOVIMIENTO.INSERTAR(v_id_caja_3, 'GASTO', 'Cafeteria y refrigerio para reunion', 480.00, 'FAC-C001', v_id_mov);
    CP_PKG_CAJA_CHICA_MOVIMIENTO.INSERTAR(v_id_caja_3, 'REPOSICION', 'Reposicion trimestral de fondo corporativo', 2000.00, 'REP-C001', v_id_mov);
    CP_PKG_CAJA_CHICA_MOVIMIENTO.INSERTAR(v_id_caja_3, 'GASTO', 'Mantenimiento de aire acondicionado', 650.00, 'FAC-C002', v_id_mov);

    COMMIT;
END;
/
