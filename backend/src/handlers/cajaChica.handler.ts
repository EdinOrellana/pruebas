import { Request, Response } from "express";
import oracledb from "oracledb";
import { AppDataSource } from "../data-source";

/**
 * Ejecuta una función recibiendo la conexión CRUDA de node-oracledb.
 * TypeORM administra el pool; liberamos el queryRunner en finally.
 */
async function withOracleConnection<T>(
  fn: (conn: oracledb.Connection) => Promise<T>
): Promise<T> {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  try {
    const conn = (queryRunner as any).databaseConnection as oracledb.Connection;
    return await fn(conn);
  } finally {
    await queryRunner.release();
  }
}

/** Convierte una fila de Caja Chica del cursor a camelCase */
function mapCajaChica(row: any) {
  return {
    idCajaChica: row.ID_CAJA_CHICA,
    idSucursal: row.ID_SUCURSAL,
    sucursalNombre: row.SUCURSAL_NOMBRE,
    sucursalCodigo: row.SUCURSAL_CODIGO,
    idEmpleadoResponsable: row.ID_EMPLEADO_RESPONSABLE,
    responsableNombre: row.RESPONSABLE_NOMBRE,
    responsableCodigo: row.RESPONSABLE_CODIGO,
    fondoAsignado: Number(row.FONDO_ASIGNADO ?? 0),
    estado: row.ESTADO as "A" | "I",
  };
}

/** Lee todas las filas de un REF CURSOR y lo cierra */
async function readCursor<T>(
  cursor: oracledb.ResultSet<any>,
  mapper: (row: any) => T
): Promise<T[]> {
  const rows = await cursor.getRows();
  await cursor.close();
  return rows.map(mapper);
}

/**
 * GET /cajas-chicas -> SP_LISTAR_CAJAS_CHICAS(p_cursor OUT)
 */
export async function listarCajasChicas(_req: Request, res: Response) {
  try {
    const cajas = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CAJA_CHICA.SP_LISTAR_CAJAS_CHICAS(:p_cursor); END;`,
        { p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).p_cursor as oracledb.ResultSet<any>;
      return readCursor(cursor, mapCajaChica);
    });
    res.json(cajas);
  } catch (err: any) {
    console.error("Error al listar cajas chicas:", err);
    res.status(500).json({ message: "Error al listar cajas chicas", error: err.message });
  }
}

/**
 * GET /cajas-chicas/catalogos -> Retorna sucursales y empleados para selectores
 */
export async function listarCatalogos(_req: Request, res: Response) {
  try {
    const data = await withOracleConnection(async (conn) => {
      // 1. Sucursales
      const resSucursales = await conn.execute(
        `BEGIN PKG_CAJA_CHICA.SP_LISTAR_SUCURSALES(:p_cursor); END;`,
        { p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursorSuc = (resSucursales.outBinds as any).p_cursor as oracledb.ResultSet<any>;
      const sucursalesRows = await cursorSuc.getRows();
      await cursorSuc.close();

      // 2. Empleados
      const resEmpleados = await conn.execute(
        `BEGIN PKG_CAJA_CHICA.SP_LISTAR_EMPLEADOS(:p_cursor); END;`,
        { p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursorEmp = (resEmpleados.outBinds as any).p_cursor as oracledb.ResultSet<any>;
      const empleadosRows = await cursorEmp.getRows();
      await cursorEmp.close();

      return {
        sucursales: sucursalesRows.map((r: any) => ({
          id: r.ID_SUCURSAL,
          codigo: r.CODIGO,
          nombre: r.NOMBRE,
        })),
        empleados: empleadosRows.map((r: any) => ({
          id: r.ID_EMPLEADO,
          codigo: r.CODIGO_EMPLEADO,
          nombre: r.NOMBRE_COMPLETO,
          idSucursal: r.ID_SUCURSAL != null ? Number(r.ID_SUCURSAL) : undefined,
        })),
      };
    });

    res.json(data);
  } catch (err: any) {
    console.error("Error al listar catálogos de caja chica:", err);
    res.status(500).json({ message: "Error al listar catálogos", error: err.message });
  }
}

/**
 * GET /cajas-chicas/:id -> SP_OBTENER_CAJA_CHICA(p_id_caja_chica, p_cursor OUT)
 */
export async function obtenerCajaChica(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El ID debe ser numérico" });
  }

  try {
    const caja = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CAJA_CHICA.SP_OBTENER_CAJA_CHICA(:p_id_caja_chica, :p_cursor); END;`,
        {
          p_id_caja_chica: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).p_cursor as oracledb.ResultSet<any>;
      const rows = await readCursor(cursor, mapCajaChica);
      return rows[0] ?? null;
    });

    if (!caja) {
      return res.status(404).json({ message: `Caja chica ${id} no encontrada` });
    }
    res.json(caja);
  } catch (err: any) {
    console.error("Error al obtener caja chica:", err);
    res.status(500).json({ message: "Error al obtener caja chica", error: err.message });
  }
}

/**
 * POST /cajas-chicas -> SP_INSERTAR_CAJA_CHICA
 */
export async function crearCajaChica(req: Request, res: Response) {
  const { idSucursal, idEmpleadoResponsable, fondoAsignado } = req.body;

  if (idSucursal == null || idEmpleadoResponsable == null || fondoAsignado == null) {
    return res.status(400).json({
      message: "Faltan campos requeridos: idSucursal, idEmpleadoResponsable, fondoAsignado",
    });
  }

  try {
    const idGenerado = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CAJA_CHICA.SP_INSERTAR_CAJA_CHICA(
            :p_id_sucursal,
            :p_id_empleado_responsable,
            :p_fondo_asignado,
            :p_id_caja_chica_out
         ); END;`,
        {
          p_id_sucursal: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(idSucursal) },
          p_id_empleado_responsable: {
            dir: oracledb.BIND_IN,
            type: oracledb.NUMBER,
            val: Number(idEmpleadoResponsable),
          },
          p_fondo_asignado: {
            dir: oracledb.BIND_IN,
            type: oracledb.NUMBER,
            val: Number(fondoAsignado),
          },
          p_id_caja_chica_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true }
      );
      return (result.outBinds as any).p_id_caja_chica_out as number;
    });

    res.status(201).json({ message: "Caja chica creada", idCajaChica: idGenerado });
  } catch (err: any) {
    console.error("Error al crear caja chica:", err);
    res.status(500).json({ message: "Error al crear caja chica", error: err.message });
  }
}

/**
 * PUT /cajas-chicas/:id -> SP_ACTUALIZAR_CAJA_CHICA
 */
export async function actualizarCajaChica(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El ID debe ser numérico" });
  }

  const { idEmpleadoResponsable, fondoAsignado, estado } = req.body;
  if (idEmpleadoResponsable == null || fondoAsignado == null) {
    return res.status(400).json({
      message: "Faltan campos requeridos: idEmpleadoResponsable, fondoAsignado",
    });
  }

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CAJA_CHICA.SP_ACTUALIZAR_CAJA_CHICA(
            :p_id_caja_chica,
            :p_id_empleado_responsable,
            :p_fondo_asignado,
            :p_estado
         ); END;`,
        {
          p_id_caja_chica: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_id_empleado_responsable: {
            dir: oracledb.BIND_IN,
            type: oracledb.NUMBER,
            val: Number(idEmpleadoResponsable),
          },
          p_fondo_asignado: {
            dir: oracledb.BIND_IN,
            type: oracledb.NUMBER,
            val: Number(fondoAsignado),
          },
          p_estado: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: estado || "A" },
        },
        { autoCommit: true }
      );
    });

    res.json({ message: `Caja chica ${id} actualizada` });
  } catch (err: any) {
    console.error("Error al actualizar caja chica:", err);
    res.status(500).json({ message: "Error al actualizar caja chica", error: err.message });
  }
}

/**
 * DELETE /cajas-chicas/:id -> SP_INACTIVAR_CAJA_CHICA (Baja lógica: ESTADO = 'I', ELIMINADO = 'S')
 */
export async function inactivarCajaChica(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El ID debe ser numérico" });
  }

  const eliminadoPor = req.body?.eliminadoPor ? Number(req.body.eliminadoPor) : null;

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CAJA_CHICA.SP_INACTIVAR_CAJA_CHICA(:p_id_caja_chica, :p_eliminado_por); END;`,
        {
          p_id_caja_chica: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_eliminado_por: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: eliminadoPor },
        },
        { autoCommit: true }
      );
    });

    res.json({ message: `Caja chica ${id} eliminada/inactivada correctamente` });
  } catch (err: any) {
    console.error("Error al inactivar caja chica:", err);
    res.status(500).json({ message: "Error al inactivar caja chica", error: err.message });
  }
}

