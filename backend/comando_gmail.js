const nodemailer = require('nodemailer');
const pool = require('./db');
require('dotenv').config();

// Remitente y destinatarios configurables (vacíos por defecto)
const DEFAULT_EMAIL_TO = process.env.REPORT_EMAIL_TO || '';     
const DEFAULT_EMAIL_FROM = process.env.REPORT_EMAIL_FROM || ''; 

// Configuración SMTP para nodemailer
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  });
};

// Función auxiliar para enviar correos
const sendEmail = async (toEmail, subject, htmlBody, attachments = []) => {
  if (!toEmail) {
    console.log('WARN: No se especificó dirección de correo destinatario. Saltando envío.');
    return false;
  }
  if (!DEFAULT_EMAIL_FROM) {
    console.log('WARN: No se configuró el remitente (DEFAULT_EMAIL_FROM). Saltando envío.');
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

  console.log(`INFO: Enviando correo a ${toEmail}...`);
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

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <h2 style="color: #333; border-bottom: 2px solid #ff7a00; padding-bottom: 10px;">Reporte de Stock de Inventario</h2>
        <p style="color: #666; font-size: 14px;">A continuación se detallan las cantidades actuales disponibles en el inventario de cocina:</p>
        <table style="border-collapse: collapse; width: 100%; margin-top: 15px;">
          <thead>
            <tr style="background-color: #f9f9f9; border-bottom: 2px solid #ddd;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left; font-family: sans-serif; color: #555;">Ingrediente</th>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: right; font-family: sans-serif; color: #555; width: 150px;">Stock Actual</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center;">
          Generado automáticamente el ${new Date().toLocaleString('es-CL')}
        </div>
      </div>
    `;

    // 3. Enviar el correo electrónico
    const subject = `Reporte de Inventario Actual - ${new Date().toLocaleDateString('es-CL')}`;
    const success = await sendEmail(DEFAULT_EMAIL_TO, subject, htmlBody);

    if (success) {
      console.log('INFO: Reporte de inventario enviado correctamente.');
    }

    process.exit(0);
  } catch (err) {
    console.error(`ERROR: Ocurrió un error inesperado: ${err.stack}`);
    process.exit(1);
  }
};

run();
