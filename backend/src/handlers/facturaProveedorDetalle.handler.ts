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

function mapDetalle(row: any) {
  return {
    idFacturaProvDetalle: row.ID_FACTURA_PROV_DETALLE,
    idFacturaProveedor: row.ID_FACTURA_PROVEEDOR,
    idArticulo: row.ID_ARTICULO,
    descripcion: row.DESCRIPCION,
    cantidad: row.CANTIDAD,
    precioUnitario: row.PRECIO_UNITARIO,
    idUnidadMedida: row.ID_UNIDAD_MEDIDA,
    subtotal: row.SUBTOTAL,
  };
}

async function readCursor(cursor: oracledb.ResultSet<any>) {
  const rows = await cursor.getRows();
  await cursor.close();
  return rows.map(mapDetalle);
}

/** GET /facturas-proveedor-detalle (opcionalmente filtrado por ?idFacturaProveedor=) */
export async function listarDetalles(req: Request, res: Response) {
  const { idFacturaProveedor } = req.query;
  const idFiltro = idFacturaProveedor != null ? Number(idFacturaProveedor) : null;
  if (idFacturaProveedor != null && Number.isNaN(idFiltro)) {
    return res.status(400).json({ message: "idFacturaProveedor debe ser numerico" });
  }

  try {
    const detalles = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_FACTURA_PROVEEDOR_DETALLE.SP_LISTAR_DETALLE(:p_id_factura_proveedor, :p_cursor); END;`,
        {
          p_id_factura_proveedor: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: idFiltro },
          p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).p_cursor as oracledb.ResultSet<any>;
      return readCursor(cursor);
    });
    res.json(detalles);
  } catch (err: any) {
    res.status(500).json({ message: "Error al listar el detalle de factura de proveedor", error: err.message });
  }
}

/** GET /facturas-proveedor-detalle/:id */
export async function obtenerDetalle(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "El id debe ser numerico" });

  try {
    const detalle = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_FACTURA_PROVEEDOR_DETALLE.SP_OBTENER_DETALLE(:p_id_detalle, :p_cursor); END;`,
        {
          p_id_detalle: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as any).p_cursor as oracledb.ResultSet<any>;
      const rows = await readCursor(cursor);
      return rows[0] ?? null;
    });

    if (!detalle) return res.status(404).json({ message: `Detalle de factura ${id} no encontrado` });
    res.json(detalle);
  } catch (err: any) {
    res.status(500).json({ message: "Error al obtener el detalle de factura de proveedor", error: err.message });
  }
}

/** POST /facturas-proveedor-detalle */
export async function crearDetalle(req: Request, res: Response) {
  const { idFacturaProveedor, idArticulo, descripcion, cantidad, precioUnitario, idUnidadMedida } = req.body;

  if (!idFacturaProveedor || !descripcion || cantidad == null || precioUnitario == null) {
    return res.status(400).json({
      message: "Faltan campos requeridos: idFacturaProveedor, descripcion, cantidad, precioUnitario",
    });
  }

  try {
    const idGenerado = await withOracleConnection(async (conn) => {
      const result = await conn.execute(
        `BEGIN PKG_FACTURA_PROVEEDOR_DETALLE.SP_INSERTAR_DETALLE(
            :p_id_factura_proveedor, :p_id_articulo, :p_descripcion,
            :p_cantidad, :p_precio_unitario, :p_id_unidad_medida, :p_id_out
         ); END;`,
        {
          p_id_factura_proveedor: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(idFacturaProveedor) },
          p_id_articulo: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: idArticulo != null ? Number(idArticulo) : null },
          p_descripcion: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: String(descripcion) },
          p_cantidad: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(cantidad) },
          p_precio_unitario: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(precioUnitario) },
          p_id_unidad_medida: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: idUnidadMedida != null ? Number(idUnidadMedida) : null },
          p_id_out: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        },
        { autoCommit: true }
      );
      return (result.outBinds as any).p_id_out as number;
    });
    res.status(201).json({ message: "Detalle de factura registrado", idFacturaProvDetalle: idGenerado });
  } catch (err: any) {
    const negocioMsg = obtenerMensajeNegocio(err);
    if (negocioMsg) return res.status(400).json({ message: negocioMsg });
    res.status(500).json({ message: "Error al crear el detalle de factura de proveedor", error: err.message });
  }
}

/** PUT /facturas-proveedor-detalle/:id */
export async function actualizarDetalle(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "El id debe ser numerico" });

  const { idArticulo, descripcion, cantidad, precioUnitario, idUnidadMedida } = req.body;

  if (!descripcion || cantidad == null || precioUnitario == null) {
    return res.status(400).json({ message: "Faltan campos requeridos: descripcion, cantidad, precioUnitario" });
  }

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_FACTURA_PROVEEDOR_DETALLE.SP_ACTUALIZAR_DETALLE(
            :p_id_detalle, :p_id_articulo, :p_descripcion,
            :p_cantidad, :p_precio_unitario, :p_id_unidad_medida
         ); END;`,
        {
          p_id_detalle: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id },
          p_id_articulo: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: idArticulo != null ? Number(idArticulo) : null },
          p_descripcion: { dir: oracledb.BIND_IN, type: oracledb.STRING, val: String(descripcion) },
          p_cantidad: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(cantidad) },
          p_precio_unitario: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: Number(precioUnitario) },
          p_id_unidad_medida: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: idUnidadMedida != null ? Number(idUnidadMedida) : null },
        },
        { autoCommit: true }
      );
    });
    res.json({ message: `Detalle de factura ${id} actualizado` });
  } catch (err: any) {
    const negocioMsg = obtenerMensajeNegocio(err);
    if (negocioMsg) return res.status(400).json({ message: negocioMsg });
    res.status(500).json({ message: "Error al actualizar el detalle de factura de proveedor", error: err.message });
  }
}

/** DELETE /facturas-proveedor-detalle/:id -> borrado fisico */
export async function eliminarDetalle(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ message: "El id debe ser numerico" });

  try {
    await withOracleConnection(async (conn) => {
      await conn.execute(
        `BEGIN PKG_FACTURA_PROVEEDOR_DETALLE.SP_ELIMINAR_DETALLE(:p_id_detalle); END;`,
        { p_id_detalle: { dir: oracledb.BIND_IN, type: oracledb.NUMBER, val: id } },
        { autoCommit: true }
      );
    });
    res.json({ message: `Detalle de factura ${id} eliminado` });
  } catch (err: any) {
    const negocioMsg = obtenerMensajeNegocio(err);
    if (negocioMsg) return res.status(400).json({ message: negocioMsg });
    res.status(500).json({ message: "Error al eliminar el detalle de factura de proveedor", error: err.message });
  }
}
