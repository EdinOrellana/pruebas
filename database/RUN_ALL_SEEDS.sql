-- ============================================================================
-- RUN_ALL_SEEDS.sql - Datos de prueba de Cuentas por Pagar, en el orden correcto
-- ============================================================================
-- Requiere (ver database/Pasos.SQL.txt):
--   1. DEPENDENCIAS_EXTERNAS/RUN_DEPENDENCIAS.sql -> sucursales, empleados,
--      proveedores y articulos (son de OTROS modulos; aqui solo se buscan por
--      su CODIGO / NIT, nunca por ID)
--   2. 00_MASTER_SETUP.sql -> tablas CP_* y paquetes
--
-- Los datos de facturas, retenciones, contrasenas y cheques se crean con los
-- MISMOS procedimientos que usa la aplicacion, asi que estados y saldos salen
-- calculados y coherentes (nada se escribe a mano).
--
-- Re-ejecutable: cada archivo salta lo que ya existe (Movimientos de Caja
-- Chica es la excepcion: cada corrida agrega movimientos nuevos).
--
-- Ejecutar este archivo desde DENTRO de la carpeta database/ (SQL*Plus /
-- SQL Developer resuelven los @@ relativos a la ubicacion de este script):
--   sqlplus usuario/clave@conexion @RUN_ALL_SEEDS.sql
-- ============================================================================

SET DEFINE OFF

-- 1. Catalogo propio (sin dependencias)
@@UnidadMedida/SEED_DATA.sql

-- 2. Facturas de Proveedor + lineas + notas de credito/debito
--    (proveedores y articulos de DEPENDENCIAS_EXTERNAS; unidades del paso 1)
@@FacturaProveedor/SEED_DATA.sql

-- 3. Retenciones (antes de pagar: se descuentan del saldo de la factura)
@@Retencion/SEED_DATA.sql

-- 4. Contrasenas de Pago (empleado que autoriza de DEPENDENCIAS_EXTERNAS)
@@ContrasenaPago/SEED_DATA.sql

-- 5. Cheques (emitir / cobrar / anular mueven la contrasena y el saldo)
@@Cheque/SEED_DATA.sql

-- 6. Cajas Chicas (sucursal y responsable de DEPENDENCIAS_EXTERNAS)
@@CajaChica/SEED_DATA.sql

-- 7. Movimientos de Caja Chica (depende de Caja Chica)
@@CajaChicaMovimiento/SEED_DATA.sql

PROMPT ============================================================
PROMPT Listo. Datos de prueba de Cuentas por Pagar cargados:
PROMPT Unidad Medida, Facturas Proveedor (con detalle y notas),
PROMPT Retenciones, Contrasenas de Pago, Cheques, Caja Chica y
PROMPT Movimientos de Caja.
PROMPT ============================================================
