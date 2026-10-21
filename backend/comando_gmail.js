const nodemailer = require('nodemailer');
const pool = require('./db');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Remitente emisor fijo (inglesnaipe61@gmail.com por defecto desde .env)
let DEFAULT_EMAIL_TO = process.env.REPORT_EMAIL_TO || '';     
let DEFAULT_EMAIL_FROM = process.env.REPORT_EMAIL_FROM || 'inglesnaipe61@gmail.com'; 
let SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
let SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
let SMTP_SECURE = process.env.SMTP_SECURE === 'true';
let SMTP_USER = process.env.SMTP_USER || 'inglesnaipe61@gmail.com';
let SMTP_PASS = process.env.SMTP_PASS || '';

// Cargar únicamente la dirección destinatario de la base de datos
const loadConfigFromDB = async () => {
  try {
    const res = await pool.query('SELECT clave, valor FROM configuracion');
    const dbConfig = {};
    res.rows.forEach(row => {
      dbConfig[row.clave] = row.valor;
    });

    if (dbConfig.REPORT_EMAIL_TO) DEFAULT_EMAIL_TO = dbConfig.REPORT_EMAIL_TO;
    if (dbConfig.REPORT_EMAIL_FROM) DEFAULT_EMAIL_FROM = dbConfig.REPORT_EMAIL_FROM;
    if (dbConfig.SMTP_HOST) SMTP_HOST = dbConfig.SMTP_HOST;
    if (dbConfig.SMTP_PORT) SMTP_PORT = parseInt(dbConfig.SMTP_PORT);
    if (dbConfig.SMTP_SECURE) SMTP_SECURE = dbConfig.SMTP_SECURE === 'true' || dbConfig.SMTP_SECURE === '1';
    if (dbConfig.SMTP_USER) SMTP_USER = dbConfig.SMTP_USER;
    if (dbConfig.SMTP_PASS) SMTP_PASS = dbConfig.SMTP_PASS;

    console.log('INFO: Configuración de correo cargada desde la base de datos.');
  } catch (err) {
    console.log('WARN: No se pudo cargar la configuración de la DB, usando fallback de .env:', err.message);
  }
};

// Configuración SMTP para nodemailer
const getTransporter = () => {
  const transportOptions = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    connectionTimeout: 8000, // 8 segundos para evitar bloqueos
    greetingTimeout: 8000,
    socketTimeout: 15000,
    tls: {
      rejectUnauthorized: false
    }
  };

  if (SMTP_USER || SMTP_PASS) {
    transportOptions.auth = {
      user: SMTP_USER || DEFAULT_EMAIL_FROM,
      pass: SMTP_PASS
    };
  }

  return nodemailer.createTransport(transportOptions);
};

// Función auxiliar para enviar correos
const sendEmail = async (toEmail, subject, htmlBody, attachments = []) => {
  if (!toEmail) {
    console.error('ERROR: No se especificó dirección de correo destinatario. Saltando envío.');
    return false;
  }
  if (!DEFAULT_EMAIL_FROM) {
    console.error('ERROR: No se configuró el remitente (DEFAULT_EMAIL_FROM). Saltando envío.');
    return false;
  }

  const transporter = getTransporter();
  const mailOptions = {
    from: DEFAULT_EMAIL_FROM,
    to: toEmail,
    subject: subject,
    html: htmlBody,
    attachments: attachments // formato: [{ filename: 'archivo.xlsx', path: 'ruta/al/archivo' }]
  };

  console.log(`INFO: Enviando correo a ${toEmail} desde ${DEFAULT_EMAIL_FROM}...`);
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`INFO: Correo enviado correctamente: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`ERROR: Error enviando correo: ${err.message}`);
    return false;
  }
};

// Función de ejecución principal (el cuerpo de la lógica se construirá desde aquí)
const run = async (options = null) => {
  try {
    // 0. Cargar la configuración dinámica de la base de datos
    await loadConfigFromDB();

    // 0.5. Determinar si es reporte por rango de fechas o por turno
    let isRangeMode = false;
    let fechaInicio = null;
    let fechaFin = null;
    let shiftId = null;

    if (options && typeof options === 'object') {
      if (options.fechaInicio || options.fecha_inicio || options.fecha) {
        isRangeMode = true;
        fechaInicio = options.fechaInicio || options.fecha_inicio || options.fecha;
        fechaFin = options.fechaFin || options.fecha_fin || fechaInicio;
      } else if (options.shiftId || options.turno_id) {
        shiftId = parseInt(options.shiftId || options.turno_id, 10);
      }
    } else if (options) {
      shiftId = parseInt(options, 10);
    }

    if (!isRangeMode && !shiftId && process.argv[2]) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(process.argv[2])) {
        isRangeMode = true;
        fechaInicio = process.argv[2];
        fechaFin = process.argv[3] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[3]) ? process.argv[3] : fechaInicio;
      } else {
        shiftId = parseInt(process.argv[2], 10);
        console.log(`INFO: Se recibió ID de turno por argumento: ${shiftId}`);
      }
    } else if (!isRangeMode && !shiftId) {
      // Priorizar el turno activo si existe, o el último turno registrado
      const activeShiftRes = await pool.query('SELECT id FROM turnos WHERE activo = 1 ORDER BY id DESC LIMIT 1');
      if (activeShiftRes.rows.length > 0) {
        shiftId = activeShiftRes.rows[0].id;
        console.log(`INFO: Se detectó turno activo en curso: #${shiftId}`);
      } else {
        const lastShiftRes = await pool.query('SELECT id FROM turnos ORDER BY id DESC LIMIT 1');
        if (lastShiftRes.rows.length > 0) {
          shiftId = lastShiftRes.rows[0].id;
          console.log(`INFO: No se recibió argumento, usando último turno registrado: #${shiftId}`);
        } else {
          console.log('INFO: No se encontró ningún turno en la base de datos.');
        }
      }
    }

    let filterParams = [];
    let whereClausePedidos = '';
    let whereClauseP = '';
    let entradasWhere = '';
    let consumosWhere = '';
    let gastosWhere = '';
    let rangeTurnosCount = 0;

    if (isRangeMode) {
      filterParams = [fechaInicio, fechaFin];
      whereClausePedidos = '((DATE(fecha_hora) >= $1 AND DATE(fecha_hora) <= $2) OR (turno_id IN (SELECT id FROM turnos WHERE DATE(fecha_hora_inicio) >= $1 AND DATE(fecha_hora_inicio) <= $2)))';
      whereClauseP = '((DATE(p.fecha_hora) >= $1 AND DATE(p.fecha_hora) <= $2) OR (p.turno_id IN (SELECT id FROM turnos WHERE DATE(fecha_hora_inicio) >= $1 AND DATE(fecha_hora_inicio) <= $2)))';
      entradasWhere = '((DATE(e.fecha_hora) >= $1 AND DATE(e.fecha_hora) <= $2) OR (e.turno_id IN (SELECT id FROM turnos WHERE DATE(fecha_hora_inicio) >= $1 AND DATE(fecha_hora_inicio) <= $2)))';
      consumosWhere = '((DATE(c.fecha_hora) >= $1 AND DATE(c.fecha_hora) <= $2) OR (c.turno_id IN (SELECT id FROM turnos WHERE DATE(fecha_hora_inicio) >= $1 AND DATE(fecha_hora_inicio) <= $2)))';
      gastosWhere = '(((fecha >= $1 AND fecha <= $2) OR (DATE(fecha_hora) >= $1 AND DATE(fecha_hora) <= $2)) OR (turno_id IN (SELECT id FROM turnos WHERE DATE(fecha_hora_inicio) >= $1 AND DATE(fecha_hora_inicio) <= $2)))';

      const tCountRes = await pool.query('SELECT count(*) as count FROM turnos WHERE DATE(fecha_hora_inicio) >= $1 AND DATE(fecha_hora_inicio) <= $2', [fechaInicio, fechaFin]);
      rangeTurnosCount = tCountRes.rows.length > 0 ? tCountRes.rows[0].count : 0;
      console.log(`INFO: Generando reporte por intervalo de fechas (${fechaInicio} al ${fechaFin}).`);
    } else if (shiftId) {
      filterParams = [shiftId];
      whereClausePedidos = 'turno_id = $1';
      whereClauseP = 'p.turno_id = $1';
      entradasWhere = 'e.turno_id = $1';
      consumosWhere = 'c.turno_id = $1';
      gastosWhere = 'turno_id = $1 OR (turno_id IS NULL AND DATE(fecha_hora) = (SELECT DATE(fecha_hora_inicio) FROM turnos WHERE id = $1))';
      console.log(`INFO: Generando reporte para turno #${shiftId}.`);
    } else {
      whereClausePedidos = '1=1';
      whereClauseP = '1=1';
      entradasWhere = '1=1';
      consumosWhere = '1=1';
      gastosWhere = '1=1';
    }

    // Obtener información del turno si estamos en modo turno
    let shiftInfo = null;
    if (!isRangeMode && shiftId) {
      const shiftRes = await pool.query(
        'SELECT id, usuario_inicio, usuario_fin, fecha_hora_inicio, fecha_hora_fin, activo, efectivo_inicial::float as efectivo_inicial, efectivo_final::float as efectivo_final, total_ventas::float as total_ventas, total_efectivo::float as total_efectivo, total_tarjeta::float as total_tarjeta, total_gastos::float as total_gastos, diferencia::float as diferencia, observaciones FROM turnos WHERE id = $1',
        [shiftId]
      );
      if (shiftRes.rows.length > 0) {
        shiftInfo = shiftRes.rows[0];
      }
    }

    // Obtener ventas dinámicamente desde pedidos
    let sales = {
      total_ventas: 0,
      total_efectivo: 0,
      total_tarjeta: 0,
      total_debito: 0,
      total_credito: 0,
      cantidad_pedidos: 0,
      cantidad_efectivo: 0,
      cantidad_tarjeta: 0,
      cantidad_externos: 0
    };

    if (isRangeMode || shiftId) {
      const salesRes = await pool.query(`
        SELECT 
          COALESCE(SUM(CASE WHEN tipo_transaccion != 'Pedido Externo' THEN total ELSE 0 END), 0)::FLOAT as total_ventas,
          COALESCE(SUM(CASE WHEN tipo_transaccion = 'Efectivo' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_efectivo, 0) ELSE 0 END), 0)::FLOAT as total_efectivo,
          COALESCE(SUM(CASE WHEN tipo_transaccion IN ('Débito', 'Crédito') THEN total WHEN tipo_transaccion = 'Mixto' THEN (COALESCE(monto_debito, 0) + COALESCE(monto_credito, 0)) ELSE 0 END), 0)::FLOAT as total_tarjeta,
          COALESCE(SUM(CASE WHEN tipo_transaccion = 'Débito' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_debito, 0) ELSE 0 END), 0)::FLOAT as total_debito,
          COALESCE(SUM(CASE WHEN tipo_transaccion = 'Crédito' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_credito, 0) ELSE 0 END), 0)::FLOAT as total_credito,
          COUNT(CASE WHEN tipo_transaccion != 'Pedido Externo' THEN id ELSE NULL END) as cantidad_pedidos,
          COALESCE(SUM(CASE WHEN tipo_transaccion = 'Efectivo' OR (tipo_transaccion = 'Mixto' AND COALESCE(monto_efectivo, 0) > 0) THEN 1 ELSE 0 END), 0) as cantidad_efectivo,
          COALESCE(SUM(CASE WHEN tipo_transaccion IN ('Débito', 'Crédito') OR (tipo_transaccion = 'Mixto' AND (COALESCE(monto_debito, 0) + COALESCE(monto_credito, 0)) > 0) THEN 1 ELSE 0 END), 0) as cantidad_tarjeta,
          COUNT(CASE WHEN tipo_transaccion = 'Pedido Externo' THEN id ELSE NULL END) as cantidad_externos
        FROM pedidos
        WHERE ${whereClausePedidos} AND (eliminado IS FALSE OR eliminado IS NULL)
      `, filterParams);

      if (salesRes.rows.length > 0) {
        sales = salesRes.rows[0];
      }
    }

    // Obtener comandas eliminadas
    let deletedOrders = [];
    if (isRangeMode || shiftId) {
      const deletedRes = await pool.query(`
        SELECT p.id, p.cliente_nombre, p.total, p.fecha_hora, p.atendido_por, p.nota, p.tipo_entrega, p.tipo_transaccion,
               p.eliminado_por, p.eliminado_fecha,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'nombre_producto', dp.nombre_producto,
                     'cantidad', dp.cantidad
                   )
                 ) FILTER (WHERE dp.id IS NOT NULL),
                 '[]'
               ) as productos
        FROM pedidos p
        LEFT JOIN pedido_productos dp ON p.id = dp.pedido_id
        WHERE ${whereClauseP} AND p.eliminado IS TRUE
        GROUP BY p.id
        ORDER BY p.eliminado_fecha DESC
      `, filterParams);
      deletedOrders = deletedRes.rows;
    }

    // Obtener consumo interno / mermas
    let shiftConsumptions = [];
    if (isRangeMode || shiftId) {
      const consumRes = await pool.query(`
        SELECT c.id, c.cantidad, c.fecha_hora, i.nombre as ingrediente_nombre
        FROM consumos_inventario c
        JOIN ingredientes i ON c.ingrediente_id = i.id
        WHERE ${consumosWhere}
        ORDER BY c.fecha_hora DESC
      `, filterParams);
      shiftConsumptions = consumRes.rows;
      console.log(`INFO: Se encontraron ${shiftConsumptions.length} consumos/mermas registrados.`);
    }

    // Obtener ingresos de materia prima
    let shiftArrivals = [];
    if (isRangeMode || shiftId) {
      const arrivalsRes = await pool.query(`
        SELECT e.id, e.cantidad, e.fecha_hora, i.nombre as ingrediente_nombre
        FROM entradas_inventario e
        JOIN ingredientes i ON e.ingrediente_id = i.id
        WHERE ${entradasWhere}
        ORDER BY e.fecha_hora DESC
      `, filterParams);
      shiftArrivals = arrivalsRes.rows;
      console.log(`INFO: Se encontraron ${shiftArrivals.length} ingresos de materia prima registrados.`);
    }

    // Obtener gastos en efectivo
    let shiftExpenses = [];
    if (isRangeMode || shiftId) {
      const expRes = await pool.query(`
        SELECT id, descripcion, monto::float as monto, fecha_hora, COALESCE(registrado_por, 'Cajero') as registrado_por
        FROM gastos_caja
        WHERE ${gastosWhere}
        ORDER BY id DESC
      `, filterParams);
      shiftExpenses = expRes.rows;
      console.log(`INFO: Se encontraron ${shiftExpenses.length} gastos en efectivo.`);
    }

    // Obtener pedidos externos
    let shiftExternalOrders = [];
    if (isRangeMode || shiftId) {
      const extRes = await pool.query(`
        SELECT p.id, p.cliente_nombre, p.total, p.fecha_hora, p.atendido_por, p.nota, p.tipo_entrega, p.tipo_transaccion,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'nombre_producto', dp.nombre_producto,
                     'cantidad', dp.cantidad
                   )
                 ) FILTER (WHERE dp.id IS NOT NULL),
                 '[]'
               ) as productos
        FROM pedidos p
        LEFT JOIN pedido_productos dp ON p.id = dp.pedido_id
        WHERE ${whereClauseP} AND p.tipo_transaccion = 'Pedido Externo' AND (p.eliminado IS FALSE OR p.eliminado IS NULL)
        GROUP BY p.id
        ORDER BY p.fecha_hora DESC
      `, filterParams);
      shiftExternalOrders = extRes.rows;
      console.log(`INFO: Se encontraron ${shiftExternalOrders.length} pedidos externos registrados.`);
    }

    // Obtener consumo real de materia prima (por ventas de productos + promociones + mermas)
    let rawMaterialConsumption = [];
    if (isRangeMode || shiftId) {
      try {
        // 1. Productos individuales vendidos (excluyendo comandas eliminadas)
        const productosShiftRes = await pool.query(`
          SELECT 
            pp.nombre_producto,
            SUM(pp.cantidad)::INTEGER as cantidad_vendida
          FROM pedidos p
          JOIN pedido_productos pp ON p.id = pp.pedido_id
          WHERE ${whereClauseP} AND (p.eliminado IS FALSE OR p.eliminado IS NULL)
          GROUP BY pp.nombre_producto
        `, filterParams);

        // 2. Productos dentro de promociones vendidos
        const promoShiftRes = await pool.query(`
          SELECT 
            pp.promocion_id,
            pp.nombre_producto as promo_nombre,
            pp.cantidad as promo_cantidad,
            pp.productos_incluidos
          FROM pedidos p
          JOIN pedido_productos pp ON p.id = pp.pedido_id
          WHERE ${whereClauseP}
            AND (p.eliminado IS FALSE OR p.eliminado IS NULL)
            AND (
              pp.promocion_id IS NOT NULL 
              OR pp.productos_incluidos IS NOT NULL 
              OR pp.nombre_producto IN (SELECT nombre FROM promociones)
            )
        `, filterParams);

        const mapaProdsPromo = {};
        for (const row of promoShiftRes.rows) {
          let incluidos = row.productos_incluidos;
          if (typeof incluidos === 'string') {
            try { incluidos = JSON.parse(incluidos); } catch(e) { incluidos = null; }
          }

          if (Array.isArray(incluidos) && incluidos.length > 0) {
            for (const item of incluidos) {
              const nom = item.nombre_producto;
              const cant = parseInt(item.cantidad) || 1;
              if (nom) {
                mapaProdsPromo[nom] = (mapaProdsPromo[nom] || 0) + cant;
              }
            }
          } else {
            const promoId = row.promocion_id;
            const promoNombre = row.promo_nombre;
            const qty = parseInt(row.promo_cantidad) || 1;

            const promoRes = await pool.query(
              'SELECT id FROM promociones WHERE id = $1 OR nombre = $2 LIMIT 1',
              [promoId || 0, promoNombre]
            );

            if (promoRes.rows.length > 0) {
              const pid = promoRes.rows[0].id;
              const fijosRes = await pool.query(
                'SELECT p.nombre, pf.cantidad FROM promocion_productos_fijos pf JOIN productos p ON pf.producto_id = p.id WHERE pf.promocion_id = $1',
                [pid]
              );
              for (const f of fijosRes.rows) {
                const nom = f.nombre;
                const cant = (parseInt(f.cantidad) || 1) * qty;
                mapaProdsPromo[nom] = (mapaProdsPromo[nom] || 0) + cant;
              }

              const pasosRes = await pool.query(
                'SELECT pa.id FROM promocion_pasos pa WHERE pa.promocion_id = $1',
                [pid]
              );
              for (const paso of pasosRes.rows) {
                const opcRes = await pool.query(
                  'SELECT p.nombre FROM promocion_opciones op JOIN productos p ON op.producto_id = p.id WHERE op.promocion_paso_id = $1 LIMIT 1',
                  [paso.id]
                );
                if (opcRes.rows.length > 0) {
                  const nom = opcRes.rows[0].nombre;
                  mapaProdsPromo[nom] = (mapaProdsPromo[nom] || 0) + qty;
                }
              }
            }
          }
        }

        // Obtener lista de promociones para distinguir productos individuales
        const promosListRes = await pool.query('SELECT nombre FROM promociones');
        const promosNombresSet = new Set(promosListRes.rows.map(r => r.nombre));

        // Unificar mapa de productos vendidos
        const mapaUnificados = {};
        for (const p of productosShiftRes.rows) {
          const nom = p.nombre_producto;
          const cant = parseInt(p.cantidad_vendida) || 0;
          if (!promosNombresSet.has(nom)) {
            mapaUnificados[nom] = (mapaUnificados[nom] || 0) + cant;
          }
        }
        for (const [nom, cant] of Object.entries(mapaProdsPromo)) {
          mapaUnificados[nom] = (mapaUnificados[nom] || 0) + cant;
        }

        // Calcular consumo de ingredientes según recetas de productos
        const mapaIngredientes = {};

        for (const [prodNom, cantTotal] of Object.entries(mapaUnificados)) {
          if (cantTotal <= 0) continue;

          const recipeRes = await pool.query(`
            SELECT 
              i.id as ingrediente_id,
              i.nombre as ingrediente_nombre,
              COALESCE(i.unidad, 'unidades') as unidad,
              pi.cantidad as cantidad_por_unidad
            FROM productos pr
            JOIN producto_ingredientes pi ON pr.id = pi.producto_id
            JOIN ingredientes i ON pi.ingrediente_id = i.id
            WHERE pr.nombre = $1
          `, [prodNom]);

          for (const ing of recipeRes.rows) {
            const ingId = ing.ingrediente_id;
            const gastado = parseFloat(ing.cantidad_por_unidad) * cantTotal;

            if (!mapaIngredientes[ingId]) {
              mapaIngredientes[ingId] = {
                ingrediente_id: ingId,
                nombre: ing.ingrediente_nombre,
                unidad: ing.unidad || 'unidades',
                por_ventas: 0,
                por_mermas: 0,
                total_consumido: 0
              };
            }
            mapaIngredientes[ingId].por_ventas += gastado;
            mapaIngredientes[ingId].total_consumido += gastado;
          }
        }

        // Sumar consumos internos / mermas del turno
        for (const item of shiftConsumptions) {
          const cCant = parseFloat(item.cantidad) || 0;
          const cNom = item.ingrediente_nombre;
          let found = Object.values(mapaIngredientes).find(ing => ing.nombre.toLowerCase() === cNom.toLowerCase());
          if (found) {
            found.por_mermas += cCant;
            found.total_consumido += cCant;
          } else {
            mapaIngredientes[`merma_${item.id}`] = {
              nombre: cNom,
              unidad: 'unidades',
              por_ventas: 0,
              por_mermas: cCant,
              total_consumido: cCant
            };
          }
        }

        rawMaterialConsumption = Object.values(mapaIngredientes)
          .sort((a, b) => b.total_consumido - a.total_consumido);

        console.log(`INFO: Se calcularon ${rawMaterialConsumption.length} materias primas consumidas ${isRangeMode ? `para el período ${fechaInicio} al ${fechaFin}` : `para el turno #${shiftId}`}.`);
      } catch (matErr) {
        console.error('WARN: Error calculando consumo de materia prima:', matErr.message);
      }
    }

    console.log('INFO: Iniciando consulta de inventario...');

    // 1. Consultar ingredientes y stock en la base de datos
    const res = await pool.query('SELECT nombre, stock::FLOAT, COALESCE(unidad, \'unidades\') as unidad FROM ingredientes ORDER BY nombre ASC');
    const ingredientes = res.rows;

    if (ingredientes.length === 0) {
      console.log('WARN: No hay ingredientes registrados en la base de datos.');
      process.exit(0);
    }

    // 2. Construir la tabla HTML para el cuerpo del correo
    let tableRows = '';
    ingredientes.forEach(ing => {
      const uStr = ing.unidad && ing.unidad !== 'unidades' ? ` <span style="font-size:11px;font-weight:normal;color:#64748b;">${ing.unidad}</span>` : '';
      tableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif;">${ing.nombre}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-family: sans-serif; font-weight: bold;">${parseFloat(ing.stock).toLocaleString('es-CL', { maximumFractionDigits: 2 })}${uStr}</td>
        </tr>
      `;
    });

    // 2.1 Construir sección de consumo de materia prima
    let consumoMateriaPrimaHtml = '';
    const seccionConsumoTitulo = isRangeMode ? 'del Período' : 'en el Turno';
    const seccionConsumoDesc = isRangeMode ? 'este período' : 'este turno';

    if (rawMaterialConsumption.length > 0) {
      let rowsHtml = '';
      rawMaterialConsumption.forEach(item => {
        const uStr = item.unidad && item.unidad !== 'unidades' ? ` ${item.unidad}` : '';
        const vFmt = item.por_ventas > 0 ? `${parseFloat(item.por_ventas.toFixed(2)).toLocaleString('es-CL')}${uStr}` : '-';
        const mFmt = item.por_mermas > 0 ? `${parseFloat(item.por_mermas.toFixed(2)).toLocaleString('es-CL')}${uStr}` : '-';
        const tFmt = `${parseFloat(item.total_consumido.toFixed(2)).toLocaleString('es-CL')}${uStr}`;

        rowsHtml += `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px 10px; border: 1px solid #ddd; font-family: sans-serif; font-weight: bold; color: #1e293b;">${item.nombre}</td>
            <td style="padding: 8px 10px; border: 1px solid #ddd; text-align: right; font-family: sans-serif; color: #475569;">${vFmt}</td>
            <td style="padding: 8px 10px; border: 1px solid #ddd; text-align: right; font-family: sans-serif; color: ${item.por_mermas > 0 ? '#d97706' : '#94a3b8'};">${mFmt}</td>
            <td style="padding: 8px 10px; border: 1px solid #ddd; text-align: right; font-family: sans-serif; font-weight: bold; color: #0f766e; font-size: 13.5px;">${tFmt}</td>
          </tr>
        `;
      });

      consumoMateriaPrimaHtml = `
        <h3 style="color: #0f766e; border-bottom: 2px solid #0d9488; padding-bottom: 8px; margin-top: 30px; font-family: sans-serif;">
          🥩 Consumo de Materia Prima ${seccionConsumoTitulo}
        </h3>
        <p style="color: #4b5563; font-size: 13.5px; font-family: sans-serif; margin-bottom: 10px;">
          Cantidad de insumos e ingredientes consumidos por preparaciones de ventas y mermas durante ${seccionConsumoDesc}:
        </p>
        <table style="border-collapse: collapse; width: 100%; margin-top: 10px; font-family: sans-serif;">
          <thead>
            <tr style="background-color: #f0fdfa; border-bottom: 2px solid #ccfbf1;">
              <th style="padding: 9px 10px; border: 1px solid #ddd; text-align: left; color: #134e4a; font-size: 12.5px;">Materia Prima / Ingrediente</th>
              <th style="padding: 9px 10px; border: 1px solid #ddd; text-align: right; color: #134e4a; font-size: 12.5px; width: 110px;">En Ventas</th>
              <th style="padding: 9px 10px; border: 1px solid #ddd; text-align: right; color: #134e4a; font-size: 12.5px; width: 90px;">Mermas</th>
              <th style="padding: 9px 10px; border: 1px solid #ddd; text-align: right; color: #134e4a; font-size: 12.5px; width: 120px;">Total Usado</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      `;
    } else if (isRangeMode || shiftId) {
      consumoMateriaPrimaHtml = `
        <h3 style="color: #0f766e; border-bottom: 2px solid #0d9488; padding-bottom: 8px; margin-top: 30px; font-family: sans-serif;">
          🥩 Consumo de Materia Prima ${seccionConsumoTitulo}
        </h3>
        <p style="color: #4b5563; font-size: 13px; font-style: italic; font-family: sans-serif; margin: 0;">
          No se registraron ventas ni consumos de materia prima durante ${seccionConsumoDesc}.
        </p>
      `;
    }

    // 2.5 Construir encabezado y arqueo / resumen financiero
    let shiftHeaderHtml = '';
    let arqueoHtml = '';
    const isShiftOpen = shiftInfo && (shiftInfo.activo === 1 || shiftInfo.activo === true || !shiftInfo.fecha_hora_fin);

    if (isRangeMode) {
      const fIniFmt = fechaInicio.split('-').reverse().join('/');
      const fFinFmt = fechaFin.split('-').reverse().join('/');
      const rangoTexto = fechaInicio === fechaFin ? fIniFmt : `${fIniFmt} al ${fFinFmt}`;

      shiftHeaderHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; font-family: sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <h3 style="margin: 0; color: #1e293b; font-size: 16px;">
              📅 Reporte del Intervalo: ${rangoTexto}
            </h3>
          </div>
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            Resumen consolidado de ventas, ingresos, gastos y consumo de materias primas para el período consultado.
            ${rangeTurnosCount > 0 ? `<br/><span style="font-size: 12px; color: #0284c7; font-weight: bold;">• ${rangeTurnosCount} turno(s) comprendido(s) en este período.</span>` : ''}
          </p>
        </div>
      `;

      const tEfectivo = parseFloat(sales.total_efectivo) || 0;
      const tGastos = shiftExpenses.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
      const tTarjeta = parseFloat(sales.total_tarjeta) || 0;
      const tDebito = parseFloat(sales.total_debito) || 0;
      const tCredito = parseFloat(sales.total_credito) || 0;
      const tVentas = parseFloat(sales.total_ventas) || 0;
      const balanceNeto = tEfectivo - tGastos;

      let expensesRowsHtml = '';
      if (shiftExpenses.length > 0) {
        expensesRowsHtml = shiftExpenses.map(exp => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 6px 0; color: #475569;">• ${exp.descripcion} <span style="font-size: 11px; color: #94a3b8;">(${exp.fecha_hora ? new Date(exp.fecha_hora).toLocaleDateString('es-CL') : ''} - ${exp.registrado_por})</span></td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #dc2626;">-$${parseFloat(exp.monto).toLocaleString('es-CL')}</td>
          </tr>
        `).join('');
      }

      arqueoHtml = `
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); font-family: sans-serif;">
          <h3 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 0 0 12px 0; font-size: 16px;">
            💵 Resumen Financiero y Ventas del Período
          </h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; font-family: sans-serif;">
            <tr>
              <td style="padding: 6px 0; color: #475569;">Ventas en Efectivo (${sales.cantidad_efectivo} pedidos):</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #16a34a;">+$${tEfectivo.toLocaleString('es-CL')}</td>
            </tr>
            ${tGastos > 0 ? `
            <tr>
              <td style="padding: 6px 0; color: #dc2626;">Gastos en Efectivo Registrados:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #dc2626;">-$${tGastos.toLocaleString('es-CL')}</td>
            </tr>
            <tr style="border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; background-color: #f8fafc;">
              <td style="padding: 8px 4px; font-weight: bold; color: #1e293b;">Balance Efectivo Neto (Ventas - Gastos):</td>
              <td style="padding: 8px 4px; text-align: right; font-weight: bold; color: #1e293b; font-size: 14px;">$${balanceNeto.toLocaleString('es-CL')}</td>
            </tr>
            ` : ''}
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 6px 0; color: #475569;">Ventas en Tarjeta (Débito/Crédito):</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #2563eb;">$${tTarjeta.toLocaleString('es-CL')}</td>
            </tr>
            ${(tDebito > 0 || tCredito > 0) ? `
            <tr style="font-size: 11px; color: #64748b;">
              <td style="padding: 2px 0 6px 12px;">• Débito: $${tDebito.toLocaleString('es-CL')} | Crédito: $${tCredito.toLocaleString('es-CL')}</td>
              <td style="padding: 2px 0 6px 0; text-align: right;">${sales.cantidad_tarjeta} pedidos</td>
            </tr>
            ` : ''}
            <tr style="border-top: 2px solid #3b82f6; background-color: #eff6ff;">
              <td style="padding: 8px 6px; font-weight: bold; color: #1e40af; font-size: 14px;">TOTAL VENTAS DEL LOCAL:</td>
              <td style="padding: 8px 6px; text-align: right; font-weight: bold; color: #1e40af; font-size: 15px;">$${tVentas.toLocaleString('es-CL')} <span style="font-size: 12px; font-weight: normal; color: #3b82f6;">(${sales.cantidad_pedidos} pedidos locales)</span></td>
            </tr>
            ${sales.cantidad_externos > 0 ? `
            <tr style="background-color: #fff1f2; border-top: 1px solid #fecdd3;">
              <td style="padding: 6px 6px; color: #be185d; font-size: 12px;"><strong>🛵 Pedidos Externos (PedidosYa / Apps):</strong></td>
              <td style="padding: 6px 6px; text-align: right; color: #be185d; font-size: 12px; font-weight: bold;">${sales.cantidad_externos} pedidos (no suman a caja)</td>
            </tr>
            ` : ''}
          </table>

          ${shiftExpenses.length > 0 ? `
          <div style="margin-top: 14px; padding: 12px; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
            <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 13px;">💸 Detalle de Gastos en Efectivo del Período:</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: sans-serif;">
              ${expensesRowsHtml}
            </table>
          </div>
          ` : ''}
        </div>
      `;
    } else if (shiftInfo) {
      const fechaInicioStr = shiftInfo.fecha_hora_inicio
        ? new Date(shiftInfo.fecha_hora_inicio).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
        : 'N/A';
      const fechaFinStr = shiftInfo.fecha_hora_fin
        ? new Date(shiftInfo.fecha_hora_fin).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
        : 'En curso actualmente';

      shiftHeaderHtml = `
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; font-family: sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <h3 style="margin: 0; color: #1e293b; font-size: 16px;">
              📌 Turno #${shiftInfo.id} 
              <span style="display: inline-block; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 12px; margin-left: 8px; background-color: ${isShiftOpen ? '#fef3c7' : '#dcfce7'}; color: ${isShiftOpen ? '#92400e' : '#166534'};">
                ${isShiftOpen ? '🟡 EN CURSO' : '🟢 CERRADO'}
              </span>
            </h3>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
            <tr>
              <td style="padding: 2px 0;"><strong>Apertura:</strong> ${fechaInicioStr} ${shiftInfo.usuario_inicio ? `(${shiftInfo.usuario_inicio})` : ''}</td>
              <td style="padding: 2px 0; text-align: right;"><strong>${isShiftOpen ? 'Estado:' : 'Cierre:'}</strong> ${isShiftOpen ? '<span style="color:#b45309;font-weight:bold;">Abierto (Ventas en tiempo real)</span>' : `${fechaFinStr} ${shiftInfo.usuario_fin ? `(${shiftInfo.usuario_fin})` : ''}`}</td>
            </tr>
          </table>
        </div>
      `;

      const eInicial = parseFloat(shiftInfo.efectivo_inicial) || 0;
      const tEfectivo = parseFloat(sales.total_efectivo) || 0;
      const tGastos = shiftExpenses.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
      const eEsperado = eInicial + tEfectivo - tGastos;
      const eReal = parseFloat(shiftInfo.efectivo_final) || 0;
      const dif = isShiftOpen ? 0 : (shiftInfo.diferencia !== null && shiftInfo.diferencia !== undefined ? parseFloat(shiftInfo.diferencia) : (eReal - eEsperado));
      const tTarjeta = parseFloat(sales.total_tarjeta) || 0;
      const tDebito = parseFloat(sales.total_debito) || 0;
      const tCredito = parseFloat(sales.total_credito) || 0;
      const tVentas = parseFloat(sales.total_ventas) || 0;

      let difColor = '#16a34a';
      let difTexto = `$${Math.abs(dif).toLocaleString('es-CL')} (Cuadrado)`;
      if (dif < 0) {
        difColor = '#dc2626';
        difTexto = `-$${Math.abs(dif).toLocaleString('es-CL')} (Faltante / Descuadre)`;
      } else if (dif > 0) {
        difColor = '#d97706';
        difTexto = `+$${Math.abs(dif).toLocaleString('es-CL')} (Sobrante)`;
      }

      const obsTexto = (shiftInfo.observaciones && shiftInfo.observaciones.trim())
        ? shiftInfo.observaciones.trim()
        : 'Sin observaciones de cierre.';

      let expensesRowsHtml = '';
      if (shiftExpenses.length > 0) {
        expensesRowsHtml = shiftExpenses.map(exp => `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 6px 0; color: #475569;">• ${exp.descripcion} <span style="font-size: 11px; color: #94a3b8;">(${exp.registrado_por})</span></td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #dc2626;">-$${parseFloat(exp.monto).toLocaleString('es-CL')}</td>
          </tr>
        `).join('');
      }

      arqueoHtml = `
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; margin-bottom: 25px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); font-family: sans-serif;">
          <h3 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin: 0 0 12px 0; font-size: 16px;">
            💵 ${isShiftOpen ? `Arqueo de Caja (Parcial) - Turno #${shiftInfo.id}` : `Arqueo de Caja y Cierre del Turno #${shiftInfo.id}`}
          </h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; font-family: sans-serif;">
            <tr>
              <td style="padding: 6px 0; color: #475569;">Fondo de Apertura (Efectivo Inicial):</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #1e293b;">$${eInicial.toLocaleString('es-CL')}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #475569;">Ventas en Efectivo (${sales.cantidad_efectivo} pedidos):</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #16a34a;">+$${tEfectivo.toLocaleString('es-CL')}</td>
            </tr>
            ${tGastos > 0 ? `
            <tr>
              <td style="padding: 6px 0; color: #dc2626;">Gastos en Efectivo (Salidas de Caja):</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #dc2626;">-$${tGastos.toLocaleString('es-CL')}</td>
            </tr>
            ` : ''}
            <tr style="border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; background-color: #f8fafc;">
              <td style="padding: 8px 4px; font-weight: bold; color: #1e293b;">Efectivo Esperado en Caja ${isShiftOpen ? '(Actual)' : ''}:</td>
              <td style="padding: 8px 4px; text-align: right; font-weight: bold; color: #1e293b; font-size: 14px;">$${eEsperado.toLocaleString('es-CL')}</td>
            </tr>
            ${!isShiftOpen ? `
            <tr>
              <td style="padding: 6px 0; color: #475569;">Efectivo Real Contado en Cierre:</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a; font-size: 14px;">$${eReal.toLocaleString('es-CL')}</td>
            </tr>
            <tr style="background-color: ${dif < 0 ? '#fef2f2' : (dif > 0 ? '#fffbeb' : '#f0fdf4')};">
              <td style="padding: 8px 6px; font-weight: bold; color: ${difColor};">Diferencia / Cuadre:</td>
              <td style="padding: 8px 6px; text-align: right; font-weight: bold; color: ${difColor}; font-size: 14px;">${difTexto}</td>
            </tr>
            ` : `
            <tr style="background-color: #fefce8;">
              <td style="padding: 6px 4px; color: #854d0e; font-size: 12px;"><strong>ℹ️ Estado Arqueo:</strong></td>
              <td style="padding: 6px 4px; text-align: right; color: #854d0e; font-size: 12px; font-style: italic;">Conteo final pendiente al cierre del turno</td>
            </tr>
            `}
            <tr style="border-top: 1px solid #e2e8f0;">
              <td style="padding: 6px 0; color: #475569;">Ventas en Tarjeta (Débito/Crédito):</td>
              <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #2563eb;">$${tTarjeta.toLocaleString('es-CL')}</td>
            </tr>
            ${(tDebito > 0 || tCredito > 0) ? `
            <tr style="font-size: 11px; color: #64748b;">
              <td style="padding: 2px 0 6px 12px;">• Débito: $${tDebito.toLocaleString('es-CL')} | Crédito: $${tCredito.toLocaleString('es-CL')}</td>
              <td style="padding: 2px 0 6px 0; text-align: right;">${sales.cantidad_tarjeta} pedidos</td>
            </tr>
            ` : ''}
            <tr style="border-top: 2px solid #3b82f6; background-color: #eff6ff;">
              <td style="padding: 8px 6px; font-weight: bold; color: #1e40af; font-size: 14px;">TOTAL VENTAS DEL LOCAL (CAJA):</td>
              <td style="padding: 8px 6px; text-align: right; font-weight: bold; color: #1e40af; font-size: 15px;">$${tVentas.toLocaleString('es-CL')} <span style="font-size: 12px; font-weight: normal; color: #3b82f6;">(${sales.cantidad_pedidos} pedidos locales)</span></td>
            </tr>
            ${sales.cantidad_externos > 0 ? `
            <tr style="background-color: #fff1f2; border-top: 1px solid #fecdd3;">
              <td style="padding: 6px 6px; color: #be185d; font-size: 12px;"><strong>🛵 Pedidos Externos (PedidosYa / Apps):</strong></td>
              <td style="padding: 6px 6px; text-align: right; color: #be185d; font-size: 12px; font-weight: bold;">${sales.cantidad_externos} pedidos (no suman a caja)</td>
            </tr>
            ` : ''}
          </table>

          ${shiftExpenses.length > 0 ? `
          <div style="margin-top: 14px; padding: 12px; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
            <h4 style="margin: 0 0 8px 0; color: #991b1b; font-size: 13px;">💸 Detalle de Gastos en Efectivo Registrados:</h4>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: sans-serif;">
              ${expensesRowsHtml}
            </table>
          </div>
          ` : ''}

          ${!isShiftOpen ? `
          <div style="margin-top: 12px; padding: 10px 12px; background-color: #f1f5f9; border-radius: 6px; font-size: 12px; color: #334155; border-left: 3px solid #94a3b8;">
            <strong>📝 Observaciones / Comentarios del Cierre:</strong><br/>
            <span style="font-style: italic; color: #475569; display: inline-block; margin-top: 4px;">"${obsTexto}"</span>
          </div>
          ` : ''}
        </div>
      `;
    }

    // 2.6 Construir sección de comandas eliminadas
    let deletedTableHtml = '';
    if (deletedOrders.length > 0) {
      let delRows = '';
      deletedOrders.forEach(order => {
        const productosArr = typeof order.productos === 'string' ? JSON.parse(order.productos) : order.productos;
        const prodSummary = productosArr.map(p => `${p.cantidad}x ${p.nombre_producto}`).join(', ');
        const fechaElimStr = new Date(order.eliminado_fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        delRows += `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: center; font-weight: bold; color: #dc2626;">#${order.id}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; font-size: 13px;">
              <strong>${order.cliente_nombre ? order.cliente_nombre : '<span style="display:inline-block;width:120px;border-bottom:1px solid #000;"></span>'}</strong><br/>
              <span style="font-size: 11px; color: #666;">${prodSummary}</span>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: right; font-weight: bold; font-size: 13px;">$${parseFloat(order.total).toLocaleString('es-CL')}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: center; font-size: 13px;">${order.atendido_por}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; font-size: 12px; color: #b91c1c;">
              <strong>${order.eliminado_por || 'N/A'}</strong><br/>
              <span style="font-size: 11px; color: #4b5563;">a las ${fechaElimStr}</span>
            </td>
          </tr>
        `;
      });

      deletedTableHtml = `
        <h3 style="color: #dc2626; border-bottom: 2px solid #ef4444; padding-bottom: 8px; margin-top: 30px; font-family: sans-serif;">🚨 Comandas Eliminadas en el Turno</h3>
        <p style="color: #4b5563; font-size: 14px; font-family: sans-serif; margin-bottom: 10px;">Las siguientes comandas fueron eliminadas del sistema por un administrador durante este turno:</p>
        <table style="border-collapse: collapse; width: 100%; margin-top: 10px; font-family: sans-serif;">
          <thead>
            <tr style="background-color: #fef2f2; border-bottom: 2px solid #fee2e2;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #374151; font-size: 13px;">Ticket</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; color: #374151; font-size: 13px;">Cliente / Productos</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #374151; font-size: 13px; width: 90px;">Total</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #374151; font-size: 13px; width: 80px;">Atendió</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; color: #374151; font-size: 13px; width: 140px;">Eliminado por</th>
            </tr>
          </thead>
          <tbody>
            ${delRows}
          </tbody>
        </table>
      `;
    } else {
      deletedTableHtml = `
        <h3 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-top: 30px; font-family: sans-serif;">📋 Auditoría de Comandas</h3>
        <p style="color: #4b5563; font-size: 13px; font-style: italic; font-family: sans-serif; margin: 0;">No se registraron comandas eliminadas durante este turno.</p>
      `;
    }

    // 2.7 Construir sección de consumo interno / merma
    let consumosHtml = '';
    if (shiftConsumptions.length > 0) {
      let consRows = '';
      shiftConsumptions.forEach(item => {
        const fechaConsStr = new Date(item.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        consRows += `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif;">${item.ingrediente_nombre}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: right; font-weight: bold; color: #d97706;">${parseFloat(item.cantidad).toLocaleString('es-CL', { maximumFractionDigits: 2 })}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: center; color: #4b5563; font-size: 12px;">a las ${fechaConsStr}</td>
          </tr>
        `;
      });

      consumosHtml = `
        <h3 style="color: #d97706; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-top: 30px; font-family: sans-serif;">📉 Consumo Interno / Mermas del Turno</h3>
        <p style="color: #4b5563; font-size: 14px; font-family: sans-serif; margin-bottom: 10px;">Los siguientes ingredientes fueron descontados manualmente del inventario como consumo o merma durante este turno:</p>
        <table style="border-collapse: collapse; width: 100%; margin-top: 10px; font-family: sans-serif;">
          <thead>
            <tr style="background-color: #fffbeb; border-bottom: 2px solid #fef3c7;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; color: #374151; font-size: 13px;">Ingrediente</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #374151; font-size: 13px; width: 120px;">Cantidad Descontada</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #374151; font-size: 13px; width: 100px;">Hora</th>
            </tr>
          </thead>
          <tbody>
            ${consRows}
          </tbody>
        </table>
      `;
    } else {
      consumosHtml = `
        <h3 style="color: #d97706; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-top: 30px; font-family: sans-serif;">📉 Consumo Interno / Mermas</h3>
        <p style="color: #4b5563; font-size: 13px; font-style: italic; font-family: sans-serif; margin: 0;">No se registraron consumos o mermas manuales durante este turno.</p>
      `;
    }

    // 2.8 Construir sección de ingreso de materia prima
    let entradasHtml = '';
    if (shiftArrivals.length > 0) {
      let entRows = '';
      shiftArrivals.forEach(item => {
        const fechaEntStr = new Date(item.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        entRows += `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif;">${item.ingrediente_nombre}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: right; font-weight: bold; color: #16a34a;">+${parseFloat(item.cantidad).toLocaleString('es-CL', { maximumFractionDigits: 2 })}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: center; color: #4b5563; font-size: 12px;">a las ${fechaEntStr}</td>
          </tr>
        `;
      });

      entradasHtml = `
        <h3 style="color: #16a34a; border-bottom: 2px solid #22c55e; padding-bottom: 8px; margin-top: 30px; font-family: sans-serif;">📦 Materia Prima Ingresada en el Turno</h3>
        <p style="color: #4b5563; font-size: 14px; font-family: sans-serif; margin-bottom: 10px;">Los siguientes ingredientes fueron ingresados manualmente al inventario durante este turno:</p>
        <table style="border-collapse: collapse; width: 100%; margin-top: 10px; font-family: sans-serif;">
          <thead>
            <tr style="background-color: #f0fdf4; border-bottom: 2px solid #bbf7d0;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; color: #374151; font-size: 13px;">Ingrediente</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #374151; font-size: 13px; width: 120px;">Cantidad Ingresada</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: center; color: #374151; font-size: 13px; width: 100px;">Hora</th>
            </tr>
          </thead>
          <tbody>
            ${entRows}
          </tbody>
        </table>
      `;
    } else {
      entradasHtml = `
        <h3 style="color: #16a34a; border-bottom: 2px solid #22c55e; padding-bottom: 8px; margin-top: 30px; font-family: sans-serif;">📦 Materia Prima Ingresada</h3>
        <p style="color: #4b5563; font-size: 13px; font-style: italic; font-family: sans-serif; margin: 0;">No se registraron ingresos de materia prima durante este turno.</p>
      `;
    }

    // 2.9 Construir sección de pedidos externos (PedidosYa / Apps)
    let externalOrdersHtml = '';
    if (shiftExternalOrders.length > 0) {
      let extRows = '';
      shiftExternalOrders.forEach(order => {
        const productosArr = typeof order.productos === 'string' ? JSON.parse(order.productos) : order.productos;
        const prodSummary = productosArr.map(p => `${p.cantidad}x ${p.nombre_producto}`).join(', ');
        const fechaExtStr = new Date(order.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        extRows += `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: center; font-weight: bold; color: #e11d48;">#${order.id}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; font-size: 13px;">
              <strong style="color: #1e293b;">${order.cliente_nombre || 'PedidosYa'}</strong>
              ${order.nota ? `<div style="font-size: 11px; color: #64748b; font-style: italic;">Nota: ${order.nota}</div>` : ''}
              <div style="font-size: 11.5px; color: #475569; margin-top: 2px;">${prodSummary || 'Sin productos'}</div>
            </td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: center; font-size: 12px; color: #4b5563;">${fechaExtStr}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: center; font-size: 12px; color: #4b5563;">${order.atendido_por || 'Cajero'}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: center; font-size: 11px; font-weight: bold; color: #e11d48;">
              <span style="background-color: #ffe4e6; padding: 2px 6px; border-radius: 6px; border: 1px solid #fecdd3;">Pagado en App</span>
            </td>
          </tr>
        `;
      });

      externalOrdersHtml = `
        <h3 style="color: #e11d48; border-bottom: 2px solid #f43f5e; padding-bottom: 8px; margin-top: 30px; font-family: sans-serif;">
          🛵 Pedidos Externos del Turno (${shiftExternalOrders.length} PedidosYa / Apps)
        </h3>
        <p style="color: #4b5563; font-size: 13px; font-family: sans-serif; margin-bottom: 10px;">
          Los siguientes pedidos fueron despachados mediante plataformas externas (PedidosYa u otras). Descontaron ingredientes del inventario pero no ingresaron dinero a la caja física de efectivo o tarjeta del local:
        </p>
        <table style="border-collapse: collapse; width: 100%; margin-top: 10px; font-family: sans-serif;">
          <thead>
            <tr style="background-color: #fff1f2; border-bottom: 2px solid #ffe4e6;">
              <th style="padding: 9px; border: 1px solid #ddd; text-align: center; color: #374151; font-size: 12px; width: 60px;">Ticket</th>
              <th style="padding: 9px; border: 1px solid #ddd; text-align: left; color: #374151; font-size: 12px;">Cliente / Detalle Productos</th>
              <th style="padding: 9px; border: 1px solid #ddd; text-align: center; color: #374151; font-size: 12px; width: 65px;">Hora</th>
              <th style="padding: 9px; border: 1px solid #ddd; text-align: center; color: #374151; font-size: 12px; width: 75px;">Atendió</th>
              <th style="padding: 9px; border: 1px solid #ddd; text-align: center; color: #374151; font-size: 12px; width: 95px;">Estado Pago</th>
            </tr>
          </thead>
          <tbody>
            ${extRows}
          </tbody>
        </table>
      `;
    } else {
      externalOrdersHtml = `
        <h3 style="color: #e11d48; border-bottom: 2px solid #f43f5e; padding-bottom: 8px; margin-top: 30px; font-family: sans-serif;">
          🛵 Pedidos Externos del Turno (PedidosYa / Apps)
        </h3>
        <p style="color: #4b5563; font-size: 13px; font-style: italic; font-family: sans-serif; margin: 0;">No se registraron pedidos externos durante este turno.</p>
      `;
    }

    const tituloReportePrincipal = isRangeMode
      ? `📊 Reporte del Período (${fechaInicio === fechaFin ? fechaInicio.split('-').reverse().join('/') : `${fechaInicio.split('-').reverse().join('/')} al ${fechaFin.split('-').reverse().join('/')}`})`
      : (shiftInfo ? (isShiftOpen ? '📊 Reporte de Turno en Curso e Inventario' : '✅ Reporte de Cierre de Turno e Inventario') : '📦 Reporte de Inventario Actual');

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <h2 style="color: #111827; border-bottom: 2px solid #ff7a00; padding-bottom: 10px; margin-top: 0; font-family: sans-serif;">
          ${tituloReportePrincipal}
        </h2>
        
        ${shiftHeaderHtml}
        ${arqueoHtml}
        
        ${consumoMateriaPrimaHtml}
        
        <h3 style="color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-top: 30px; font-family: sans-serif;">
          📦 Stock Actual en Cocina / Inventario
        </h3>
        <p style="color: #4b5563; font-size: 13.5px; font-family: sans-serif; margin-bottom: 10px;">A continuación se detallan las existencias actuales disponibles en el inventario:</p>
        <table style="border-collapse: collapse; width: 100%; margin-top: 10px; font-family: sans-serif;">
          <thead>
            <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; color: #374151; font-size: 13px;">Ingrediente</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; color: #374151; font-size: 13px; width: 150px;">Stock Actual</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        
        ${entradasHtml}
        ${consumosHtml}
        ${externalOrdersHtml}
        ${deletedTableHtml}
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #9ca3af; text-align: center; font-family: sans-serif;">
          Generado automáticamente el ${new Date().toLocaleString('es-CL')}
        </div>
      </div>
    `;

    // 3. Enviar el correo electrónico
    let subject = '';
    if (isRangeMode) {
      const fIniFmt = fechaInicio.split('-').reverse().join('/');
      const fFinFmt = fechaFin.split('-').reverse().join('/');
      const rangoTexto = fechaInicio === fechaFin ? fIniFmt : `${fIniFmt} al ${fFinFmt}`;
      subject = `📊 Reporte del Intervalo: ${rangoTexto} - Ventas, Consumo e Inventario`;
    } else if (shiftInfo) {
      subject = isShiftOpen 
        ? `📊 Reporte de Turno en Curso #${shiftInfo.id} e Inventario - ${new Date().toLocaleDateString('es-CL')}`
        : `✅ Reporte de Cierre de Turno #${shiftInfo.id} y Arqueo - ${new Date().toLocaleDateString('es-CL')}`;
    } else {
      subject = `📦 Reporte de Inventario Actual - ${new Date().toLocaleDateString('es-CL')}`;
    }

    const success = await sendEmail(DEFAULT_EMAIL_TO, subject, htmlBody);

    if (success) {
      console.log('INFO: Reporte de inventario enviado correctamente.');
      return true;
    } else {
      console.error('ERROR: No se pudo enviar el reporte por correo.');
      return false;
    }
  } catch (err) {
    console.error(`ERROR: Ocurrió un error inesperado: ${err.stack}`);
    return false;
  }
};

if (require.main === module) {
  run().then(success => process.exit(success ? 0 : 1));
}

module.exports = { run };
