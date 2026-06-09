const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;
let sewooPrinterName = '';

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

  // Detectar la impresora Sewoo al inicio de forma inmediata usando la ventana principal
  setTimeout(async () => {
    try {
      if (!mainWindow) return;
      const printers = await mainWindow.webContents.getPrintersAsync();
      const sewooPrinter = printers.find(p => 
        p.name.toUpperCase().includes('SEWOO') || 
        p.name.toUpperCase().includes('LK-T202')
      );
      if (sewooPrinter) {
        sewooPrinterName = sewooPrinter.name;
        console.log(`[Electron Print] Impresora Sewoo detectada de inmediato: ${sewooPrinterName}`);
      } else {
        console.log('[Electron Print] No se detectó impresora Sewoo específica al inicio, se usará la predeterminada.');
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
  const ticket = printQueue.shift();
  try {
    console.log(`[Electron Print Queue] Procesando ticket N° ${ticket.ticket}...`);
    await printTicketPromise(ticket);
  } catch (err) {
    console.error(`[Electron Print Queue] Error al procesar ticket N° ${ticket.ticket}:`, err);
  } finally {
    isPrinting = false;
    // Procesar el siguiente en la cola
    processPrintQueue();
  }
}

function printTicketPromise(ticket) {
  return new Promise((resolve) => {
    try {
      const itemsRows = ticket.productos.map(p => `
        <tr>
          <td style="padding-left: 2.5mm;">${p.cantidad}</td>
          <td>${p.nombre}</td>
          <td style="text-align: right;">
            $${(parseFloat(p.precio) * p.cantidad).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
          </td>
        </tr>
      `).join('');

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
              color: #000000 !important;
              background-color: transparent !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              font-weight: bold !important;
            }
            body {
              width: 64mm;
              margin: 0;
              padding: 4mm 0mm 18mm 0mm; /* 18mm de margen abajo para que el papel avance antes de cortar y no corte el texto */
              font-family: 'Courier New', Courier, monospace;
              font-size: 10.5px;
              background-color: #ffffff !important;
              line-height: 1.3;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            
            /* Estilos réplica de la comanda digital */
            .comanda-header {
              text-align: center;
              border-bottom: 2px dashed #000000;
              padding-bottom: 3mm;
              margin-bottom: 3mm;
            }
            .comanda-client-name {
              font-size: 18px;
              font-weight: bold;
              margin: 0 0 1.5mm 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              line-height: 1.1;
            }
            .comanda-local-name {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 1.5mm;
              text-transform: uppercase;
            }
            .comanda-ticket-number {
              font-size: 13px;
              font-weight: bold;
              display: inline-block;
              padding: 1mm 3mm;
              border: 1.5px solid #000000;
              margin: 1mm 0 2mm 0;
            }
            .delivery-type {
              font-size: 12px;
              font-weight: bold;
              margin: 1mm 0;
              text-transform: uppercase;
            }
            .comanda-date-time {
              display: flex;
              justify-content: space-between;
              font-size: 9.5px;
              margin-top: 2mm;
            }
            .comanda-body {
              margin-bottom: 3mm;
            }
            .comanda-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
            }
            .comanda-table th {
              border-bottom: 1.5px solid #000000;
              padding: 1.5mm 0;
              font-weight: bold;
              text-align: left;
            }
            .comanda-table td {
              padding: 2mm 0;
              border-bottom: 1px dashed #cccccc;
            }
            .comanda-footer {
              border-top: 2px dashed #000000;
              padding-top: 3mm;
              margin-bottom: 3mm;
              display: flex;
              flex-direction: column;
              gap: 1.5mm;
            }
            .comanda-note {
              font-style: italic;
              font-size: 10px;
              padding: 2mm;
              border: 1px dashed #000000;
              text-align: left;
              margin-bottom: 2mm;
            }
            .comanda-attendant {
              font-size: 9.5px;
              font-style: italic;
              text-align: left;
            }
            .comanda-total-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-top: 1mm;
            }
            .comanda-total-label {
              font-size: 14px;
              font-weight: bold;
            }
            .comanda-total-value {
              font-size: 20px;
              font-weight: 800;
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
                  <th style="width: 18%; padding-left: 2.5mm;">Cant</th>
                  <th style="width: 52%;">Producto</th>
                  <th style="width: 30%; text-align: right;">Precio</th>
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
            <div class="comanda-total-row">
              <span class="comanda-total-label">TOTAL:</span>
              <span class="comanda-total-value">$${totalStr}</span>
            </div>
          </div>

          <div class="text-center" style="font-size: 9px; margin-top: 4mm; border-top: 1px dashed #000000; padding-top: 2mm;">
            <p>Gracias por su preferencia</p>
            <p>Calibre 25</p>
          </div>
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
              margins: { marginType: 'none' }
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
                } catch (e) {}
                resolve(); // Resolvemos la promesa para continuar con el siguiente ticket de la cola
              }, 1500);
            });
          } catch (err) {
            console.error('[Electron Print] Error al imprimir ticket:', err);
            try {
              printWin.close();
            } catch (e) {}
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

// Handler para la impresión del ticket
ipcMain.on('print-ticket', (event, ticket) => {
  console.log(`[Electron Print] Recibido ticket N° ${ticket.ticket} para encolar.`);
  printQueue.push(ticket);
  processPrintQueue();
});
