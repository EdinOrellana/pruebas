-- ============================================================================
-- DATOS DE PRUEBA: Retenciones IVA / ISR (CP_RETENCION)
-- ============================================================================
-- Requiere: FacturaProveedor/SEED_DATA.sql (y sus requisitos).
--
-- Usa PKG_CP_RETENCION.SP_INSERT, que recalcula las columnas de retencion y el
-- saldo de la factura (saldo = total - retenciones - NC + ND - pagos). Por eso
-- corre ANTES que ContrasenaPago y Cheque: la retencion se descuenta antes de pagar.
--
-- Factura por proveedor (NIT) + serie + numero de DTE, nunca por ID.
-- Re-ejecutable: si la factura ya tiene retenciones, se salta.
-- ============================================================================

SET DEFINE OFF

DECLARE
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

    -- Registra IVA e ISR de la factura (base = total del documento) si aun no tiene retenciones.
    PROCEDURE RETENER(
        p_nit IN VARCHAR2, p_serie IN VARCHAR2, p_numero IN VARCHAR2,
        p_pct_iva IN NUMBER, p_iva IN NUMBER, p_pct_isr IN NUMBER, p_isr IN NUMBER, p_correlativo IN VARCHAR2
    ) IS
        L_FACTURA NUMBER := FACTURA(p_nit, p_serie, p_numero);
        L_BASE NUMBER;
        L_N NUMBER;
        L_ID NUMBER;
    BEGIN
        SELECT COUNT(*) INTO L_N FROM CP_RETENCION WHERE ID_FACTURA_PROVEEDOR = L_FACTURA;
        IF L_N > 0 THEN
            RETURN;
        END IF;
        SELECT MONTO_TOTAL INTO L_BASE FROM CP_FACTURA_PROVEEDOR WHERE ID_FACTURA_PROVEEDOR = L_FACTURA;
        PKG_CP_RETENCION.SP_INSERT(L_FACTURA, 'IVA', L_BASE, p_pct_iva, p_iva, 'RET-IVA-' || p_correlativo, L_ID);
        PKG_CP_RETENCION.SP_INSERT(L_FACTURA, 'ISR', L_BASE, p_pct_isr, p_isr, 'RET-ISR-' || p_correlativo, L_ID);
    END;
BEGIN
    --       proveedor     serie      numero          %IVA   IVA    %ISR   ISR    constancia
    RETENER('1234567-8', 'SERIE-A', 'DTE-10001928', 4.80, 120.00, 5.00, 125.00, '0001');  -- neto Q2,255.00
    RETENER('2345678-9', 'SERIE-B', 'DTE-20004511', 4.80, 240.00, 5.00, 250.00, '0002');  -- neto Q4,510.00
    RETENER('3456789-0', 'SERIE-C', 'DTE-30008892', 5.00,  60.00, 5.00,  60.00, '0003');  -- neto Q1,080.00
    RETENER('4567890-1', 'SERIE-E', 'DTE-40001123', 5.00, 175.00, 5.00, 175.00, '0004');  -- neto Q3,150.00
    RETENER('5678901-2', 'SERIE-A', 'DTE-50007741', 5.00, 400.00, 5.00, 400.00, '0005');  -- neto Q7,200.00
    RETENER('6789012-3', 'SERIE-B', 'DTE-60009981', 5.00, 210.00, 5.00, 210.00, '0006');  -- neto Q3,930.00 (con ND)
    COMMIT;
END;
/
