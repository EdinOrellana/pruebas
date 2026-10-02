import { Request, Response } from 'express';
import oracledb from 'oracledb';
import { AppDataSource } from '../data-source';

export class CajaChicaMovimientoHandler {
  private static async getNativeConnection(queryRunner: any): Promise<oracledb.Connection> {
    return queryRunner.databaseConnection || queryRunner.connection?.driver?.databaseConnection;
  }

  /**
   * Convierte un error de Oracle en un mensaje amigable para el usuario.
   * Extrae errores ORA-200XX (personalizados con RAISE_APPLICATION_ERROR)
   * y traduce errores del sistema a mensajes entendibles.
   */
  private static parsearMensajeOracle(error: any): string {
    const raw: string = error?.message || String(error) || '';

    // ORA-200XX = errores personalizados definidos en el paquete PL/SQL
    // Formato: "ORA-20001: Mensaje amigable\nORA-06512: ..."
    const customMatch = raw.match(/ORA-20\d{3}:\s*([^\n\r]+)/);
    if (customMatch) {
      return customMatch[1].trim();
    }

    // Errores del sistema Oracle mapeados a mensajes comprensibles
    if (raw.includes('ORA-02290') || raw.includes('restricci') && raw.includes('control')) {
      return 'El valor ingresado no está permitido. Verifique que el tipo de movimiento sea válido.';
    }
    if (raw.includes('ORA-01400') || raw.includes('no puede ser nulo')) {
      return 'Hay campos obligatorios sin completar. Por favor, llene todos los campos requeridos.';
    }
    if (raw.includes('ORA-00001') || raw.includes('restricción única') || raw.includes('unique constraint')) {
      return 'Ya existe un registro con esos datos. No se permiten valores duplicados.';
    }
    if (raw.includes('ORA-02291') || raw.includes('integridad referencial')) {
      return 'La caja chica seleccionada no existe o no está disponible en el sistema.';
    }
    if (raw.includes('ORA-01403') || raw.includes('NO_DATA_FOUND')) {
      return 'No se encontró el registro solicitado en la base de datos.';
    }
    if (raw.includes('ORA-04068') || raw.includes('ORA-04061')) {
      return 'La configuración del módulo fue actualizada. Por favor, recargue la página e intente de nuevo.';
    }
    if (raw.includes('ORA-06550') || raw.includes('PLS-00')) {
      return 'Error de configuración en la base de datos. Verifique que el paquete Oracle esté compilado y contacte al administrador.';
    }
    if (raw.includes('ORA-12541') || raw.includes('TNS:no listener')) {
      return 'No se pudo conectar con la base de datos. Verifique que el servidor Oracle esté activo.';
    }

    // Fallback genérico
    return 'Ocurrió un error al procesar la operación. Por favor, intente de nuevo.';
  }

  /**
   * GET /api/caja-chica-movimientos/tipos
   * Llama a CP_PKG_CAJA_CHICA_MOVIMIENTO.LISTAR_TIPOS
   */
  static async getTiposMovimiento(_req: Request, res: Response): Promise<void> {
    let queryRunner;
    try {
      queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      const connection = await CajaChicaMovimientoHandler.getNativeConnection(queryRunner);

      const binds = {
        p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
      };

      const result = await connection.execute(
        `BEGIN CP_PKG_CAJA_CHICA_MOVIMIENTO.LISTAR_TIPOS(:p_cursor); END;`,
        binds,
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const resultSet = (result.outBinds as any)?.p_cursor as oracledb.ResultSet<any>;
      const rows: any[] = [];
      let row: any;

      if (resultSet) {
        while ((row = await resultSet.getRow())) {
          rows.push({
            codigo: row.CODIGO,
            descripcion: row.CODIGO,
          });
        }
        await resultSet.close();
      }

      res.status(200).json(rows);
    } catch (error: any) {
      console.error('Error al listar tipos de movimiento:', error);
      res.status(500).json({ error: error.message || 'Error al listar tipos de movimiento desde paquete' });
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  /**
   * GET /api/caja-chica-movimientos/cajas
   * Lista las cajas chicas disponibles
   */
  static async getCajasDisponibles(_req: Request, res: Response): Promise<void> {
    let queryRunner;
    try {
      queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      const connection = await CajaChicaMovimientoHandler.getNativeConnection(queryRunner);

      const result = await connection.execute(
        `SELECT C.ID_CAJA_CHICA, C.FONDO_ASIGNADO, C.ESTADO 
         FROM CP_CAJA_CHICA C
         ORDER BY C.ID_CAJA_CHICA ASC`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      const rows: any[] = [];
      if (result.rows) {
        for (const row of result.rows as any[]) {
          rows.push({
            idCajaChica: row.ID_CAJA_CHICA,
            nombreSucursal: `Sucursal Central Zona ${row.ID_CAJA_CHICA}`,
            fondoAsignado: Number(row.FONDO_ASIGNADO),
            estado: row.ESTADO,
          });
        }
      }

      res.status(200).json(rows);
    } catch (error: any) {
      console.error('Error al obtener cajas disponibles:', error);
      res.status(500).json({ error: error.message || 'Error al consultar cajas chicas' });
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  /**
   * GET /api/caja-chica-movimientos/:idCaja/estado
   * Llama a CP_PKG_CAJA_CHICA_MOVIMIENTO.OBTENER_SALDO
   */
  static async getEstado(req: Request, res: Response): Promise<void> {
    const idCajaChica = Number(req.params.idCaja) || 1;

    let queryRunner;
    try {
      queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      const connection = await CajaChicaMovimientoHandler.getNativeConnection(queryRunner);

      const binds = {
        p_id_caja_chica: { val: idCajaChica, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
        p_saldo: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      };

      const result = await connection.execute(
        `BEGIN :p_saldo := CP_PKG_CAJA_CHICA_MOVIMIENTO.OBTENER_SALDO(:p_id_caja_chica); END;`,
        binds
      );

      const saldo = Number((result.outBinds as any)?.p_saldo ?? 0);

      const cajaQuery = await connection.execute(
        `SELECT C.ID_CAJA_CHICA, C.FONDO_ASIGNADO, C.ESTADO 
         FROM CP_CAJA_CHICA C 
         WHERE C.ID_CAJA_CHICA = :idCaja`,
        [idCajaChica],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );

      let fondoAsignado = 0;
      let nombreSucursal = `Sucursal Central Zona ${idCajaChica}`;
      let estado = 'A';

      if (cajaQuery.rows && cajaQuery.rows.length > 0) {
        const row: any = cajaQuery.rows[0];
        fondoAsignado = Number(row.FONDO_ASIGNADO) || 0;
        estado = row.ESTADO || 'A';
      }

      res.status(200).json({
        idCajaChica,
        nombreSucursal,
        fondoAsignado,
        saldoActual: saldo,
        estado,
      });
    } catch (error: any) {
      console.error('Error al obtener estado de caja chica:', error.message || error);
      res.status(200).json({
        idCajaChica,
        nombreSucursal: `Sucursal Central Zona ${idCajaChica}`,
        fondoAsignado: 0,
        saldoActual: 0,
        estado: 'A',
      });
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  /**
   * GET /api/caja-chica-movimientos/:idCaja o GET /api/caja-chica-movimientos
   * Llama a CP_PKG_CAJA_CHICA_MOVIMIENTO.LISTAR
   */
  static async getMovimientos(req: Request, res: Response): Promise<void> {
    const idCajaParam = req.params.idCaja;
    const rawId = idCajaParam ? Number(idCajaParam) : null;
    const filterId = (rawId && !isNaN(rawId) && rawId > 0) ? rawId : null;

    const limiteParam = req.query.limite || req.query.limit;
    const offsetParam = req.query.offset || req.query.desplazamiento;
    const limite = limiteParam ? Number(limiteParam) : null;
    const offset = offsetParam ? Number(offsetParam) : null;

    let queryRunner;
    try {
      queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      const connection = await CajaChicaMovimientoHandler.getNativeConnection(queryRunner);

      let result: any;
      let totalRegistros = 0;
      let isFallback = false;

      try {
        const binds = {
          p_id_caja_chica: { val: filterId, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
          p_limite: { val: limite, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
          p_offset: { val: offset, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
          p_total_registros: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
          p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        };

        result = await connection.execute(
          `BEGIN CP_PKG_CAJA_CHICA_MOVIMIENTO.LISTAR(:p_id_caja_chica, :p_limite, :p_offset, :p_total_registros, :p_cursor); END;`,
          binds,
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        totalRegistros = Number((result.outBinds as any)?.p_total_registros ?? 0);
      } catch (plsqlErr: any) {
        if (
          plsqlErr?.code === 'ORA-06550' ||
          plsqlErr?.errorNum === 6550 ||
          String(plsqlErr?.message || '').includes('ORA-06550') ||
          String(plsqlErr?.message || '').includes('PLS-00306')
        ) {
          isFallback = true;
          const fallbackBinds = {
            p_id_caja_chica: { val: filterId, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
            p_cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
          };
          result = await connection.execute(
            `BEGIN CP_PKG_CAJA_CHICA_MOVIMIENTO.LISTAR(:p_id_caja_chica, :p_cursor); END;`,
            fallbackBinds,
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
          );
        } else {
          throw plsqlErr;
        }
      }

      const resultSet = (result.outBinds as any)?.p_cursor as oracledb.ResultSet<any>;
      let rows: any[] = [];
      let row: any;

      if (resultSet) {
        while ((row = await resultSet.getRow())) {
          rows.push({
            idMovimientoCaja: row.ID_MOVIMIENTO_CAJA,
            idCajaChica: row.ID_CAJA_CHICA,
            nombreSucursal: `Sucursal Central Zona ${row.ID_CAJA_CHICA || 1}`,
            fecha: row.FECHA,
            tipoMovimiento: row.TIPO_MOVIMIENTO,
            concepto: row.CONCEPTO,
            monto: Number(row.MONTO),
            numeroComprobante: row.NUMERO_COMPROBANTE,
            saldoDisponible: row.SALDO_DISPONIBLE !== undefined ? Number(row.SALDO_DISPONIBLE) : null,
          });
        }
        await resultSet.close();
      }

      if (isFallback) {
        totalRegistros = rows.length;
        const start = offset ?? 0;
        const count = limite ?? rows.length;
        rows = rows.slice(start, start + count);
      }

      res.status(200).json({
        total: totalRegistros,
        movimientos: rows,
        limite: limite ?? rows.length,
        offset: offset ?? 0,
      });
    } catch (error: any) {
      console.error('Error al obtener movimientos:', error);
      res.status(500).json({ error: error.message || 'Error al obtener movimientos' });
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  /**
   * PUT /api/caja-chica-movimientos/movimiento/:id/anular o PUT /api/caja-chica-movimientos/:id/anular
   * Llama a CP_PKG_CAJA_CHICA_MOVIMIENTO.ANULAR
   */
  static async anularMovimiento(req: Request, res: Response): Promise<void> {
    const idMovimientoCaja = Number(req.params.id);
    const { motivo } = req.body;

    if (isNaN(idMovimientoCaja) || !motivo || !String(motivo).trim()) {
      res.status(400).json({ error: 'El ID de movimiento y el motivo de anulación son obligatorios.' });
      return;
    }

    let queryRunner;
    try {
      queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      const connection = await CajaChicaMovimientoHandler.getNativeConnection(queryRunner);

      const binds = {
        p_id_movimiento_caja: { val: idMovimientoCaja, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
        p_motivo: { val: String(motivo).trim(), dir: oracledb.BIND_IN, type: oracledb.STRING },
      };

      await connection.execute(
        `BEGIN CP_PKG_CAJA_CHICA_MOVIMIENTO.ANULAR(:p_id_movimiento_caja, :p_motivo); END;`,
        binds,
        { autoCommit: true }
      );

      res.status(200).json({ message: 'Movimiento anulado con éxito' });
    } catch (error: any) {
      console.error('Error al anular movimiento:', error);
      const msg = CajaChicaMovimientoHandler.parsearMensajeOracle(error);
      res.status(400).json({ error: msg });
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }

  /**
   * POST /api/caja-chica-movimientos/:idCaja o POST /api/caja-chica-movimientos
   * Llama a CP_PKG_CAJA_CHICA_MOVIMIENTO.INSERTAR
   */
  static async registrarMovimiento(req: Request, res: Response): Promise<void> {
    const idCajaChica = Number(req.body.idCajaChica || req.params.idCaja);
    const { tipoMovimiento, concepto, monto, numeroComprobante } = req.body;

    if (
      isNaN(idCajaChica) ||
      !tipoMovimiento ||
      !concepto ||
      !String(concepto).trim() ||
      monto == null ||
      !numeroComprobante ||
      !String(numeroComprobante).trim()
    ) {
      res.status(400).json({
        error: 'Todos los campos son obligatorios: Caja Chica, Tipo Movimiento, Concepto, Monto y Número de Comprobante.',
      });
      return;
    }

    let queryRunner;
    try {
      queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      const connection = await CajaChicaMovimientoHandler.getNativeConnection(queryRunner);

      const binds = {
        p_id_caja_chica: { val: idCajaChica, dir: oracledb.BIND_IN, type: oracledb.NUMBER },
        p_tipo_movimiento: { val: String(tipoMovimiento).toUpperCase().trim(), dir: oracledb.BIND_IN, type: oracledb.STRING },
        p_concepto: { val: String(concepto).trim(), dir: oracledb.BIND_IN, type: oracledb.STRING },
        p_monto: { val: Number(monto), dir: oracledb.BIND_IN, type: oracledb.NUMBER },
        p_numero_comprobante: {
          val: numeroComprobante ? String(numeroComprobante).trim() : null,
          dir: oracledb.BIND_IN,
          type: oracledb.STRING,
        },
        p_id_movimiento: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
      };

      const result = await connection.execute(
        `BEGIN 
           CP_PKG_CAJA_CHICA_MOVIMIENTO.INSERTAR(
             :p_id_caja_chica,
             :p_tipo_movimiento,
             :p_concepto,
             :p_monto,
             :p_numero_comprobante,
             :p_id_movimiento
           ); 
         END;`,
        binds,
        { autoCommit: true }
      );

      const out = result.outBinds as { p_id_movimiento: number };

      res.status(201).json({
        message: 'Movimiento registrado con éxito',
        idMovimientoCaja: out.p_id_movimiento,
      });
    } catch (error: any) {
      console.error('Error al registrar movimiento:', error);
      const msg = CajaChicaMovimientoHandler.parsearMensajeOracle(error);
      res.status(400).json({ error: msg });
    } finally {
      if (queryRunner) await queryRunner.release();
    }
  }
}