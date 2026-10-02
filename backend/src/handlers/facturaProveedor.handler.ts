import { Request, Response } from "express";
import oracledb from "oracledb";
import { AppDataSource } from "../data-source";

/** Ejecuta una función recibiendo la conexión CRUDA de node-oracledb. */
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

/** Convierte una fila de VW_CP_FACTURA_PROVEEDOR al shape de FacturaProveedor. */
function mapFacturaProveedor(row: any) {
  if (!row) return null;
  const num = (v: any) => (v != null ? Number(v) : 0);
  const fecha = (v: any) => (v ? new Date(v).toISOString() : null);

  return {
    idFacturaProveedor: Number(row.ID_FACTURA_PROVEEDOR),
    idProveedor: Number(row.ID_PROVEEDOR),
    nitProveedor: row.NIT_PROVEEDOR ?? null,
    nombreProveedor: row.NOMBRE_PROVEEDOR ?? null,
    tipoDocumento: String(row.TIPO_DOCUMENTO),
    numeroDte: row.NUMERO_DTE ? String(row.NUMERO_DTE) : null,
    serieDte: row.SERIE_DTE ? String(row.SERIE_DTE) : null,
    fechaEmision: fecha(row.FECHA_EMISION),
    fechaDocumento: fecha(row.FECHA_DOCUMENTO),
    fechaVencimiento: fecha(row.FECHA_VENCIMIENTO),
    montoTotal: num(row.MONTO_TOTAL),
    montoRetencionIva: num(row.MONTO_RETENCION_IVA),
    montoRetencionIsr: num(row.MONTO_RETENCION_ISR),
    saldoPendiente: num(row.SALDO_PENDIENTE),
    estado: String(row.ESTADO ?? "PENDIENTE"),
    idFacturaReferencia: row.ID_FACTURA_REFERENCIA != null ? Number(row.ID_FACTURA_REFERENCIA) : null,
    notas: row.NOTAS != null ? String(row.NOTAS) : null,
    montoNotasCredito: num(row.MONTO_NOTAS_CREDITO),
    montoNotasDebito: num(row.MONTO_NOTAS_DEBITO),
    notasActivas: num(row.NOTAS_ACTIVAS),
    montoPagado: num(row.MONTO_PAGADO),
    contrasenasActivas: num(row.CONTRASENAS_ACTIVAS),
  };
}

/** Convierte una fila de la BD al shape de FacturaProveedorDetalle. */
function mapFacturaProveedorDetalle(row: any) {
  if (!row) return null;
  return {
    idFacturaProvDetalle: Number(row.ID_FACTURA_PROV_DETALLE),
    idFacturaProveedor: Number(row.ID_FACTURA_PROVEEDOR),
    idArticulo: row.ID_ARTICULO != null ? Number(row.ID_ARTICULO) : null,
    descripcion: String(row.DESCRIPCION),
    cantidad: Number(row.CANTIDAD),
    precioUnitario: Number(row.PRECIO_UNITARIO),
    idUnidadMedida: row.ID_UNIDAD_MEDIDA != null ? Number(row.ID_UNIDAD_MEDIDA) : null,
    unidadMedida: row.UNIDAD_MEDIDA ?? null,
    subtotal: Number(row.SUBTOTAL),
  };
}

/** Lee todas las filas de un REF CURSOR con numRows y lo cierra de forma segura. */
async function readCursor<T>(cursor: oracledb.ResultSet<any>, mapper: (row: any) => T | null): Promise<T[]> {
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
  return allRows.map(mapper).filter((item): item is T => item !== null);
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

/** Fecha opcional del body ("YYYY-MM-DD") -> Date, o null. */
function toDate(value: any): Date | null {
  return value ? new Date(value) : null;
}

/** Texto opcional del body -> string sin espacios extremos, o null. */
function toText(value: any): string | null {
  const s = value != null ? String(value).trim() : "";
  return s ? s : null;
}

/**
 * GET /facturas-proveedor
 */
export async function listarFacturas(_req: Request, res: Response) {
  try {
    const rows = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_FACTURA_PROVEEDOR.SP_LISTAR_FACTURAS(:p_cursor); END;`,
        { p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any)?.p_cursor as oracledb.ResultSet<any>;
      return await readCursor(cursor, mapFacturaProveedor);
    });
    return res.json(rows);
  } catch (err: any) {
    return responderError(res, err, "Error al listar facturas de proveedor");
  }
}

/**
 * GET /facturas-proveedor/proveedores -> proveedores activos (tabla PROVEEDOR) para el selector.
 */
export async function listarProveedores(_req: Request, res: Response) {
  try {
    const proveedores = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_FACTURA_PROVEEDOR.SP_LISTAR_PROVEEDORES(:p_cursor); END;`,
        { p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any)?.p_cursor as oracledb.ResultSet<any>;
      return await readCursor(cursor, (r: any) => ({
        idProveedor: Number(r.ID_PROVEEDOR),
        nit: String(r.NIT),
        razonSocial: String(r.RAZON_SOCIAL),
        nombreComercial: r.NOMBRE_COMERCIAL ?? null,
        diasCredito: r.DIAS_CREDITO != null ? Number(r.DIAS_CREDITO) : 0,
      }));
    });
    return res.json(proveedores);
  } catch (err: any) {
    return responderError(res, err, "Error al listar proveedores");
  }
}

/**
 * GET /facturas-proveedor/:id
 */
export async function obtenerFactura(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numérico" });
  }
  try {
    const { factura, detalles } = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_CP_FACTURA_PROVEEDOR.SP_OBTENER_FACTURA(:p_id_factura, :p_cursor, :p_cursor_detalle); END;`,
        {
          p_id_factura: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          p_cursor_detalle: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursorEnc = (result.outBinds as any)?.p_cursor as oracledb.ResultSet<any>;
      const cursorDet = (result.outBinds as any)?.p_cursor_detalle as oracledb.ResultSet<any>;
      const listEnc = await readCursor(cursorEnc, mapFacturaProveedor);
      const listDet = await readCursor(cursorDet, mapFacturaProveedorDetalle);
      return { factura: listEnc[0] ?? null, detalles: listDet };
    });

    if (!factura) {
      return res.status(404).json({ message: `Factura de proveedor ${id} no encontrada` });
    }
    return res.json({ ...factura, detalles });
  } catch (err: any) {
    return responderError(res, err, "Error al obtener factura de proveedor");
  }
}

/**
 * POST /facturas-proveedor
 * Encabezado + lineas en UNA transaccion: si una linea falla no queda nada guardado.
 * El monto total, las retenciones, el saldo y el estado los calcula el paquete PL/SQL.
 */
export async function crearFactura(req: Request, res: Response) {
  const {
    idProveedor,
    tipoDocumento,
    numeroDte,
    serieDte,
    fechaEmision,
    fechaDocumento,
    fechaVencimiento,
    idFacturaReferencia,
    detalles,
  } = req.body;

  if (idProveedor == null || !tipoDocumento) {
    return res.status(400).json({ message: "Faltan campos requeridos: idProveedor, tipoDocumento" });
  }
  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ message: "El documento debe tener al menos una línea de detalle" });
  }

  try {
    const idGenerado = await withOracleConnection(async (conn) => {
      try {
        const result = await conn.execute(
          `BEGIN PKG_CP_FACTURA_PROVEEDOR.SP_INSERTAR_FACTURA(
              :p_id_proveedor,
              :p_tipo_documento,
              :p_numero_dte,
              :p_serie_dte,
              :p_fecha_emision,
              :p_fecha_documento,
              :p_fecha_vencimiento,
              :p_id_factura_referencia,
              :p_id_factura_out
           ); END;`,
          {
            p_id_proveedor: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(idProveedor) },
            p_tipo_documento: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: String(tipoDocumento) },
            p_numero_dte: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: toText(numeroDte) },
            p_serie_dte: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: toText(serieDte) },
            p_fecha_emision: { dir: oracledb.BIND_IN, type: oracledb.DATE, val: toDate(fechaEmision) },
            p_fecha_documento: { dir: oracledb.BIND_IN, type: oracledb.DATE, val: toDate(fechaDocumento) },
            p_fecha_vencimiento: { dir: oracledb.BIND_IN, type: oracledb.DATE, val: toDate(fechaVencimiento) },
            p_id_factura_referencia: {
              dir: oracledb.BIND_IN,
              type: oracledb.NUMBER,
              val: idFacturaReferencia ? Number(idFacturaReferencia) : null,
            },
            p_id_factura_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
          }
        );
        const idFactura = (result.outBinds as any)?.p_id_factura_out as number;

        for (const det of detalles) {
          await conn.execute(
            `BEGIN PKG_FACTURA_PROVEEDOR_DETALLE.SP_INSERTAR_DETALLE(
                :p_id_factura, :p_id_articulo, :p_descripcion, :p_cantidad,
                :p_precio_unitario, :p_id_unidad_medida, :p_id_detalle_out
             ); END;`,
            {
              p_id_factura: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: idFactura },
              p_id_articulo: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: det.idArticulo ? Number(det.idArticulo) : null },
              p_descripcion: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: toText(det.descripcion) },
              p_cantidad: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(det.cantidad) },
              p_precio_unitario: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(det.precioUnitario) },
              p_id_unidad_medida: {
                dir: oracledb.BIND_IN,
                type: oracledb.NUMBER,
                val: det.idUnidadMedida ? Number(det.idUnidadMedida) : null,
              },
              p_id_detalle_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
            }
          );
        }

        await conn.execute(`BEGIN PKG_CP_FACTURA_PROVEEDOR.SP_VALIDAR_TIENE_DETALLE(:p_id); END;`, {
          p_id: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: idFactura },
        });

        await conn.commit();
        return idFactura;
      } catch (err) {
        await conn.rollback();
        throw err;
      }
    });

    return res.status(201).json({ message: "Factura de proveedor registrada", idFacturaProveedor: idGenerado });
  } catch (err: any) {
    return responderError(res, err, "Error al crear factura de proveedor");
  }
}

/**
 * PUT /facturas-proveedor/:id -> solo datos del encabezado (proveedor, DTE, fechas, referencia).
 * El total sale de las lineas y las retenciones de la vista Retenciones.
 */
export async function actualizarFactura(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: "El id debe ser numérico" });
  }

  const {
    idProveedor,
    numeroDte,
    serieDte,
    fechaEmision,
    fechaDocumento,
    fechaVencimiento,
    idFacturaReferencia,
  } = req.body;

  if (idProveedor == null) {
    return res.status(400).json({ message: "Falta el campo requerido: idProveedor" });
  }

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_CP_FACTURA_PROVEEDOR.SP_ACTUALIZAR_FACTURA(
            :p_id_factura,
            :p_id_proveedor,
            :p_numero_dte,
            :p_serie_dte,
            :p_fecha_emision,
            :p_fecha_documento,
            :p_fecha_vencimiento,
            :p_id_factura_referencia
         ); END;`,
        {
          p_id_factura: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_id_proveedor: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(idProveedor) },
          p_numero_dte: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: toText(numeroDte) },
          p_serie_dte: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: toText(serieDte) },
          p_fecha_emision: { dir: oracledb.BIND_IN, type: oracledb.DATE, val: toDate(fechaEmision) },
          p_fecha_documento: { dir: oracledb.BIND_IN, type: oracledb.DATE, val: toDate(fechaDocumento) },
          p_fecha_vencimiento: { dir: oracledb.BIND_IN, type: oracledb.DATE, val: toDate(fechaVencimiento) },
          p_id_factura_referencia: {
            dir: oracledb.BIND_IN,
            type: oracledb.NUMBER,
            val: idFacturaReferencia ? Number(idFacturaReferencia) : null,
          },
        },
        { autoCommit: true }
      );
    });

    return res.json({ message: `Factura de proveedor ${id} actualizada` });
  } catch (err: any) {
    return responderError(res, err, "Error al actualizar factura de proveedor");
  }
}

/**
 * PUT /facturas-proveedor/:id/anular -> anular (sin contrasenas ni notas activas).
 * Body: { motivo } obligatorio; queda guardado en la columna NOTAS.
 */
export async function anularFactura(req: Request, res: Response) {
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
        `BEGIN PKG_CP_FACTURA_PROVEEDOR.SP_ANULAR_FACTURA(:p_id_factura, :p_motivo); END;`,
        {
          p_id_factura: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_motivo: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: motivo },
        },
        { autoCommit: true }
      );
    });

    return res.json({ message: `Factura de proveedor ${id} anulada` });
  } catch (err: any) {
    return responderError(res, err, "Error al anular factura de proveedor");
  }
}
