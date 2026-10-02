import { Request, Response } from "express";
import oracledb from "oracledb";
import { AppDataSource } from "../data-source";

/**
 * Ejecuta una funcion recibiendo la conexion CRUDA de node-oracledb.
 *
 * TypeORM administra el pool; aqui tomamos un QueryRunner y de el sacamos
 * la conexion nativa de oracledb (databaseConnection) para poder usar binds
 * OUT y REF CURSOR contra PKG_CP_UNIDAD_MEDIDA. La conexion se libera SIEMPRE al final.
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

/** Convierte una fila del cursor (claves en MAYUSCULAS) al shape de la app. */
function mapUnidadMedida(row: any) {
  return {
    idUnidadMedida: row.ID_UNIDAD_MEDIDA,
    descripcion: row.DESCRIPCION,
  };
}

/** Lee todas las filas de un REF CURSOR y lo cierra. */
async function readCursor(cursor: oracledb.ResultSet<any>) {
  const rows = await cursor.getRows(); // sin argumento -> todas las filas
  await cursor.close();
  return rows.map(mapUnidadMedida);
}

/**
 * GET /unidades-medida -> SP_GET_ALL(p_cursor OUT)
 */
export async function listarUnidadesMedida(_req: Request, res: Response) {
  try {
    const unidades = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_UNIDAD_MEDIDA.SP_GET_ALL(:p_cursor); END;`,
        { p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).p_cursor as oracledb.ResultSet<any>;
      return readCursor(cursor);
    });
    res.json(unidades);
  } catch (err: any) {
    console.error("Error al listar unidades de medida:", err);
    res.status(500).json({ message: "Error al listar unidades de medida", error: err.message });
  }
}

/**
 * GET /unidades-medida/:id -> SP_GET_BY_ID(p_id_unidad_medida, p_cursor OUT)
 */
export async function obtenerUnidadMedida(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numerico" });
  }
  try {
    const unidad = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_UNIDAD_MEDIDA.SP_GET_BY_ID(:p_id_unidad_medida, :p_cursor); END;`,
        {
          p_id_unidad_medida: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).p_cursor as oracledb.ResultSet<any>;
      const rows = await readCursor(cursor);
      return rows[0] ?? null;
    });

    if (!unidad) {
      return res.status(404).json({ message: `Unidad de medida ${id} no encontrada` });
    }
    res.json(unidad);
  } catch (err: any) {
    console.error("Error al obtener unidad de medida:", err);
    res.status(500).json({ message: "Error al obtener unidad de medida", error: err.message });
  }
}

/**
 * POST /unidades-medida -> SP_INSERT(p_descripcion, p_id_out OUT)
 */
export async function crearUnidadMedida(req: Request, res: Response) {
  const { descripcion } = req.body;

  if (!descripcion) {
    return res.status(400).json({
      message: "Falta campo requerido: descripcion",
    });
  }

  try {
    const idGenerado = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_UNIDAD_MEDIDA.SP_INSERT(
            :p_descripcion,
            :p_id_out
         ); END;`,
        {
          p_descripcion: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: descripcion },
          p_id_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true }
      );
      return (result.outBinds as any).p_id_out as number;
    });

    res.status(201).json({ message: "Unidad de medida creada", idUnidadMedida: idGenerado });
  } catch (err: any) {
    console.error("Error al crear unidad de medida:", err);
    res.status(500).json({ message: "Error al crear unidad de medida", error: err.message });
  }
}

/**
 * PUT /unidades-medida/:id -> SP_UPDATE(p_id_unidad_medida, p_descripcion)
 */
export async function actualizarUnidadMedida(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numerico" });
  }

  const { descripcion } = req.body;
  if (!descripcion) {
    return res.status(400).json({
      message: "Falta campo requerido: descripcion",
    });
  }

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CP_UNIDAD_MEDIDA.SP_UPDATE(
            :p_id_unidad_medida,
            :p_descripcion
         ); END;`,
        {
          p_id_unidad_medida: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_descripcion: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: descripcion },
        },
        { autoCommit: true }
      );
    });

    res.json({ message: `Unidad de medida ${id} actualizada` });
  } catch (err: any) {
    console.error("Error al actualizar unidad de medida:", err);
    res.status(500).json({ message: "Error al actualizar unidad de medida", error: err.message });
  }
}

/**
 * DELETE /unidades-medida/:id -> SP_DELETE(p_id_unidad_medida)
 * Realiza un borrado fisico en la tabla mediante el paquete Oracle.
 */
export async function eliminarUnidadMedida(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numerico" });
  }

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CP_UNIDAD_MEDIDA.SP_DELETE(:p_id_unidad_medida); END;`,
        { p_id_unidad_medida: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id } },
        { autoCommit: true }
      );
    });

    res.json({ message: `Unidad de medida ${id} eliminada` });
  } catch (err: any) {
    console.error("Error al eliminar unidad de medida:", err);
    res.status(500).json({ message: "Error al eliminar unidad de medida", error: err.message });
  }
}