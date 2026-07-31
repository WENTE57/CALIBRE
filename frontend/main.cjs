const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;
let sewooPrinterName = '';

const printerConfigPath = path.join(app.getPath('userData'), 'printer-config.json');

function loadPrinterConfig() {
  try {
    if (fs.existsSync(printerConfigPath)) {
      const data = JSON.parse(fs.readFileSync(printerConfigPath, 'utf8'));
      if (data && data.printerName) {
        sewooPrinterName = data.printerName;
        console.log(`[Electron Print] Impresora cargada desde config: "${sewooPrinterName}"`);
        return true;
      }
    }
  } catch (e) {
    console.error('[Electron Print] Error al cargar configuración de impresora:', e);
  }
  return false;
}

function savePrinterConfig(name) {
  try {
    fs.writeFileSync(printerConfigPath, JSON.stringify({ printerName: name }), 'utf8');
    console.log(`[Electron Print] Impresora guardada en config: "${name}"`);
  } catch (e) {
    console.error('[Electron Print] Error al guardar configuración de impresora:', e);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    // Icono decorativo de la app
    icon: path.join(__dirname, 'public/favicon.ico'),
    title: 'Calibre Desktop'
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    // En desarrollo, carga el servidor de Vite
    mainWindow.loadURL('http://localhost:5173');
    // Abre las herramientas de desarrollador
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, carga el archivo compilado index.html
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  // Maximizar la ventana principal al arrancar para usar toda la pantalla
  mainWindow.maximize();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Iniciar el servidor Express (backend) en segundo plano
function startBackend() {
  const isDev = !app.isPackaged;
  const backendPath = isDev
    ? path.join(__dirname, '../backend/index.js')
    : path.join(process.resourcesPath, 'backend/index.js'); // Ajustar para empaquetado final

  console.log(`[Electron] Iniciando servidor backend desde: ${backendPath}`);

  const backendDir = path.dirname(backendPath);

  // Se inicia el proceso con node, pasando la ruta y heredando variables de entorno
  // Desactivamos shell: true para que maneje correctamente espacios en la ruta y evitar advertencias de seguridad
  backendProcess = spawn('node', [backendPath], {
    cwd: backendDir,
    env: { ...process.env, PORT: 5000 },
    stdio: 'inherit',
    shell: false
  });

  backendProcess.on('error', (err) => {
    console.error('[Electron] Error al intentar arrancar el proceso del backend:', err);
  });
}

// Evento que se dispara cuando Electron está listo
app.whenReady().then(() => {
  startBackend();
  createWindow();

  // Detectar la impresora al inicio
  setTimeout(async () => {
    try {
      if (!mainWindow) return;
      const printers = await mainWindow.webContents.getPrintersAsync();
      console.log("[Electron Print] Listando todas las impresoras detectadas por Electron:");
      printers.forEach(p => console.log(` - Nombre: "${p.name}" | Predeterminada: ${p.isDefault}`));

      // Intentar cargar la guardada primero
      if (loadPrinterConfig()) {
        const exists = printers.some(p => p.name === sewooPrinterName);
        if (exists) {
          console.log(`[Electron Print] Impresora configurada y confirmada en sistema: ${sewooPrinterName}`);
          return;
        } else {
          console.log(`[Electron Print] Impresora configurada "${sewooPrinterName}" no está conectada actualmente.`);
        }
      }

      // Si no hay guardada o no está conectada, auto-detectar
      const sewooPrinter = printers.find(p =>
        p.name.toUpperCase().includes('SLK-TL200') ||
        p.name.toUpperCase().includes('SLK') ||
        p.name.toUpperCase().includes('SEWOO') ||
        p.name.toUpperCase().includes('LK-T202') ||
        p.name.toUpperCase().includes('THERMAL')
      );
      if (sewooPrinter) {
        sewooPrinterName = sewooPrinter.name;
        console.log(`[Electron Print] Impresora de Tickets detectada de inmediato: ${sewooPrinterName}`);
        savePrinterConfig(sewooPrinterName);
      } else {
        console.log('[Electron Print] No se detectó impresora de tickets específica al inicio, se usará la predeterminada.');
      }
    } catch (e) {
      console.error('[Electron Print] Error al listar impresoras al inicio:', e);
    }
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Cerrar toda la app cuando se cierran las ventanas (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Asegurarse de apagar el proceso del backend cuando Electron termine
app.on('will-quit', () => {
  if (backendProcess) {
    console.log('[Electron] Deteniendo el proceso backend...');
    backendProcess.kill();
  }
});

// Cola de impresión secuencial para evitar conflictos en el spooler y garantizar que el auto-corte funcione en todos los tickets
const printQueue = [];
let isPrinting = false;

async function processPrintQueue() {
  if (isPrinting || printQueue.length === 0) {
    return;
  }
  isPrinting = true;
  const item = printQueue.shift();
  try {
    if (item.type === 'report') {
      console.log(`[Electron Print Queue] Procesando reporte de fecha ${item.fecha}...`);
      await printReportPromise(item);
    } else {
      console.log(`[Electron Print Queue] Procesando ticket N° ${item.ticket}...`);
      await printTicketPromise(item);
    }
  } catch (err) {
    console.error(`[Electron Print Queue] Error al procesar item de la cola:`, err);
  } finally {
    isPrinting = false;
    // Procesar el siguiente en la cola
    processPrintQueue();
  }
}

function printTicketPromise(ticket) {
  return new Promise((resolve) => {
    try {
      const itemsRows = ticket.productos.map(p => {
        let subItems = [];

        // Productos fijos de la promoción
        if (p.productos_fijos && p.productos_fijos.length > 0) {
          p.productos_fijos.forEach(pf => {
            const cantStr = pf.cantidad > 1 ? `${pf.cantidad}x ` : '';
            subItems.push(`${cantStr}${pf.nombre}`);
          });
        }

        // Opciones elegidas en los pasos de la promoción (agrupadas)
        if (p.opciones_elegidas && p.opciones_elegidas.length > 0) {
          const agrupados = p.opciones_elegidas.reduce((acc, opt) => {
            const nombre = opt.nombre_producto || opt.nombre;
            if (nombre) {
              if (!acc[nombre]) {
                acc[nombre] = { nombre_producto: nombre, cantidad: 0 };
              }
              acc[nombre].cantidad += 1;
            }
            return acc;
          }, {});

          Object.values(agrupados).forEach(group => {
            const cantStr = group.cantidad > 1 ? `${group.cantidad}x ` : '';
            subItems.push(`${cantStr}${group.nombre_producto}`);
          });
        }

        const subItemsHtml = subItems.length > 0
          ? subItems.map(item => `
              <div style="font-size: 10px; font-weight: normal; padding-left: 1.5mm; margin-top: 0.5mm;">
                - ${item}
              </div>
            `).join('')
          : '';

        return `
          <tr>
            <td style="padding-left: 1mm; vertical-align: top;">${p.cantidad}</td>
            <td style="vertical-align: top;">
              <div style="font-weight: bold;">${p.nombre}</div>
              ${subItemsHtml}
            </td>
            <td style="text-align: right; vertical-align: top;">
              $${(parseFloat(p.precio) * p.cantidad).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
            </td>
          </tr>
        `;
      }).join('');

      const fechaStr = new Date(ticket.fecha_hora).toLocaleDateString('es-CL');
      const horaStr = new Date(ticket.fecha_hora).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      const tipoEntregaStr = ticket.tipo_entrega === 'Llevar' ? 'PARA LLEVAR' : 'PARA SERVIR';
      const totalStr = ticket.total.toLocaleString('es-CL', { minimumFractionDigits: 0 });

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            * {
              box-sizing: border-box !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-weight: bold !important;
            }
            html, body {
              width: 58mm;
              max-width: 58mm;
              margin: 0 0 0 1mm;
              padding: 1mm 0mm 25mm 0mm; /* 25mm de avance inferior para evitar corte de texto por la guillotina */
              font-family: 'Courier New', Courier, monospace;
              font-size: 10.5px;
              background-color: #ffffff !important;
              line-height: 1.2;
              overflow: hidden;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            
            /* Estilos réplica de la comanda digital */
            .comanda-header {
              text-align: center;
              border-bottom: 2px dashed #000000;
              padding-bottom: 2mm;
              margin-bottom: 2mm;
            }
            .comanda-client-name {
              font-size: 17px;
              font-weight: bold;
              margin: 0 0 1mm 0;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              line-height: 1.1;
              word-break: break-word;
            }
            .comanda-local-name {
              font-size: 11.5px;
              font-weight: bold;
              margin-bottom: 1mm;
              text-transform: uppercase;
            }
            .comanda-ticket-number {
              font-size: 13.5px;
              font-weight: bold;
              display: inline-block;
              padding: 1mm 2mm;
              border: 1.5px solid #000000;
              margin: 1mm 0 1.5mm 0;
            }
            .delivery-type {
              font-size: 12.5px;
              font-weight: bold;
              margin: 1mm 0;
              text-transform: uppercase;
            }
            .comanda-date-time {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              margin-top: 1.5mm;
            }
            .comanda-body {
              margin-bottom: 2mm;
            }
            .comanda-table {
              width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              font-size: 10px;
            }
            .comanda-table th {
              border-bottom: 1.5px solid #000000;
              padding: 1mm 0;
              font-weight: bold;
              text-align: left;
            }
            .comanda-table td {
              padding: 1mm 0;
              border-bottom: 1px dashed #cccccc;
              word-break: break-word;
              overflow-wrap: break-word;
            }
            .comanda-footer {
              border-top: 2px dashed #000000;
              padding-top: 2mm;
              margin-bottom: 2mm;
              display: flex;
              flex-direction: column;
              gap: 1.5mm;
            }
            .comanda-note {
              font-style: italic;
              font-size: 11.5px;
              padding: 1.5mm;
              border: 1px dashed #000000;
              text-align: left;
              margin-bottom: 2mm;
              word-break: break-word;
            }
            .comanda-attendant {
              font-size: 11px;
              font-style: italic;
              text-align: left;
            }
            .comanda-total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 1mm;
              width: 100%;
            }
            .comanda-total-label {
              font-size: 15px;
              font-weight: bold;
            }
            .comanda-total-value {
              font-size: 16px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="comanda-header">
            <h2 class="comanda-client-name">${ticket.cliente}</h2>
            <div class="comanda-local-name">Calibre 25</div>
            <div class="comanda-ticket-number">Ticket N° ${ticket.ticket}</div>
            <div class="delivery-type">${tipoEntregaStr}</div>
            <div class="comanda-date-time">
              <span>Fecha: ${fechaStr}</span>
              <span>Hora: ${horaStr}</span>
            </div>
          </div>

          <div class="comanda-body">
            <table class="comanda-table">
              <thead>
                <tr>
                  <th style="width: 14%;">Cant</th>
                  <th style="width: 60%;">Producto</th>
                  <th style="width: 26%; text-align: right;">Precio</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>
          </div>

          <div class="comanda-footer">
            ${ticket.nota ? `
              <div class="comanda-note">
                Nota: "${ticket.nota}"
              </div>
            ` : ''}
            <div class="comanda-attendant">
              Fue atendido por ${ticket.atendido_por}
            </div>
            ${(ticket.cantidad_envases > 0 || ticket.monto_envases > 0) ? `
              <div style="text-align: right; font-size: 10px; font-weight: bold; margin-top: 1.5mm; margin-bottom: 1mm;">
                Envases p/llevar: ${ticket.cantidad_envases || 0} ($${(parseFloat(ticket.monto_envases || 0)).toLocaleString('es-CL', { minimumFractionDigits: 0 })})
              </div>
            ` : ''}
            <div class="comanda-total-row">
              <span class="comanda-total-label">TOTAL:</span>
              <span class="comanda-total-value">$${totalStr}</span>
            </div>
          </div>

          <div class="text-center" style="font-size: 11px; margin-top: 4mm; border-top: 1px dashed #000000; padding-top: 2mm;">
            <p style="margin: 2px 0;">Gracias por su preferencia</p>
            <p style="margin: 2px 0;">Calibre 25</p>
          </div>
          <div style="height: 12mm;"></div>
        </body>
        </html>
      `;

      // Cargar el HTML como data: URL para evitar latencia de I/O de archivos temporales
      // Esto hace que did-finish-load dispare casi instantáneamente en lugar de esperar al disco
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);

      const printWin = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      printWin.loadURL(dataUrl);

      printWin.webContents.once('did-finish-load', () => {
        // Pequeño delay para asegurar el renderizado completo del CSS antes de imprimir
        setTimeout(() => {
          try {
            console.log(`[Electron Print] Usando impresora cacheada: ${sewooPrinterName || 'Impresora Predeterminada del Sistema'}`);

            const printOptions = {
              silent: true,
              printBackground: true,
              margins: { marginType: 'none' },
              pageSize: { width: 80000, height: 297000 }
            };

            if (sewooPrinterName && sewooPrinterName.trim() !== '') {
              printOptions.deviceName = sewooPrinterName;
            }

            printWin.webContents.print(printOptions, (success, errorType) => {
              if (!success) {
                console.error('[Electron Print] Error al imprimir:', errorType);
              } else {
                console.log('[Electron Print] Ticket impreso con éxito.');
              }

              // Retardo para permitir que el spooler de Windows complete el envío
              // del documento y se active el cortador (auto-cut) de la impresora Sewoo.
              setTimeout(() => {
                try {
                  printWin.close();
                } catch (e) { }
                resolve(); // Resolvemos la promesa para continuar con el siguiente ticket de la cola
              }, 1500);
            });
          } catch (err) {
            console.error('[Electron Print] Error al imprimir ticket:', err);
            try {
              printWin.close();
            } catch (e) { }
            resolve();
          }
        }, 50);
      });

    } catch (err) {
      console.error('[Electron Print] Error general en el proceso de impresión:', err);
      resolve();
    }
  });
}

function printReportPromise(report) {
  return new Promise((resolve) => {
    try {
      const productosRows = (report.productos_vendidos || []).map(p => `
        <tr>
          <td style="width: 12%;">${p.cantidad_vendida}</td>
          <td style="width: 58%;">${p.nombre_producto}</td>
          <td style="width: 30%; text-align: right;">
            $${(p.total_pesos || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
          </td>
        </tr>
      `).join('');

      const envasesRow = (report.envases_vendidos && report.envases_vendidos.cantidad > 0) ? `
        <tr>
          <td style="width: 12%;">${report.envases_vendidos.cantidad}</td>
          <td style="width: 58%;">Envases para llevar</td>
          <td style="width: 30%; text-align: right;">
            $${(report.envases_vendidos.total_pesos || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
          </td>
        </tr>
      ` : '';

      const totalEnvasesPesos = report.envases_vendidos ? (report.envases_vendidos.total_pesos || 0) : 0;
      const totalProductosPesos = (report.productos_vendidos || []).reduce((acc, curr) => acc + (curr.total_pesos || 0), 0) + totalEnvasesPesos;
      const totalProductosPesosStr = totalProductosPesos.toLocaleString('es-CL', { minimumFractionDigits: 0 });

      // Organizar todos los productos vendidos (directos + promociones) en 2 columnas para ahorrar papel
      const unificadosItems = report.productos_unificados || [];
      const unificadosPairs = [];
      for (let i = 0; i < unificadosItems.length; i += 2) {
        const item1 = unificadosItems[i];
        const item2 = unificadosItems[i + 1];
        const col1 = item1 ? `<b>${item1.cantidad_total}</b> ${item1.nombre_producto}` : '';
        const col2 = item2 ? `<b>${item2.cantidad_total}</b> ${item2.nombre_producto}` : '';
        unificadosPairs.push(`
          <tr>
            <td style="width: 50%; padding: 0.3mm 1mm 0.3mm 0; word-break: break-word; font-size: 9.5px; border-bottom: none;">${col1}</td>
            <td style="width: 50%; padding: 0.3mm 0 0.3mm 1mm; word-break: break-word; font-size: 9.5px; border-bottom: none;">${col2}</td>
          </tr>
        `);
      }
      const productosUnificadosRows = unificadosPairs.join('');
      const totalUnidadesCount = unificadosItems.reduce((acc, curr) => acc + (curr.cantidad_total || 0), 0);

      const ingredientesRows = (report.ingredientes_gastados || []).map(ing => `
        <tr>
          <td>${ing.ingrediente_nombre}</td>
          <td style="text-align: right;">${parseFloat(ing.cantidad_gastada).toLocaleString('es-CL', { maximumFractionDigits: 2 })}</td>
        </tr>
      `).join('');

      const inventarioRows = (report.inventario_actual || []).map(ing => `
        <tr>
          <td>${ing.nombre}</td>
          <td style="text-align: right;">${parseFloat(ing.stock).toLocaleString('es-CL', { maximumFractionDigits: 2 })}</td>
        </tr>
      `).join('');

      const fechaStr = new Date(report.fecha + 'T12:00:00').toLocaleDateString('es-CL');
      const impresoFecha = new Date().toLocaleDateString('es-CL');
      const impresoHora = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

      const totalVentasStr = parseFloat(report.total_ventas || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });
      const totalEfectivoStr = parseFloat(report.total_efectivo || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });
      const totalDebitoStr = parseFloat(report.total_debito || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });
      const totalCreditoStr = parseFloat(report.total_credito || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });

      const fondoAperturaStr = parseFloat(report.fondo_apertura || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });
      const efectivoRealStr = parseFloat(report.efectivo_real || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });
      const efectivoEsperadoStr = (parseFloat(report.total_efectivo || 0) + parseFloat(report.fondo_apertura || 0)).toLocaleString('es-CL', { minimumFractionDigits: 0 });
      const diferenciaStr = (report.diferencia >= 0 ? '+' : '') + parseFloat(report.diferencia || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            * {
              box-sizing: border-box !important;
              color: #000000 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-weight: bold !important;
            }
            html, body {
              width: 58mm;
              max-width: 58mm;
              margin: 0 0 0 1mm;
              padding: 1mm 0mm 5mm 0mm;
              font-family: 'Courier New', Courier, monospace;
              font-size: 10px;
              background-color: #ffffff !important;
              line-height: 1.15;
              overflow: hidden;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            
            .report-header {
              text-align: center;
              border-bottom: 1.5px dashed #000000;
              padding-bottom: 1mm;
              margin-bottom: 1.5mm;
            }
            .report-title {
              font-size: 15px;
              font-weight: bold;
              margin: 0 0 0.5mm 0;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              word-break: break-word;
            }
            .report-date-time {
              font-size: 10px;
              margin-top: 0.5mm;
            }
            .report-section-title {
              font-size: 11px;
              font-weight: bold;
              border-bottom: 1.2px solid #000000;
              padding: 0.5mm 0;
              margin-top: 2mm;
              margin-bottom: 1mm;
              text-transform: uppercase;
            }
            .report-table {
              width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              font-size: 10px;
            }
            .report-table td {
              padding: 0.4mm 0;
              border-bottom: 1px dotted #dddddd;
              word-break: break-word;
              overflow-wrap: break-word;
            }
            .report-table th {
              border-bottom: 1.2px solid #000000;
              padding: 0.5mm 0;
              text-align: left;
              font-size: 10px;
              font-weight: bold;
            }
            .report-summary-row {
              display: flex;
              justify-content: space-between;
              padding: 0.4mm 0;
              border-bottom: 1px dotted #dddddd;
              width: 100%;
              font-size: 10px;
            }
            .report-summary-row.total {
              border-top: 1.2px solid #000000;
              border-bottom: 1.2px solid #000000;
              padding: 1mm 0;
              font-size: 12px;
              margin-top: 0.5mm;
              font-weight: bold;
            }
            .cierre-status {
              padding: 1mm;
              border: 1px dashed #000000;
              margin-top: 1.5mm;
              text-align: center;
              font-size: 11px;
              font-weight: bold;
              word-break: break-word;
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h2 class="report-title">REPORTE DE CIERRE</h2>
            <div style="font-size: 11px;">Calibre 25</div>
            <div class="report-date-time">
              Fecha Cierre: ${fechaStr}<br/>
              Impreso: ${impresoFecha} ${impresoHora}
            </div>
          </div>

          <div class="report-section-title">Resumen Financiero</div>
          <div class="report-summary-row">
            <span>Efectivo Ventas:</span>
            <span>$${totalEfectivoStr}</span>
          </div>
          <div class="report-summary-row">
            <span>Débito Ventas:</span>
            <span>$${totalDebitoStr}</span>
          </div>
          <div class="report-summary-row">
            <span>Crédito Ventas:</span>
            <span>$${totalCreditoStr}</span>
          </div>
          <div class="report-summary-row total">
            <span>VENTAS TOTALES:</span>
            <span>$${totalVentasStr}</span>
          </div>

          ${report.has_arqueo ? `
            <div class="report-section-title">Arqueo de Caja</div>
            <div class="report-summary-row">
              <span>Cerrado por:</span>
              <span>${report.cargado_por}</span>
            </div>
            <div class="report-summary-row">
              <span>Fondo Apertura:</span>
              <span>$${fondoAperturaStr}</span>
            </div>
            <div class="report-summary-row">
              <span>Efectivo Esperado:</span>
              <span>$${efectivoEsperadoStr}</span>
            </div>
            <div class="report-summary-row">
              <span>Efectivo Real:</span>
              <span>$${efectivoRealStr}</span>
            </div>
            <div class="cierre-status">
              DIFERENCIA: $${diferenciaStr}<br/>
              (${report.diferencia === 0 ? 'CAJA CUADRADA' : report.diferencia > 0 ? 'SOBRANTE' : 'FALTANTE'})
            </div>
            ${report.observaciones ? `
              <div style="margin-top: 1.5mm; font-size: 10px; font-style: italic; border: 1px dashed #cccccc; padding: 1mm; word-break: break-word;">
                Obs: "${report.observaciones}"
              </div>
            ` : ''}
          ` : `
            <div class="cierre-status" style="border-color: #dc2626; color: #dc2626;">
              CAJA NO CUADRADA AÚN
            </div>
          `}

          <div class="report-section-title">Productos y Envases Vendidos</div>
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 12%;">Cant</th>
                <th style="width: 58%;">Detalle</th>
                <th style="width: 30%; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${productosRows}
              ${envasesRow}
              <tr style="border-top: 1.2px solid #000000; font-weight: bold;">
                <td colspan="2" style="padding-top: 1mm; padding-bottom: 0.5mm;">TOTAL COBRADO:</td>
                <td style="text-align: right; padding-top: 1mm; padding-bottom: 0.5mm;">$${totalProductosPesosStr}</td>
              </tr>
            </tbody>
          </table>

          <div class="report-section-title">Materia Prima Gastada</div>
          <table class="report-table">
            <thead>
              <tr>
                <th style="width: 70%;">Ingrediente</th>
                <th style="width: 30%; text-align: right;">Cant</th>
              </tr>
            </thead>
            <tbody>
              ${ingredientesRows}
            </tbody>
          </table>

          ${inventarioRows ? `
            <div class="report-section-title">Inventario Actual</div>
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 70%;">Ingrediente</th>
                  <th style="width: 30%; text-align: right;">Stock</th>
                </tr>
              </thead>
              <tbody>
                ${inventarioRows}
              </tbody>
            </table>
          ` : ''}

          <div class="text-center" style="font-size: 11px; margin-top: 5mm; border-top: 1px dashed #000000; padding-top: 2mm;">
            <p style="margin: 2px 0;">Calibre 25 - Gestión de Caja</p>
          </div>
          <div style="height: 12mm;"></div>
        </body>
        </html>
      `;

      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);

      const printWin = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      printWin.loadURL(dataUrl);

      printWin.webContents.once('did-finish-load', () => {
        setTimeout(() => {
          try {
            console.log(`[Electron Print] Usando impresora para reporte: ${sewooPrinterName || 'Impresora Predeterminada del Sistema'}`);

            const printOptions = {
              silent: true,
              printBackground: true,
              margins: { marginType: 'none' },
              pageSize: { width: 80000, height: 297000 }
            };

            if (sewooPrinterName && sewooPrinterName.trim() !== '') {
              printOptions.deviceName = sewooPrinterName;
            }

            printWin.webContents.print(printOptions, (success, errorType) => {
              if (!success) {
                console.error('[Electron Print] Error al imprimir reporte:', errorType);
              } else {
                console.log('[Electron Print] Reporte impreso con éxito.');
              }

              setTimeout(() => {
                try {
                  printWin.close();
                } catch (e) { }
                resolve();
              }, 1500);
            });
          } catch (err) {
            console.error('[Electron Print] Error al imprimir reporte:', err);
            try {
              printWin.close();
            } catch (e) { }
            resolve();
          }
        }, 50);
      });

    } catch (err) {
      console.error('[Electron Print] Error general en el proceso de impresión de reporte:', err);
      resolve();
    }
  });
}

function sendInventoryEmail() {
  try {
    const { net } = require('electron');
    const request = net.request({
      method: 'POST',
      protocol: 'http:',
      hostname: '127.0.0.1',
      port: 5000,
      path: '/api/reportes/enviar'
    });

    request.on('response', (response) => {
      console.log(`[Electron] Reporte de inventario enviado al backend. Status: ${response.statusCode}`);
    });

    request.on('error', (err) => {
      console.error('[Electron] Error de red al solicitar envío de reporte al backend:', err);
    });

    request.end();
  } catch (err) {
    console.error('[Electron] Error general al solicitar envío de reporte de inventario:', err);
  }
}

// Handlers para las peticiones IPC de impresión
ipcMain.on('print-ticket', (event, ticket) => {
  console.log(`[Electron Print] Recibido ticket N° ${ticket.ticket} para encolar.`);
  ticket.type = 'ticket';
  printQueue.push(ticket);
  processPrintQueue();
});

ipcMain.on('print-report', (event, report) => {
  console.log(`[Electron Print] Recibido reporte de fecha ${report.fecha} para encolar.`);
  report.type = 'report';
  printQueue.push(report);
  processPrintQueue();

  // Enviar el inventario por correo de forma asíncrona
  sendInventoryEmail();
});

ipcMain.handle('get-printers', async () => {
  try {
    if (!mainWindow) return [];
    return await mainWindow.webContents.getPrintersAsync();
  } catch (e) {
    console.error('[Electron Print] Error al obtener impresoras por IPC:', e);
    return [];
  }
});

ipcMain.handle('get-selected-printer', () => {
  return sewooPrinterName;
});

ipcMain.handle('set-selected-printer', (event, printerName) => {
  sewooPrinterName = printerName;
  savePrinterConfig(printerName);
  return { success: true, printerName };
});
