-- ============================================================================
-- DATOS DE PRUEBA: Contrasenas de Pago (CP_CONTRASENA_PAGO)
-- ============================================================================
-- Requiere: Retencion/SEED_DATA.sql (y sus requisitos) y los empleados de
-- DEPENDENCIAS_EXTERNAS (empleado que autoriza, por CODIGO).
--
-- Usa PKG_CP_CONTRASENA_PAGO: valida monto vs disponible de la factura y que
-- el empleado este activo. Los pagos por TRANSFERENCIA / EFECTIVO se registran
-- aqui (SP_REGISTRAR_PAGO); los de CHEQUE los completa Cheque/SEED_DATA.sql.
--
-- Re-ejecutable: si la factura ya tiene contrasenas (en cualquier estado), se salta.
--
-- Resultado esperado:
--   SERIE-A DTE-10001928  CHEQUE        Q2,255.00  EMP-001  (cheque cobrado -> PAGADA)
--   SERIE-B DTE-20004511  CHEQUE        Q4,510.00  EMP-002  (cheque cobrado -> PAGADA)
--   SERIE-C DTE-30008892  TRANSFERENCIA Q1,080.00  EMP-001  PAGADA aqui mismo
--   SERIE-E DTE-40001123  CHEQUE        Q2,000.00  EMP-003  (abono; cheque emitido -> EMITIDA)
--   SERIE-A DTE-50007741  CHEQUE        Q7,200.00  EMP-001  PENDIENTE (factura vencida)
--   SERIE-B DTE-60009981  TRANSFERENCIA Q3,930.00  EMP-002  PENDIENTE
--   SERIE-B DTE-20004600  EFECTIVO      Q  500.00  EMP-003  ANULADA
-- ============================================================================

SET DEFINE OFF

DECLARE
    L_ID NUMBER;

    FUNCTION FACTURA(p_nit IN VARCHAR2, p_serie IN VARCHAR2, p_numero IN VARCHAR2) RETURN NUMBER IS
        L NUMBER;
    BEGIN
        SELECT F.ID_FACTURA_PROVEEDOR INTO L
        FROM CP_FACTURA_PROVEEDOR F JOIN PROVEEDOR P ON P.ID_PROVEEDOR = F.ID_PROVEEDOR
        WHERE P.NIT = p_nit AND F.SERIE_DTE = p_serie AND F.NUMERO_DTE = p_numero;
        RETURN L;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20900, 'Falta la factura ' || p_serie || ' ' || p_numero ||
                '. Ejecute primero FacturaProveedor/SEED_DATA.sql');
    END;

    FUNCTION EMPLEADO(p_codigo IN VARCHAR2) RETURN NUMBER IS
        L NUMBER;
    BEGIN
        SELECT ID_EMPLEADO INTO L FROM NOM_EMPLEADO WHERE CODIGO_EMPLEADO = p_codigo;
        RETURN L;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20900, 'Falta el empleado ' || p_codigo ||
                '. Ejecute primero DEPENDENCIAS_EXTERNAS/RUN_DEPENDENCIAS.sql');
    END;

    -- Crea la contrasena y devuelve su ID, o NULL si la factura ya tenia contrasenas.
    FUNCTION CONTRASENA(
        p_nit IN VARCHAR2, p_serie IN VARCHAR2, p_numero IN VARCHAR2,
        p_forma IN VARCHAR2, p_monto IN NUMBER, p_empleado IN VARCHAR2, p_dias IN NUMBER
    ) RETURN NUMBER IS
        L_FACTURA NUMBER := FACTURA(p_nit, p_serie, p_numero);
        L_N NUMBER;
        L NUMBER;
    BEGIN
        SELECT COUNT(*) INTO L_N FROM CP_CONTRASENA_PAGO WHERE ID_FACTURA_PROVEEDOR = L_FACTURA;
        IF L_N > 0 THEN
            RETURN NULL;
        END IF;
        PKG_CP_CONTRASENA_PAGO.SP_INSERTAR_CONTRASENA(
            L_FACTURA, TRUNC(SYSDATE) - p_dias, p_forma, p_monto, EMPLEADO(p_empleado), L);
        RETURN L;
    END;
BEGIN
    L_ID := CONTRASENA('1234567-8', 'SERIE-A', 'DTE-10001928', 'CHEQUE', 2255.00, 'EMP-001', 18);
    L_ID := CONTRASENA('2345678-9', 'SERIE-B', 'DTE-20004511', 'CHEQUE', 4510.00, 'EMP-002', 14);

    L_ID := CONTRASENA('3456789-0', 'SERIE-C', 'DTE-30008892', 'TRANSFERENCIA', 1080.00, 'EMP-001', 10);
    IF L_ID IS NOT NULL THEN
        PKG_CP_CONTRASENA_PAGO.SP_REGISTRAR_PAGO(L_ID);   -- transferencia realizada -> PAGADA
    END IF;

    L_ID := CONTRASENA('4567890-1', 'SERIE-E', 'DTE-40001123', 'CHEQUE', 2000.00, 'EMP-003', 8);
    L_ID := CONTRASENA('5678901-2', 'SERIE-A', 'DTE-50007741', 'CHEQUE', 7200.00, 'EMP-001', 4);
    L_ID := CONTRASENA('6789012-3', 'SERIE-B', 'DTE-60009981', 'TRANSFERENCIA', 3930.00, 'EMP-002', 2);

    L_ID := CONTRASENA('2345678-9', 'SERIE-B', 'DTE-20004600', 'EFECTIVO', 500.00, 'EMP-003', 1);
    IF L_ID IS NOT NULL THEN
        -- ejemplo de contrasena ANULADA (el motivo queda en NOTAS)
        PKG_CP_CONTRASENA_PAGO.SP_ANULAR_CONTRASENA(L_ID,
            'El proveedor solicito que el pago se haga junto con el saldo restante de la factura.');
    END IF;

    COMMIT;
END;
/
