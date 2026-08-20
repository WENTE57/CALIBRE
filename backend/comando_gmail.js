const nodemailer = require('nodemailer');
const pool = require('./db');
require('dotenv').config();

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
const run = async () => {
  try {
    // 0. Cargar la configuración dinámica de la base de datos
    await loadConfigFromDB();

    // 0.5. Determinar el ID del turno
    let shiftId = null;
    if (process.argv[2]) {
      shiftId = parseInt(process.argv[2], 10);
      console.log(`INFO: Se recibió ID de turno por argumento: ${shiftId}`);
    } else {
      // Buscar el último turno registrado en la base de datos
      const lastShiftRes = await pool.query('SELECT id FROM turnos ORDER BY id DESC LIMIT 1');
      if (lastShiftRes.rows.length > 0) {
        shiftId = lastShiftRes.rows[0].id;
        console.log(`INFO: No se recibió argumento, usando último turno encontrado: ${shiftId}`);
      } else {
        console.log('INFO: No se encontró ningún turno en la base de datos.');
      }
    }

    // Obtener información del turno si existe
    let shiftInfo = null;
    if (shiftId) {
      const shiftRes = await pool.query(
        'SELECT id, usuario_inicio, usuario_fin, fecha_hora_inicio, fecha_hora_fin FROM turnos WHERE id = $1',
        [shiftId]
      );
      if (shiftRes.rows.length > 0) {
        shiftInfo = shiftRes.rows[0];
      }
    }

    // Obtener comandas eliminadas del turno si existe
    let deletedOrders = [];
    if (shiftId) {
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
        WHERE p.turno_id = $1 AND p.eliminado IS TRUE
        GROUP BY p.id
        ORDER BY p.eliminado_fecha DESC
      `, [shiftId]);
      deletedOrders = deletedRes.rows;
    }

    // Obtener consumo interno / mermas del turno si existe
    let shiftConsumptions = [];
    if (shiftId) {
      const consumRes = await pool.query(`
        SELECT c.id, c.cantidad, c.fecha_hora, i.nombre as ingrediente_nombre
        FROM consumos_inventario c
        JOIN ingredientes i ON c.ingrediente_id = i.id
        WHERE c.turno_id = $1
        ORDER BY c.fecha_hora DESC
      `, [shiftId]);
      shiftConsumptions = consumRes.rows;
      console.log(`INFO: Se encontraron ${shiftConsumptions.length} consumos/mermas registrados para el turno #${shiftId}.`);
    }

    // Obtener ingresos de materia prima del turno si existe
    let shiftArrivals = [];
    if (shiftId) {
      const arrivalsRes = await pool.query(`
        SELECT e.id, e.cantidad, e.fecha_hora, i.nombre as ingrediente_nombre
        FROM entradas_inventario e
        JOIN ingredientes i ON e.ingrediente_id = i.id
        WHERE e.turno_id = $1
        ORDER BY e.fecha_hora DESC
      `, [shiftId]);
      shiftArrivals = arrivalsRes.rows;
      console.log(`INFO: Se encontraron ${shiftArrivals.length} ingresos de materia prima registrados para el turno #${shiftId}.`);
    }

    console.log('INFO: Iniciando consulta de inventario...');

    // 1. Consultar ingredientes y stock en la base de datos
    const res = await pool.query('SELECT nombre, stock::FLOAT FROM ingredientes ORDER BY nombre ASC');
    const ingredientes = res.rows;

    if (ingredientes.length === 0) {
      console.log('WARN: No hay ingredientes registrados en la base de datos.');
      process.exit(0);
    }

    // 2. Construir la tabla HTML para el cuerpo del correo
    let tableRows = '';
    ingredientes.forEach(ing => {
      tableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif;">${ing.nombre}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-family: sans-serif; font-weight: bold;">${ing.stock}</td>
        </tr>
      `;
    });

    // 2.5 Construir encabezado de turno si existe
    let shiftHeaderHtml = '';
    if (shiftInfo) {
      const fInicio = new Date(shiftInfo.fecha_hora_inicio).toLocaleString('es-CL');
      const fFin = shiftInfo.fecha_hora_fin ? new Date(shiftInfo.fecha_hora_fin).toLocaleString('es-CL') : 'En curso';
      shiftHeaderHtml = `
        <div style="background-color: #f3f4f6; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 20px; border-radius: 8px; font-family: sans-serif;">
          <h3 style="margin: 0 0 8px 0; color: #1e3a8a; font-size: 16px;">Resumen de Turno #${shiftInfo.id}</h3>
          <p style="margin: 0; font-size: 13px; color: #4b5563; line-height: 1.5;">
            <strong>Apertura por:</strong> ${shiftInfo.usuario_inicio} (el ${fInicio})<br/>
            <strong>Cierre por:</strong> ${shiftInfo.usuario_fin || 'En curso'} (el ${fFin})
          </p>
        </div>
      `;
    }

    // 2.6 Construir sección de comandas eliminadas
    let deletedTableHtml = '';
    if (deletedOrders.length > 0) {
      let delRows = '';
      deletedOrders.forEach(order => {
        const prodSummary = order.productos.map(p => `${p.cantidad}x ${p.nombre_producto}`).join(', ');
        const fechaElimStr = new Date(order.eliminado_fecha).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
        delRows += `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; text-align: center; font-weight: bold; color: #dc2626;">#${order.id}</td>
            <td style="padding: 8px; border: 1px solid #ddd; font-family: sans-serif; font-size: 13px;">
              <strong>${order.cliente_nombre || 'Sin Nombre'}</strong><br/>
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

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <h2 style="color: #111827; border-bottom: 2px solid #ff7a00; padding-bottom: 10px; margin-top: 0; font-family: sans-serif;">Reporte de Stock de Inventario</h2>
        
        ${shiftHeaderHtml}
        
        <p style="color: #4b5563; font-size: 14px; font-family: sans-serif;">A continuación se detallan las cantidades actuales disponibles en el inventario de cocina:</p>
        <table style="border-collapse: collapse; width: 100%; margin-top: 15px; font-family: sans-serif;">
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
        
        ${deletedTableHtml}
        
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #9ca3af; text-align: center; font-family: sans-serif;">
          Generado automáticamente el ${new Date().toLocaleString('es-CL')}
        </div>
      </div>
    `;

    // 3. Enviar el correo electrónico
    const subject = shiftInfo 
      ? `Reporte de Inventario y Auditoría - Turno #${shiftInfo.id} - ${new Date().toLocaleDateString('es-CL')}`
      : `Reporte de Inventario Actual - ${new Date().toLocaleDateString('es-CL')}`;

    const success = await sendEmail(DEFAULT_EMAIL_TO, subject, htmlBody);

    if (success) {
      console.log('INFO: Reporte de inventario enviado correctamente.');
      process.exit(0);
    } else {
      console.error('ERROR: No se pudo enviar el reporte por correo.');
      process.exit(1);
    }
  } catch (err) {
    console.error(`ERROR: Ocurrió un error inesperado: ${err.stack}`);
    process.exit(1);
  }
};

run();
