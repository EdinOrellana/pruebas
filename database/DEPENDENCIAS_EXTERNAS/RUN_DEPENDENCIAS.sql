-- ============================================================================
-- RUN_DEPENDENCIAS.sql - Tablas y datos de OTROS modulos (temporal)
-- ============================================================================
-- Crea y llena lo que Cuentas por Pagar necesita de Nomina, Compras e
-- Inventarios mientras esos equipos no entreguen sus scripts reales.
-- Ver README.md de esta carpeta.
--
-- Ejecutar desde DENTRO de esta carpeta (los @@ son relativos a este archivo):
--   sqlplus usuario/clave@conexion @RUN_DEPENDENCIAS.sql
--
-- Re-ejecutable: no borra nada ni duplica filas.
-- ============================================================================

SET DEFINE OFF

PROMPT [1/2] Estructura de dependencias externas...
@@01_SETUP_DEPENDENCIAS.sql

PROMPT [2/2] Datos de prueba de dependencias externas...
@@02_DATOS_DEPENDENCIAS.sql

PROMPT ============================================================
PROMPT Listo. Siguiente paso: database/00_MASTER_SETUP.sql
PROMPT ============================================================
