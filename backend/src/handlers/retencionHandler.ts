import { Request, Response } from "express";
import oracledb from "oracledb";
import { AppDataSource } from "../data-source";

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

/**
 * Si el error viene de un RAISE_APPLICATION_ERROR (ORA-20XXX) del paquete
 * PL/SQL (reglas de negocio), devuelve su mensaje legible; si no, null.
 */
function obtenerMensajeNegocio(error: any): string | null {
  const raw: string = error?.message || String(error) || "";
  const match = raw.match(/ORA-20\d{3}:\s*([^\n\r]+)/);
  return match ? match[1].trim() : null;
}

function mapRetencion(row: any) {
  return {
    idRetencion: row.ID_RETENCION,
    idFacturaProveedor: row.ID_FACTURA_PROVEEDOR,
    tipoRetencion: row.TIPO_RETENCION,
    baseImponible: row.BASE_IMPONIBLE,
    porcentaje: row.PORCENTAJE,
    monto: row.MONTO,
    numeroConstancia: row.NUMERO_CONSTANCIA,
  };
}

async function readCursor(cursor: oracledb.ResultSet<any>) {
  const rows = await cursor.getRows();
  await cursor.close();
  return rows.map(mapRetencion);
}

export async function listarRetenciones(_req: Request, res: Response) {
  try {
    const retenciones = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_RETENCION.SP_GET_ALL(:p_cursor); END;`,
        { p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).p_cursor as oracledb.ResultSet<any>;
      return readCursor(cursor);
    });
    res.json(retenciones);
  } catch (err: any) {
    res.status(500).json({ message: "Error al listar retenciones", error: err.message });
  }
}

export async function obtenerRetencion(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "El id debe ser numerico" });

  try {
    const retencion = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_RETENCION.SP_GET_BY_ID(:p_id_retencion, :p_cursor); END;`,
        {
          p_id_retencion: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).p_cursor as oracledb.ResultSet<any>;
      const rows = await readCursor(cursor);
      return rows[0] ?? null;
    });

    if (!retencion) return res.status(404).json({ message: `Retención ${id} no encontrada` });
    res.json(retencion);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener retención", error: err.message });
  }
}

export async function crearRetencion(req: Request, res: Response) {
  const { idFacturaProveedor, tipoRetencion, baseImponible, porcentaje, monto, numeroConstancia } = req.body;

  if (!idFacturaProveedor || !tipoRetencion || baseImponible == null || porcentaje == null || monto == null) {
    return res.status(400).json({ message: "Faltan campos requeridos" });
  }

  try {
    const idGenerado = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_RETENCION.SP_INSERT(
            :p_id_factura_proveedor, :p_tipo_retencion, :p_base_imponible, 
            :p_porcentaje, :p_monto, :p_numero_constancia, :p_id_out
         ); END;`,
        {
          p_id_factura_proveedor: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: idFacturaProveedor },
          p_tipo_retencion: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: tipoRetencion },
          p_base_imponible: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: baseImponible },
          p_porcentaje: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: porcentaje },
          p_monto: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: monto },
          p_numero_constancia: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: numeroConstancia || null },
          p_id_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true }
      );
      return (result.outBinds as any).p_id_out as number;
    });
    res.status(201).json({ message: "Retención creada", idRetencion: idGenerado });
  } catch (err: any) {
    const negocioMsg = obtenerMensajeNegocio(err);
    if (negocioMsg) return res.status(400).json({ message: negocioMsg });
    res.status(500).json({ message: "Error al crear retención", error: err.message });
  }
}

export async function actualizarRetencion(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "El id debe ser numerico" });

  const { idFacturaProveedor, tipoRetencion, baseImponible, porcentaje, monto, numeroConstancia } = req.body;

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CP_RETENCION.SP_UPDATE(
            :p_id_retencion, :p_id_factura_proveedor, :p_tipo_retencion, 
            :p_base_imponible, :p_porcentaje, :p_monto, :p_numero_constancia
         ); END;`,
        {
          p_id_retencion: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_id_factura_proveedor: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: idFacturaProveedor },
          p_tipo_retencion: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: tipoRetencion },
          p_base_imponible: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: baseImponible },
          p_porcentaje: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: porcentaje },
          p_monto: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: monto },
          p_numero_constancia: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: numeroConstancia || null },
        },
        { autoCommit: true }
      );
    });
    res.json({ message: `Retención ${id} actualizada` });
  } catch (err: any) {
    const negocioMsg = obtenerMensajeNegocio(err);
    if (negocioMsg) return res.status(400).json({ message: negocioMsg });
    res.status(500).json({ message: "Error al actualizar retención", error: err.message });
  }
}

export async function eliminarRetencion(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "El id debe ser numerico" });

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CP_RETENCION.SP_DELETE(:p_id_retencion); END;`,
        { p_id_retencion: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id } },
        { autoCommit: true }
      );
    });
    res.json({ message: `Retención ${id} eliminada` });
  } catch (err: any) {
    const negocioMsg = obtenerMensajeNegocio(err);
    if (negocioMsg) return res.status(400).json({ message: negocioMsg });
    res.status(500).json({ message: "Error al eliminar retención", error: err.message });
  }
}