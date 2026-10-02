-- ============================================================================
-- 00_RESET_ESQUEMA.sql - ELIMINAR TODO (tablas, vista y paquetes)
-- ============================================================================
-- !! IRREVERSIBLE !! Borra las tablas CON SUS DATOS. Solo para la base de
-- DESARROLLO / PRUEBAS. Sirve para volver a crear todo de cero: al eliminar
-- las tablas, los IDs (IDENTITY) vuelven a empezar en 1.
--
-- Despues de esto, cargar en orden (ver Pasos.SQL.txt):
--   0. SCRIPT_GENERAL.sql
--   1. DEPENDENCIAS_EXTERNAS/RUN_DEPENDENCIAS.sql
--   2. 00_MASTER_SETUP.sql
--   3. RUN_ALL_SEEDS.sql
--
-- SQL Developer: abrir este archivo con la conexion del modulo y ejecutar con
-- F5 (Ejecutar script). El resultado se ve en "Salida de Script".
-- ============================================================================

SET SERVEROUTPUT ON

-- 1. Eliminar la vista (vive en 00_MASTER_SETUP.sql)
BEGIN
  EXECUTE IMMEDIATE 'DROP VIEW VW_CP_FACTURA_PROVEEDOR';
  DBMS_OUTPUT.PUT_LINE('Vista eliminada: VW_CP_FACTURA_PROVEEDOR');
EXCEPTION
  WHEN OTHERS THEN
    IF SQLCODE = -942 THEN
      DBMS_OUTPUT.PUT_LINE('(no existia) VW_CP_FACTURA_PROVEEDOR');
    ELSE
      DBMS_OUTPUT.PUT_LINE('ERROR en vista VW_CP_FACTURA_PROVEEDOR: ' || SQLERRM);
    END IF;
END;
/

-- 2. Eliminar los paquetes PL/SQL (viven en 00_MASTER_SETUP.sql)
BEGIN
  FOR p IN (
    SELECT COLUMN_VALUE AS PKG_NAME FROM TABLE(SYS.ODCIVARCHAR2LIST(
      'PKG_CP_FACTURA_PROVEEDOR','PKG_CP_CONTRASENA_PAGO','PKG_CP_CHEQUE',
      'PKG_FACTURA_PROVEEDOR_DETALLE','PKG_CP_RETENCION','PKG_CP_UNIDAD_MEDIDA',
      'CP_PKG_CAJA_CHICA_MOVIMIENTO','PKG_CAJA_CHICA'
    ))
  ) LOOP
    BEGIN
      EXECUTE IMMEDIATE 'DROP PACKAGE ' || p.PKG_NAME;
      DBMS_OUTPUT.PUT_LINE('Paquete eliminado: ' || p.PKG_NAME);
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE = -4043 THEN
          DBMS_OUTPUT.PUT_LINE('(no existia) ' || p.PKG_NAME);
        ELSE
          DBMS_OUTPUT.PUT_LINE('ERROR en paquete ' || p.PKG_NAME || ': ' || SQLERRM);
        END IF;
    END;
  END LOOP;
END;
/

-- 3. Eliminar TODAS las tablas (62 de SCRIPT_GENERAL.sql + 4 NOM_ de DEPENDENCIAS_EXTERNAS)
--    CASCADE CONSTRAINTS quita las llaves foraneas, asi el orden no importa.
BEGIN
  FOR t IN (
    SELECT COLUMN_VALUE AS TABLE_NAME FROM TABLE(SYS.ODCIVARCHAR2LIST(
      -- Nomina (SCRIPT_GENERAL, sin prefijo)
      'SUCURSAL','DEPARTAMENTO','PUESTO','EMPLEADO','USUARIO','PARAMETRO_NOMINA',
      'PERIODO_NOMINA','NOMINA_DETALLE','ANTICIPO_EMPLEADO','PRESTAMO_EMPLEADO',
      'PRESTAMO_CUOTA','HORA_EXTRA','COMISION_VENTA','CONSUMO_TIENDA_INTERNA',
      'VACACION','SUSPENSION_PERMISO','LIQUIDACION_LABORAL',
      'TRANSFERENCIA_BANCARIA_NOMINA','DESCUENTO_IGSS_SAT',
      -- Cuentas por Cobrar
      'CLIENTE','FACTURA_VENTA','FACTURA_VENTA_DETALLE','COBRADOR','RUTA_COBRO',
      'RUTA_COBRO_DETALLE','GESTION_COBRANZA','RECIBO_COBRO','DEPOSITO_COBRADOR',
      'CUADRE_DTE_SAT',
      -- Cuentas por Pagar (CP_)
      'CP_TIPO_UNIDAD_MEDIDA','CP_FACTURA_PROVEEDOR','CP_FACTURA_PROVEEDOR_DETALLE',
      'CP_RETENCION','CP_CONTRASENA_PAGO','CP_CHEQUE','CP_CAJA_CHICA',
      'CP_CAJA_CHICA_MOVIMIENTO',
      -- Compras
      'PROVEEDOR','ARTICULO_PROVEEDOR','SOLICITUD_COMPRA','SOLICITUD_COMPRA_DETALLE',
      'APROBACION_SOLICITUD','COTIZACION_PROVEEDOR','COTIZACION_DETALLE',
      'SELECCION_COTIZACION','ORDEN_COMPRA','ORDEN_COMPRA_DETALLE',
      -- Inventarios
      'CATEGORIA_ARTICULO','ARTICULO','BODEGA','EXISTENCIA_BODEGA','LOTE_FIFO',
      'KARDEX_MOVIMIENTO','ALERTA_ESCASEZ','REQUISICION','REQUISICION_DETALLE',
      'TRASLADO_BODEGA','TRASLADO_BODEGA_DETALLE','RECEPCION_PROVEEDOR',
      'RECEPCION_PROVEEDOR_DETALLE','INVENTARIO_FISICO','INVENTARIO_FISICO_DETALLE',
      -- Nomina de prueba (DEPENDENCIAS_EXTERNAS, prefijo NOM_)
      'NOM_DEPARTAMENTO','NOM_PUESTO','NOM_SUCURSAL','NOM_EMPLEADO'
    ))
  ) LOOP
    BEGIN
      EXECUTE IMMEDIATE 'DROP TABLE ' || t.TABLE_NAME || ' CASCADE CONSTRAINTS PURGE';
      DBMS_OUTPUT.PUT_LINE('Eliminada: ' || t.TABLE_NAME);
    EXCEPTION
      WHEN OTHERS THEN
        IF SQLCODE = -942 THEN
          DBMS_OUTPUT.PUT_LINE('(no existia) ' || t.TABLE_NAME);
        ELSE
          DBMS_OUTPUT.PUT_LINE('ERROR en ' || t.TABLE_NAME || ': ' || SQLERRM);
        END IF;
    END;
  END LOOP;
END;
/

-- 4. Vaciar la papelera de reciclaje
PURGE RECYCLEBIN;

-- 5. Verificacion: debe devolver 0 filas (si sale algo, no estaba en las listas)
SELECT OBJECT_TYPE, OBJECT_NAME
FROM USER_OBJECTS
WHERE OBJECT_TYPE IN ('TABLE', 'VIEW', 'PACKAGE')
ORDER BY OBJECT_TYPE, OBJECT_NAME;
