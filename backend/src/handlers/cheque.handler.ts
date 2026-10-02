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

function mapCheque(row: any) {
  if (!row) return null;
  const idCheque = row.ID_CHEQUE ?? row.id_cheque ?? row[0];
  const idContrasenaPago = row.ID_CONTRASENA_PAGO ?? row.id_contrasena_pago ?? row[1];
  const banco = row.BANCO ?? row.banco ?? row[2];
  const numeroCheque = row.NUMERO_CHEQUE ?? row.numero_cheque ?? row[3];
  const fechaEmision = row.FECHA_EMISION ?? row.fecha_emision ?? row[4];
  const fechaCobro = row.FECHA_COBRO ?? row.fecha_cobro ?? row[5];
  const estado = row.ESTADO ?? row.estado ?? row[6];

  return {
    idCheque: Number(idCheque),
    idContrasenaPago: Number(idContrasenaPago),
    banco: String(banco),
    numeroCheque: String(numeroCheque),
    fechaEmision: fechaEmision ? new Date(fechaEmision).toISOString() : null,
    fechaCobro: fechaCobro ? new Date(fechaCobro).toISOString() : null,
    estado: String(estado),
  };
}

async function readCursor(cursor: oracledb.ResultSet<any>) {
  if (!cursor) return [];
  const allRows: any[] = [];
  let rows: any[];
  do {
    rows = await cursor.getRows(100);
    if (rows && rows.length > 0) {
      allRows.push(...rows);
    }
  } while (rows && rows.length > 0);
  await cursor.close();
  return allRows.map(mapCheque).filter(Boolean);
}

/**
 * Si el error viene de un RAISE_APPLICATION_ERROR (ORA-20XXX) del paquete
 * PL/SQL, extrae el mensaje de negocio legible. Si no, devuelve null
 * (error tecnico/sistema, debe responderse como 500).
 */
function obtenerMensajeNegocio(error: any): string | null {
  const raw: string = error?.message || String(error) || "";
  const match = raw.match(/ORA-20\d{3}:\s*([^\n\r]+)/);
  return match ? match[1].trim() : null;
}

/**
 * GET /cheques
 */
export async function listarCheques(_req: Request, res: Response) {
  try {
    const rows = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_CHEQUE.SP_LISTAR_CHEQUES(:p_cursor); END;`,
        { p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any)?.p_cursor as oracledb.ResultSet<any>;
      return await readCursor(cursor);
    });
    return res.json(rows);
  } catch (err: any) {
    console.error("Error al listar cheques:", err);
    return res.status(500).json({ message: "Error al listar cheques", details: err.message || String(err) });
  }
}

/**
 * GET /cheques/:id
 */
export async function obtenerCheque(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numérico" });
  }
  try {
    const item = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_CHEQUE.SP_OBTENER_CHEQUE(:p_id_cheque, :p_cursor); END;`,
        {
          p_id_cheque: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any)?.p_cursor as oracledb.ResultSet<any>;
      const rows = await readCursor(cursor);
      return rows[0] ?? null;
    });

    if (!item) {
      return res.status(404).json({ message: `Cheque ${id} no encontrado` });
    }
    return res.json(item);
  } catch (err: any) {
    console.error("Error al obtener cheque:", err);
    return res.status(500).json({ message: "Error al obtener cheque", details: err.message || String(err) });
  }
}

/**
 * POST /cheques
 */
export async function crearCheque(req: Request, res: Response) {
  const { idContrasenaPago, banco, numeroCheque, fechaEmision } = req.body;

  if (idContrasenaPago == null || !banco || !numeroCheque) {
    return res.status(400).json({ message: "Faltan campos requeridos: idContrasenaPago, banco, numeroCheque" });
  }

  const fEmision = fechaEmision ? new Date(fechaEmision) : new Date();

  try {
    const idGenerado = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_CHEQUE.SP_INSERTAR_CHEQUE(
            :p_id_contrasena_pago,
            :p_banco,
            :p_numero_cheque,
            :p_fecha_emision,
            :p_id_cheque_out
         ); END;`,
        {
          p_id_contrasena_pago: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(idContrasenaPago) },
          p_banco: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: String(banco) },
          p_numero_cheque: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: String(numeroCheque) },
          p_fecha_emision: { dir: oracledb.BIND_IN, type: oracledb.DATE, val: fEmision },
          p_id_cheque_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true }
      );
      return (result.outBinds as any)?.p_id_cheque_out as number;
    });

    return res.status(201).json({ message: "Cheque creado correctamente", idCheque: idGenerado });
  } catch (err: any) {
    const negocioMsg = obtenerMensajeNegocio(err);
    if (negocioMsg) {
      return res.status(400).json({ message: negocioMsg });
    }
    console.error("Error al crear cheque:", err);
    return res.status(500).json({ message: "Error al crear cheque", details: err.message || String(err) });
  }
}

/**
 * PUT /cheques/:id
 */
export async function actualizarCheque(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numérico" });
  }

  const { banco, numeroCheque, fechaEmision } = req.body;

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CP_CHEQUE.SP_ACTUALIZAR_CHEQUE(:p_id_cheque, :p_banco, :p_numero_cheque, :p_fecha_emision); END;`,
        {
          p_id_cheque: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_banco: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: String(banco) },
          p_numero_cheque: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: String(numeroCheque) },
          p_fecha_emision: { dir: oracledb.BIND_IN, type: oracledb.DATE, val: new Date(fechaEmision) },
        },
        { autoCommit: true }
      );
    });

    return res.json({ message: `Cheque ${id} actualizado` });
  } catch (err: any) {
    const negocioMsg = obtenerMensajeNegocio(err);
    if (negocioMsg) {
      return res.status(400).json({ message: negocioMsg });
    }
    console.error("Error al actualizar cheque:", err);
    return res.status(500).json({ message: "Error al actualizar cheque", details: err.message || String(err) });
  }
}

/**
 * PUT /cheques/:id/cobrar
 */
export async function cobrarCheque(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numérico" });
  }

  const { fechaCobro } = req.body;
  if (!fechaCobro) {
    return res.status(400).json({ message: "La fecha de cobro es requerida" });
  }

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CP_CHEQUE.SP_COBRAR_CHEQUE(:p_id_cheque, :p_fecha_cobro); END;`,
        {
          p_id_cheque: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_fecha_cobro: { dir: oracledb.BIND_IN, type: oracledb.DATE, val: new Date(fechaCobro) },
        },
        { autoCommit: true }
      );
    });

    return res.json({ message: `Cheque ${id} cobrado correctamente` });
  } catch (err: any) {
    const negocioMsg = obtenerMensajeNegocio(err);
    if (negocioMsg) {
      return res.status(400).json({ message: negocioMsg });
    }
    console.error("Error al cobrar cheque:", err);
    return res.status(500).json({ message: "Error al cobrar cheque", details: err.message || String(err) });
  }
}

/**
 * DELETE /cheques/:id -> anular
 */
export async function anularCheque(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numérico" });
  }

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CP_CHEQUE.SP_ANULAR_CHEQUE(:p_id_cheque); END;`,
        { p_id_cheque: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id } },
        { autoCommit: true }
      );
    });

    return res.json({ message: `Cheque ${id} anulado` });
  } catch (err: any) {
    const negocioMsg = obtenerMensajeNegocio(err);
    if (negocioMsg) {
      return res.status(400).json({ message: negocioMsg });
    }
    console.error("Error al anular cheque:", err);
    return res.status(500).json({ message: "Error al anular cheque", details: err.message || String(err) });
  }
}
