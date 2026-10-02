-- ============================================================================
-- DATOS: Catalogo de Unidad de Medida (CP_TIPO_UNIDAD_MEDIDA)
-- Requiere: database/00_MASTER_SETUP.sql ya ejecutado.
-- Idempotente: usa MERGE, se puede correr las veces que quieras sin duplicar.
-- ============================================================================

MERGE INTO CP_TIPO_UNIDAD_MEDIDA dest
USING (
    SELECT 'Unidad' AS DESCRIPCION FROM DUAL UNION ALL
    SELECT 'Caja' FROM DUAL UNION ALL
    SELECT 'Paquete' FROM DUAL UNION ALL
    SELECT 'Docena' FROM DUAL UNION ALL
    SELECT 'Millar' FROM DUAL UNION ALL
    SELECT 'Fardo' FROM DUAL UNION ALL
    SELECT 'Bolsa' FROM DUAL UNION ALL
    SELECT 'Kilogramo (kg)' FROM DUAL UNION ALL
    SELECT 'Libra (lb)' FROM DUAL UNION ALL
    SELECT 'Gramo (g)' FROM DUAL UNION ALL
    SELECT 'Quintal (qq)' FROM DUAL UNION ALL
    SELECT 'Tonelada (ton)' FROM DUAL UNION ALL
    SELECT 'Litro (L)' FROM DUAL UNION ALL
    SELECT 'Galón (gal)' FROM DUAL UNION ALL
    SELECT 'Barril / Tambor' FROM DUAL UNION ALL
    SELECT 'Botella' FROM DUAL UNION ALL
    SELECT 'Metro (m)' FROM DUAL UNION ALL
    SELECT 'Metro Cuadrado (m²)' FROM DUAL UNION ALL
    SELECT 'Rollo' FROM DUAL UNION ALL
    SELECT 'Servicio / Global' FROM DUAL UNION ALL
    SELECT 'Horas Profesionales' FROM DUAL
) src
ON (UPPER(TRIM(dest.DESCRIPCION)) = UPPER(TRIM(src.DESCRIPCION)))
WHEN NOT MATCHED THEN
    INSERT (DESCRIPCION) VALUES (src.DESCRIPCION);

COMMIT;
