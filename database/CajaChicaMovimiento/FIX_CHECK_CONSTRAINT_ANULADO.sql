-- ============================================================
-- FIX: Actualizar CHECK constraint de TIPO_MOVIMIENTO
-- para permitir el valor 'ANULADO' en CP_CAJA_CHICA_MOVIMIENTO
-- ============================================================

-- PASO 1: Eliminar el constraint CHECK antiguo por su nombre real en la BD
ALTER TABLE CP_CAJA_CHICA_MOVIMIENTO
    DROP CONSTRAINT SYS_C0014141;

-- PASO 2: Eliminar el constraint personalizado si se creó en intentos previos
BEGIN
   EXECUTE IMMEDIATE 'ALTER TABLE CP_CAJA_CHICA_MOVIMIENTO DROP CONSTRAINT CHK_CCM_TIPO_MOVIMIENTO';
EXCEPTION
   WHEN OTHERS THEN
      IF SQLCODE != -2443 THEN
         RAISE;
      END IF;
END;
/

-- PASO 3: Crear el nuevo constraint CHECK que incluye 'ANULADO'
ALTER TABLE CP_CAJA_CHICA_MOVIMIENTO
    ADD CONSTRAINT CHK_CCM_TIPO_MOVIMIENTO
    CHECK (TIPO_MOVIMIENTO IN ('REPOSICION', 'GASTO', 'ANULADO'));

-- ============================================================
-- VERIFICACIÓN: Confirmar que el constraint se aplicó correctamente
-- ============================================================
SELECT
    CONSTRAINT_NAME,
    CONSTRAINT_TYPE,
    STATUS,
    SEARCH_CONDITION
FROM
    USER_CONSTRAINTS
WHERE
    TABLE_NAME = 'CP_CAJA_CHICA_MOVIMIENTO'
    AND CONSTRAINT_TYPE = 'C';