-- ============================================================================
-- DATOS DE PRUEBA: Facturas de Proveedor + lineas de detalle + notas de credito/debito
-- ============================================================================
-- Requiere:
--   * DEPENDENCIAS_EXTERNAS/RUN_DEPENDENCIAS.sql (proveedores y articulos)
--   * 00_MASTER_SETUP.sql (paquetes) y UnidadMedida/SEED_DATA.sql (unidades)
--
-- Usa los MISMOS procedimientos que la aplicacion (PKG_CP_FACTURA_PROVEEDOR y
-- PKG_FACTURA_PROVEEDOR_DETALLE): el total, el saldo y el estado los calcula
-- la base de datos; aqui no se escribe ningun ID ni estado a mano.
-- Proveedor por NIT, articulo por CODIGO y unidad por DESCRIPCION.
--
-- Re-ejecutable: si el documento (proveedor + serie + numero) ya existe, se
-- salta completo.
--
-- Escenarios (el resto del flujo lo completan Retencion, ContrasenaPago y Cheque):
--   SERIE-A DTE-10001928  Papeleria      -> se paga completa con cheque cobrado
--   SERIE-B DTE-20004511  PapelTerm      -> se paga completa con cheque cobrado
--   SERIE-C DTE-30008892  Limpieza       -> se paga completa por transferencia
--   SERIE-E DTE-40001123  AudiTI (FACT. ESPECIAL) -> abono parcial con cheque emitido
--   SERIE-A DTE-50007741  TecnoStore     -> VENCIDA con contrasena pendiente
--   SERIE-B DTE-60009981  ContaSoft      -> nota de debito aplicada + contrasena pendiente
--   SERIE-B DTE-20004600  PapelTerm      -> nota de credito aplicada
--   SERIE-NC DTE-70003321 PapelTerm      -> NOTA DE CREDITO (aplicada a DTE-20004600)
--   SERIE-ND DTE-90001001 ContaSoft      -> NOTA DE DEBITO (aplicada a DTE-60009981)
--   SERIE-A DTE-80005512  TransRapida    -> ANULADA
--   SERIE-A DTE-10002050  Papeleria      -> PENDIENTE sin nada (para probar desde la app)
-- ============================================================================

SET DEFINE OFF

DECLARE
    L_ID NUMBER;

    FUNCTION PROVEEDOR_POR_NIT(p_nit IN VARCHAR2) RETURN NUMBER IS
        L NUMBER;
    BEGIN
        SELECT ID_PROVEEDOR INTO L FROM PROVEEDOR WHERE NIT = p_nit;
        RETURN L;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20900, 'Falta el proveedor NIT ' || p_nit ||
                '. Ejecute primero DEPENDENCIAS_EXTERNAS/RUN_DEPENDENCIAS.sql');
    END;

    FUNCTION ARTICULO_POR_CODIGO(p_codigo IN VARCHAR2) RETURN NUMBER IS
        L NUMBER;
    BEGIN
        IF p_codigo IS NULL THEN RETURN NULL; END IF;
        SELECT ID_ARTICULO INTO L FROM ARTICULO WHERE CODIGO = p_codigo;
        RETURN L;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20900, 'Falta el articulo ' || p_codigo ||
                '. Ejecute primero DEPENDENCIAS_EXTERNAS/RUN_DEPENDENCIAS.sql');
    END;

    FUNCTION UNIDAD(p_descripcion IN VARCHAR2) RETURN NUMBER IS
        L NUMBER;
    BEGIN
        SELECT MIN(ID_UNIDAD_MEDIDA) INTO L FROM CP_TIPO_UNIDAD_MEDIDA WHERE DESCRIPCION = p_descripcion;
        IF L IS NULL THEN
            RAISE_APPLICATION_ERROR(-20900, 'Falta la unidad "' || p_descripcion ||
                '". Ejecute primero UnidadMedida/SEED_DATA.sql');
        END IF;
        RETURN L;
    END;

    -- ID del documento (cualquier estado) o NULL si no existe.
    FUNCTION DOCUMENTO(p_nit IN VARCHAR2, p_serie IN VARCHAR2, p_numero IN VARCHAR2) RETURN NUMBER IS
        L NUMBER;
        L_PROVEEDOR NUMBER := PROVEEDOR_POR_NIT(p_nit);  -- (una funcion local no se puede usar dentro del SQL)
    BEGIN
        SELECT MIN(ID_FACTURA_PROVEEDOR) INTO L FROM CP_FACTURA_PROVEEDOR
        WHERE ID_PROVEEDOR = L_PROVEEDOR AND SERIE_DTE = p_serie AND NUMERO_DTE = p_numero;
        RETURN L;
    END;

    -- Crea el encabezado y devuelve su ID, o NULL si el documento ya existia.
    FUNCTION CREAR(
        p_nit IN VARCHAR2, p_tipo IN VARCHAR2, p_serie IN VARCHAR2, p_numero IN VARCHAR2,
        p_dias_emision IN NUMBER, p_dias_vencimiento IN NUMBER,
        p_ref_serie IN VARCHAR2 DEFAULT NULL, p_ref_numero IN VARCHAR2 DEFAULT NULL
    ) RETURN NUMBER IS
        L NUMBER;
    BEGIN
        IF DOCUMENTO(p_nit, p_serie, p_numero) IS NOT NULL THEN
            RETURN NULL;
        END IF;
        PKG_CP_FACTURA_PROVEEDOR.SP_INSERTAR_FACTURA(
            PROVEEDOR_POR_NIT(p_nit), p_tipo, p_numero, p_serie,
            TRUNC(SYSDATE) - p_dias_emision,                       -- emision
            TRUNC(SYSDATE) - p_dias_emision + 1,                   -- documento (recibido al dia siguiente)
            CASE WHEN p_dias_vencimiento IS NOT NULL THEN TRUNC(SYSDATE) + p_dias_vencimiento END,
            CASE WHEN p_ref_serie IS NOT NULL THEN DOCUMENTO(p_nit, p_ref_serie, p_ref_numero) END,
            L);
        RETURN L;
    END;

    PROCEDURE LINEA(
        p_id IN NUMBER, p_articulo IN VARCHAR2, p_descripcion IN VARCHAR2,
        p_cantidad IN NUMBER, p_precio IN NUMBER, p_unidad IN VARCHAR2
    ) IS
        L NUMBER;
    BEGIN
        PKG_FACTURA_PROVEEDOR_DETALLE.SP_INSERTAR_DETALLE(
            p_id, ARTICULO_POR_CODIGO(p_articulo), p_descripcion, p_cantidad, p_precio, UNIDAD(p_unidad), L);
    END;

    PROCEDURE CERRAR(p_id IN NUMBER) IS
    BEGIN
        PKG_CP_FACTURA_PROVEEDOR.SP_VALIDAR_TIENE_DETALLE(p_id);
    END;
BEGIN
    -- Papeleria El Estudiante: Q2,500.00
    L_ID := CREAR('1234567-8', 'FACTURA', 'SERIE-A', 'DTE-10001928', 30, 0);
    IF L_ID IS NOT NULL THEN
        LINEA(L_ID, 'ART-2001', 'Resmas de papel bond carta', 10, 150, 'Paquete');
        LINEA(L_ID, NULL, 'Servicio de mantenimiento preventivo de impresoras', 1, 1000, 'Servicio / Global');
        CERRAR(L_ID);
    END IF;

    -- PapelTerm GT: Q5,000.00
    L_ID := CREAR('2345678-9', 'FACTURA', 'SERIE-B', 'DTE-20004511', 25, 5);
    IF L_ID IS NOT NULL THEN
        LINEA(L_ID, 'ART-2003', 'Lote de bobinas de papel térmico para POS', 50, 100, 'Rollo');
        CERRAR(L_ID);
    END IF;

    -- Limpieza Integral: Q1,200.00
    L_ID := CREAR('3456789-0', 'FACTURA', 'SERIE-C', 'DTE-30008892', 20, 10);
    IF L_ID IS NOT NULL THEN
        LINEA(L_ID, NULL, 'Servicio de sanitización y limpieza de oficinas', 2, 600, 'Servicio / Global');
        CERRAR(L_ID);
    END IF;

    -- AudiTI Consultores (factura especial): Q3,500.00
    L_ID := CREAR('4567890-1', 'FACTURA_ESPECIAL', 'SERIE-E', 'DTE-40001123', 18, 27);
    IF L_ID IS NOT NULL THEN
        LINEA(L_ID, NULL, 'Consultoría de auditoría informática y sistemas', 35, 100, 'Horas Profesionales');
        CERRAR(L_ID);
    END IF;

    -- TecnoStore: Q8,000.00 - vencida hace 15 dias
    L_ID := CREAR('5678901-2', 'FACTURA', 'SERIE-A', 'DTE-50007741', 45, -15);
    IF L_ID IS NOT NULL THEN
        LINEA(L_ID, 'ART-2006', 'Servidores de almacenamiento NAS 16TB', 2, 4000, 'Unidad');
        CERRAR(L_ID);
    END IF;

    -- ContaSoft: Q4,200.00
    L_ID := CREAR('6789012-3', 'FACTURA', 'SERIE-B', 'DTE-60009981', 10, 20);
    IF L_ID IS NOT NULL THEN
        LINEA(L_ID, 'ART-2007', 'Licencias anuales de software de contabilidad', 3, 1400, 'Unidad');
        CERRAR(L_ID);
    END IF;

    -- PapelTerm GT: Q3,000.00 (recibe la nota de credito)
    L_ID := CREAR('2345678-9', 'FACTURA', 'SERIE-B', 'DTE-20004600', 8, 7);
    IF L_ID IS NOT NULL THEN
        LINEA(L_ID, 'ART-2003', 'Bobinas de papel térmico 80mm', 30, 100, 'Rollo');
        CERRAR(L_ID);
    END IF;

    -- Nota de credito Q600.00 aplicada a SERIE-B DTE-20004600 (saldo baja a Q2,400.00)
    L_ID := CREAR('2345678-9', 'NOTA_CREDITO', 'SERIE-NC', 'DTE-70003321', 5, NULL, 'SERIE-B', 'DTE-20004600');
    IF L_ID IS NOT NULL THEN
        LINEA(L_ID, 'ART-2003', 'Ajuste de precio por devolución de bobinas defectuosas', 6, 100, 'Rollo');
        CERRAR(L_ID);
    END IF;

    -- Nota de debito Q150.00 aplicada a SERIE-B DTE-60009981
    L_ID := CREAR('6789012-3', 'NOTA_DEBITO', 'SERIE-ND', 'DTE-90001001', 3, NULL, 'SERIE-B', 'DTE-60009981');
    IF L_ID IS NOT NULL THEN
        LINEA(L_ID, NULL, 'Recargo por envío e instalación de licencias', 1, 150, 'Servicio / Global');
        CERRAR(L_ID);
    END IF;

    -- TransRapida: Q1,800.00 - se anula
    L_ID := CREAR('7890123-4', 'FACTURA', 'SERIE-A', 'DTE-80005512', 12, 3);
    IF L_ID IS NOT NULL THEN
        LINEA(L_ID, NULL, 'Servicio de transporte y carga (cancelado)', 1, 1800, 'Servicio / Global');
        CERRAR(L_ID);
        PKG_CP_FACTURA_PROVEEDOR.SP_ANULAR_FACTURA(L_ID,
            'Servicio cancelado por el proveedor; emitira un nuevo DTE con la tarifa corregida.');
    END IF;

    -- Papeleria El Estudiante: Q1,800.00 - queda PENDIENTE para probar el flujo desde la app
    L_ID := CREAR('1234567-8', 'FACTURA', 'SERIE-A', 'DTE-10002050', 2, 28);
    IF L_ID IS NOT NULL THEN
        LINEA(L_ID, 'ART-2009', 'Tóner para impresora láser', 4, 450, 'Unidad');
        CERRAR(L_ID);
    END IF;

    COMMIT;
END;
/
