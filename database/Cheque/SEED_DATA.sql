-- ============================================================================
-- DATOS DE PRUEBA: Cheques (CP_CHEQUE)
-- ============================================================================
-- Requiere: ContrasenaPago/SEED_DATA.sql (y sus requisitos).
--
-- Usa PKG_CP_CHEQUE, que tambien mueve la contrasena y el saldo de la factura:
--   emitir -> contrasena EMITIDA y baja el saldo
--   cobrar -> contrasena PAGADA
--   anular -> contrasena vuelve a PENDIENTE y se repone el saldo
-- La contrasena se busca por factura (NIT + serie + numero de DTE) y monto.
-- Bancos con el mismo nombre que la lista de la vista de Cheques.
--
-- Re-ejecutable: si la contrasena ya tiene cheques, se salta.
--
-- Resultado esperado:
--   SERIE-A DTE-10001928  Banco Industrial          CH-100192  COBRADO  -> factura PAGADA
--   SERIE-B DTE-20004511  Banco G&T Continental     CH-204510  COBRADO  -> factura PAGADA
--   SERIE-E DTE-40001123  Banrural                  CH-401299  ANULADO
--   SERIE-E DTE-40001123  Banco Agromercantil (BAM) CH-501144  EMITIDO  -> factura PAGADA PARCIAL
-- ============================================================================

SET DEFINE OFF

DECLARE
    L_CHEQUE NUMBER;

    -- Contrasena de tipo CHEQUE (no anulada) de la factura por el monto indicado.
    FUNCTION CONTRASENA(p_nit IN VARCHAR2, p_serie IN VARCHAR2, p_numero IN VARCHAR2, p_monto IN NUMBER) RETURN NUMBER IS
        L NUMBER;
    BEGIN
        SELECT MIN(C.ID_CONTRASENA) INTO L
        FROM CP_CONTRASENA_PAGO C
        JOIN CP_FACTURA_PROVEEDOR F ON F.ID_FACTURA_PROVEEDOR = C.ID_FACTURA_PROVEEDOR
        JOIN PROVEEDOR P ON P.ID_PROVEEDOR = F.ID_PROVEEDOR
        WHERE P.NIT = p_nit AND F.SERIE_DTE = p_serie AND F.NUMERO_DTE = p_numero
          AND C.FORMA_PAGO = 'CHEQUE' AND C.MONTO = p_monto AND C.ESTADO != 'ANULADA';
        IF L IS NULL THEN
            RAISE_APPLICATION_ERROR(-20900, 'Falta la contrasena CHEQUE de ' || p_serie || ' ' || p_numero ||
                '. Ejecute primero ContrasenaPago/SEED_DATA.sql');
        END IF;
        RETURN L;
    END;

    FUNCTION TIENE_CHEQUES(p_contrasena IN NUMBER) RETURN BOOLEAN IS
        L NUMBER;
    BEGIN
        SELECT COUNT(*) INTO L FROM CP_CHEQUE WHERE ID_CONTRASENA_PAGO = p_contrasena;
        RETURN L > 0;
    END;

    FUNCTION EMITIR(p_contrasena IN NUMBER, p_banco IN VARCHAR2, p_numero IN VARCHAR2, p_dias IN NUMBER) RETURN NUMBER IS
        L NUMBER;
    BEGIN
        PKG_CP_CHEQUE.SP_INSERTAR_CHEQUE(p_contrasena, p_banco, p_numero, TRUNC(SYSDATE) - p_dias, L);
        RETURN L;
    END;

    PROCEDURE PAGO_COMPLETO(
        p_nit IN VARCHAR2, p_serie IN VARCHAR2, p_numero IN VARCHAR2, p_monto IN NUMBER,
        p_banco IN VARCHAR2, p_cheque IN VARCHAR2, p_dias_emision IN NUMBER, p_dias_cobro IN NUMBER
    ) IS
        L_CONTRASENA NUMBER := CONTRASENA(p_nit, p_serie, p_numero, p_monto);
    BEGIN
        IF TIENE_CHEQUES(L_CONTRASENA) THEN
            RETURN;
        END IF;
        L_CHEQUE := EMITIR(L_CONTRASENA, p_banco, p_cheque, p_dias_emision);
        PKG_CP_CHEQUE.SP_COBRAR_CHEQUE(L_CHEQUE, TRUNC(SYSDATE) - p_dias_cobro);
    END;

    PROCEDURE ABONO_CON_CHEQUE_ANULADO IS
        L_CONTRASENA NUMBER := CONTRASENA('4567890-1', 'SERIE-E', 'DTE-40001123', 2000.00);
    BEGIN
        IF TIENE_CHEQUES(L_CONTRASENA) THEN
            RETURN;
        END IF;
        -- Primer cheque con error de impresion: se anula (la contrasena vuelve a PENDIENTE)
        L_CHEQUE := EMITIR(L_CONTRASENA, 'Banco de Desarrollo Rural (Banrural)', 'CH-401299', 7);
        PKG_CP_CHEQUE.SP_ANULAR_CHEQUE(L_CHEQUE);
        -- Cheque de reemplazo: queda EMITIDO, pendiente de cobro
        L_CHEQUE := EMITIR(L_CONTRASENA, 'Banco Agromercantil (BAM)', 'CH-501144', 6);
    END;
BEGIN
    PAGO_COMPLETO('1234567-8', 'SERIE-A', 'DTE-10001928', 2255.00, 'Banco Industrial', 'CH-100192', 17, 10);
    PAGO_COMPLETO('2345678-9', 'SERIE-B', 'DTE-20004511', 4510.00, 'Banco G&T Continental', 'CH-204510', 13, 5);
    ABONO_CON_CHEQUE_ANULADO;
    COMMIT;
END;
/
