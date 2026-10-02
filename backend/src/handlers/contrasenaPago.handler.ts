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

function mapContrasenaPago(row: any) {
  if (!row) return null;
  const idContrasena = row.ID_CONTRASENA ?? row.id_contrasena ?? row[0];
  const idFacturaProveedor = row.ID_FACTURA_PROVEEDOR ?? row.id_factura_proveedor ?? row[1];
  const fecha = row.FECHA ?? row.fecha ?? row[2];
  const formaPago = row.FORMA_PAGO ?? row.forma_pago ?? row[3];
  const estado = row.ESTADO ?? row.estado ?? row[4];
  const monto = row.MONTO ?? row.monto ?? row[5];
  const idEmpleadoAutoriza = row.ID_EMPLEADO_AUTORIZA ?? row.id_empleado_autoriza ?? row[6] ?? null;
  const notas = row.NOTAS ?? row.notas ?? row[7] ?? null;

  return {
    idContrasena: Number(idContrasena),
    idFacturaProveedor: Number(idFacturaProveedor),
    fecha: fecha ? new Date(fecha).toISOString() : null,
    formaPago: String(formaPago),
    estado: String(estado),
    monto: Number(monto),
    idEmpleadoAutoriza: idEmpleadoAutoriza != null ? Number(idEmpleadoAutoriza) : null,
    notas: notas != null ? String(notas) : null,
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
  return allRows.map(mapContrasenaPago).filter(Boolean);
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

/** Responde 400 con el mensaje de negocio, o 500 con el detalle tecnico. */
function responderError(res: Response, err: any, contexto: string) {
  const negocioMsg = obtenerMensajeNegocio(err);
  if (negocioMsg) {
    return res.status(400).json({ message: negocioMsg });
  }
  console.error(`${contexto}:`, err);
  return res.status(500).json({ message: contexto, details: err.message || String(err) });
}

/**
 * GET /contrasenas-pago
 */
export async function listarContrasenas(_req: Request, res: Response) {
  try {
    const rows = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_CONTRASENA_PAGO.SP_LISTAR_CONTRASENAS(:p_cursor); END;`,
        { p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any)?.p_cursor as oracledb.ResultSet<any>;
      return await readCursor(cursor);
    });
    return res.json(rows);
  } catch (err: any) {
    return responderError(res, err, "Error al listar contraseñas de pago");
  }
}

/**
 * GET /contrasenas-pago/empleados -> empleados activos para el selector "Autoriza".
 * Reutiliza PKG_CAJA_CHICA.SP_LISTAR_EMPLEADOS.
 */
export async function listarEmpleadosAutorizan(_req: Request, res: Response) {
  try {
    const empleados = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CAJA_CHICA.SP_LISTAR_EMPLEADOS(:p_cursor); END;`,
        { p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).p_cursor as oracledb.ResultSet<any>;
      const rows = await cursor.getRows();
      await cursor.close();
      return rows.map((r: any) => ({
        id: Number(r.ID_EMPLEADO),
        codigo: r.CODIGO_EMPLEADO,
        nombre: r.NOMBRE_COMPLETO,
      }));
    });
    return res.json(empleados);
  } catch (err: any) {
    return responderError(res, err, "Error al listar empleados");
  }
}

/**
 * GET /contrasenas-pago/:id
 */
export async function obtenerContrasena(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numérico" });
  }
  try {
    const item = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_CONTRASENA_PAGO.SP_OBTENER_CONTRASENA(:p_id_contrasena, :p_cursor); END;`,
        {
          p_id_contrasena: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any)?.p_cursor as oracledb.ResultSet<any>;
      const rows = await readCursor(cursor);
      return rows[0] ?? null;
    });

    if (!item) {
      return res.status(404).json({ message: `Contraseña de pago ${id} no encontrada` });
    }
    return res.json(item);
  } catch (err: any) {
    return responderError(res, err, "Error al obtener contraseña de pago");
  }
}

/**
 * POST /contrasenas-pago
 * Las reglas (estado de la factura, monto vs saldo disponible, empleado activo)
 * se validan en PKG_CP_CONTRASENA_PAGO.SP_INSERTAR_CONTRASENA.
 */
export async function crearContrasena(req: Request, res: Response) {
  const { idFacturaProveedor, fecha, formaPago, monto, idEmpleadoAutoriza } = req.body;

  if (idFacturaProveedor == null || !formaPago || monto == null) {
    return res.status(400).json({
      message: "Faltan campos requeridos: idFacturaProveedor, formaPago, monto",
    });
  }

  const fechaValida = fecha ? new Date(fecha) : new Date();

  try {
    const idGenerado = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_CONTRASENA_PAGO.SP_INSERTAR_CONTRASENA(
            :p_id_factura_proveedor,
            :p_fecha,
            :p_forma_pago,
            :p_monto,
            :p_id_empleado_autoriza,
            :p_id_contrasena_out
         ); END;`,
        {
          p_id_factura_proveedor: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(idFacturaProveedor) },
          p_fecha: { dir: oracledb.BIND_IN, type: oracledb.DATE, val: fechaValida },
          p_forma_pago: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: String(formaPago) },
          p_monto: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(monto) },
          p_id_empleado_autoriza: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: idEmpleadoAutoriza ? Number(idEmpleadoAutoriza) : null },
          p_id_contrasena_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true }
      );
      return (result.outBinds as any)?.p_id_contrasena_out as number;
    });

    return res.status(201).json({ message: "Contraseña de pago creada", idContrasena: idGenerado });
  } catch (err: any) {
    return responderError(res, err, "Error al crear contraseña de pago");
  }
}

/**
 * PUT /contrasenas-pago/:id  (solo contraseñas PENDIENTES)
 */
export async function actualizarContrasena(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numérico" });
  }

  const { formaPago, monto, idEmpleadoAutoriza } = req.body;
  if (!formaPago || monto == null) {
    return res.status(400).json({
      message: "Faltan campos requeridos: formaPago, monto",
    });
  }

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CP_CONTRASENA_PAGO.SP_ACTUALIZAR_CONTRASENA(
            :p_id_contrasena,
            :p_forma_pago,
            :p_monto,
            :p_id_empleado_autoriza
         ); END;`,
        {
          p_id_contrasena: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_forma_pago: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: String(formaPago) },
          p_monto: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(monto) },
          p_id_empleado_autoriza: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: idEmpleadoAutoriza ? Number(idEmpleadoAutoriza) : null },
        },
        { autoCommit: true }
      );
    });

    return res.json({ message: `Contraseña de pago ${id} actualizada` });
  } catch (err: any) {
    return responderError(res, err, "Error al actualizar contraseña de pago");
  }
}

/**
 * PUT /contrasenas-pago/:id/pagar -> registra el pago directo de una contraseña
 * TRANSFERENCIA / EFECTIVO: PENDIENTE -> PAGADA y descuenta el saldo de la factura.
 */
export async function registrarPagoContrasena(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numérico" });
  }

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CP_CONTRASENA_PAGO.SP_REGISTRAR_PAGO(:p_id_contrasena); END;`,
        { p_id_contrasena: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id } },
        { autoCommit: true }
      );
    });

    return res.json({ message: `Pago de la contraseña ${id} registrado` });
  } catch (err: any) {
    return responderError(res, err, "Error al registrar el pago de la contraseña");
  }
}

/**
 * PUT /contrasenas-pago/:id/anular -> anular (solo contraseñas PENDIENTES).
 * Body: { motivo } obligatorio; queda guardado en la columna NOTAS.
 */
export async function anularContrasena(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numérico" });
  }
  const motivo = req.body?.motivo != null ? String(req.body.motivo).trim() : "";
  if (!motivo) {
    return res.status(400).json({ message: "El motivo de anulación es obligatorio" });
  }

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CP_CONTRASENA_PAGO.SP_ANULAR_CONTRASENA(:p_id_contrasena, :p_motivo); END;`,
        {
          p_id_contrasena: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_motivo: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: motivo },
        },
        { autoCommit: true }
      );
    });

    return res.json({ message: `Contraseña de pago ${id} anulada` });
  } catch (err: any) {
    return responderError(res, err, "Error al anular contraseña de pago");
  }
}
