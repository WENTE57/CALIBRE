// Prevenir error EBADF y crashes en Windows cuando la aplicación corre sin consola (modo GUI)
process.removeAllListeners('warning');
process.on('warning', () => {});

process.on('uncaughtException', (err) => {
  if (err && (err.code === 'EBADF' || (err.message && err.message.includes('EBADF')))) {
    return; // Ignorar descriptor inválido de terminal en Windows
  }
  try {
    const fs = require('fs');
    const path = require('path');
    const appDir = process.env.USER_DATA_PATH || (process.platform === 'win32' ? process.env.APPDATA : process.env.HOME);
    if (appDir) {
      fs.appendFileSync(path.join(appDir, 'calibre_error.log'), `[${new Date().toISOString()}] ${err && err.stack ? err.stack : err}\n`);
    }
  } catch (e) {}
});

// Proteger process.stdout y process.stderr en Windows cuando no hay consola asociada
if (process.platform === 'win32') {
  const { Writable } = require('stream');
  class NullStream extends Writable {
    _write(chunk, encoding, callback) {
      callback();
    }
  }

  try {
    const dummyOut = new NullStream();
    const dummyErr = new NullStream();
    Object.defineProperty(process, 'stdout', { value: dummyOut, configurable: true, writable: true });
    Object.defineProperty(process, 'stderr', { value: dummyErr, configurable: true, writable: true });
  } catch (e) {}

  const safeLog = (orig) => (...args) => {
    try {
      if (typeof orig === 'function') orig.apply(console, args);
    } catch (e) {}
  };
  console.log = safeLog(console.log);
  console.error = safeLog(console.error);
  console.warn = safeLog(console.warn);
  console.info = safeLog(console.info);
}

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');

// Ruta del socket / Named Pipe para comunicación 100% en memoria (Cero puertos TCP)
const PIPE_PATH = process.platform === 'win32'
  ? '\\\\.\\pipe\\calibre-pos-backend'
  : path.join(app.getPath('userData'), 'calibre.sock');

// Garantizar instancia única de la aplicación para evitar conflictos
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

let mainWindow;
let backendProcess;
let sewooPrinterName = '';
let reusablePrintWin = null;



function getReusablePrintWin() {
  if (reusablePrintWin && !reusablePrintWin.isDestroyed()) {
    return reusablePrintWin;
  }
  reusablePrintWin = new BrowserWindow({
    show: false,
    width: 380,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  return reusablePrintWin;
}

const printerConfigPath = path.join(app.getPath('userData'), 'printer-config.json');

function loadPrinterConfig() {
  try {
    if (fs.existsSync(printerConfigPath)) {
      const data = JSON.parse(fs.readFileSync(printerConfigPath, 'utf8'));
      if (data && typeof data.printerName === 'string') {
        sewooPrinterName = data.printerName;
        console.log(`[Electron Print] Impresora cargada desde config: "${sewooPrinterName || 'Predeterminada del Sistema'}"`);
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
    mainWindow.loadURL('http://127.0.0.1:5173');
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
    : path.join(__dirname, 'backend/index.js'); // Dentro del asar

  console.log(`[Electron] Iniciando servidor backend desde: ${backendPath}`);

  // Determinar la ruta de la base de datos
  let userDataPath;
  if (isDev) {
    // En desarrollo, utilizar directamente la carpeta del backend del proyecto
    userDataPath = path.join(__dirname, '../backend');
    console.log(`[Electron] Modo desarrollo: utilizando base de datos en: ${path.join(userDataPath, 'database.sqlite')}`);
  } else {
    // En producción, guardar en una carpeta "data" junto al ejecutable
    const exeDir = path.dirname(app.getPath('exe'));
    userDataPath = path.join(exeDir, 'data');
    if (!fs.existsSync(userDataPath)) {
      try {
        fs.mkdirSync(userDataPath, { recursive: true });
      } catch (e) {
        console.error('[Electron] Error creando la carpeta data:', e);
        userDataPath = app.getPath('userData'); // Fallback si no hay permisos
      }
    }

    // Copiar la base de datos inicial si aún no existe en userDataPath
    const targetDbPath = path.join(userDataPath, 'database.sqlite');
    if (!fs.existsSync(targetDbPath)) {
      const candidates = [
        path.join(exeDir, 'database.sqlite'),
        path.join(exeDir, 'data', 'database.sqlite'),
        path.join(process.resourcesPath || '', 'database.sqlite'),
        path.join(__dirname, 'backend/database.sqlite')
      ];
      for (const cand of candidates) {
        if (cand && fs.existsSync(cand) && cand !== targetDbPath) {
          try {
            fs.copyFileSync(cand, targetDbPath);
            console.log(`[Electron] Base de datos copiada exitosamente desde ${cand} a ${targetDbPath}`);
            break;
          } catch (e) {
            console.error(`[Electron] Error al copiar base de datos desde ${cand}:`, e);
          }
        }
      }
    }
  }

  // Establecer variables de entorno para el backend (Modo 100% App Nativa sin puertos TCP)
  process.env.USE_SOCKET_PIPE = PIPE_PATH;
  process.env.USER_DATA_PATH = userDataPath;


  try {
    // Ejecutar el backend directamente dentro del proceso de Electron
    require(backendPath);
    console.log('[Electron] Servidor backend cargado con éxito.');
  } catch (err) {
    console.error('[Electron] Error al intentar arrancar el proceso del backend:', err);
  }
}

// Evento que se dispara cuando Electron está listo
app.whenReady().then(() => {
  startBackend();
  createWindow();

  // Precalentar la ventana de impresión oculta en segundo plano (elimina el retraso de inicio de Chromium)
  setTimeout(() => {
    try { getReusablePrintWin(); } catch (e) {}
  }, 500);

  // Detectar la impresora al inicio
  setTimeout(async () => {
    try {
      if (!mainWindow) return;
      const printers = await mainWindow.webContents.getPrintersAsync();
      console.log("[Electron Print] Listando todas las impresoras detectadas por Electron:");
      printers.forEach(p => console.log(` - Nombre: "${p.name}" | Predeterminada: ${p.isDefault}`));

      // Intentar cargar la guardada primero
      if (loadPrinterConfig()) {
        if (sewooPrinterName && sewooPrinterName.trim() !== '') {
          const exists = printers.some(p => p.name === sewooPrinterName);
          if (exists) {
            console.log(`[Electron Print] Impresora configurada y confirmada en sistema: ${sewooPrinterName}`);
            return;
          } else {
            console.log(`[Electron Print] Impresora configurada "${sewooPrinterName}" no está activa en este instante, se mantiene configurada.`);
            return;
          }
        }
      }

      // Si no hay guardada previa o estaba vacía, auto-detectar
      const sewooPrinter = printers.find(p =>
        p.name.toUpperCase().includes('SLK-TL200') ||
        p.name.toUpperCase().includes('SLK') ||
        p.name.toUpperCase().includes('SEWOO') ||
        p.name.toUpperCase().includes('LK-T202') ||
        p.name.toUpperCase().includes('THERMAL') ||
        p.name.toUpperCase().includes('POS') ||
        p.name.toUpperCase().includes('XP-80') ||
        p.name.toUpperCase().includes('RECEIPT') ||
        p.name.toUpperCase().includes('80MM') ||
        p.name.toUpperCase().includes('58MM') ||
        p.name.toUpperCase().includes('203') ||
        p.name.toUpperCase().includes('DPI')
      );
      if (sewooPrinter) {
        sewooPrinterName = sewooPrinter.name;
        console.log(`[Electron Print] Impresora de Tickets detectada de inmediato: ${sewooPrinterName}`);
        savePrinterConfig(sewooPrinterName);
      } else {
        const defaultPrinter = printers.find(p => p.isDefault);
        if (defaultPrinter) {
          sewooPrinterName = defaultPrinter.name;
          console.log(`[Electron Print] Usando impresora predeterminada del sistema: ${sewooPrinterName}`);
          savePrinterConfig(sewooPrinterName);
        } else {
          console.log('[Electron Print] No se detectó impresora al inicio.');
        }
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

// Asegurarse de limpiar recursos si es necesario al cerrar
app.on('will-quit', () => {
  console.log('[Electron] Aplicación cerrándose...');
});

// Cola de impresión secuencial para evitar conflictos en el spooler y garantizar que el auto-corte funcione en todos los tickets
const printQueue = [];
let isPrinting = false;

async function ensureCupsPrinterReady(printerName) {
  if (process.platform !== 'linux') return;
  const pName = printerName && printerName.trim() !== '' ? printerName.trim() : (sewooPrinterName || 'SEWOO_LKTSERIES');
  const run = (cmd, args) => new Promise(res => {
    try {
      const p = spawn(cmd, args, { shell: false });
      p.on('close', () => res());
      p.on('error', () => res());
    } catch (e) {
      res();
    }
  });

  const targets = pName ? [pName] : [];
  for (const t of targets) {
    await run('/usr/sbin/cupsenable', [t]);
    await run('cupsenable', [t]);
    await run('/usr/sbin/cupsaccept', [t]);
    await run('cupsaccept', [t]);
  }
}

async function resolvePrinterName(win) {
  if (sewooPrinterName && sewooPrinterName.trim() !== '') {
    return sewooPrinterName;
  }
  try {
    const targetWin = win || mainWindow;
    if (targetWin && targetWin.webContents) {
      const printers = await targetWin.webContents.getPrintersAsync();
      const defaultPrinter = printers.find(p => p.isDefault);
      if (defaultPrinter) {
        sewooPrinterName = defaultPrinter.name;
        return defaultPrinter.name;
      }
      if (printers.length > 0) {
        sewooPrinterName = printers[0].name;
        return printers[0].name;
      }
    }
  } catch (e) {
    console.error('[Electron Print] Error al obtener impresoras del sistema:', e);
  }
  return 'SEWOO_LKTSERIES';
}

async function printHtmlWindow(printWin, targetPrinterName, options = {}) {
  const openDrawer = options.openDrawer !== false;
  if (process.platform === 'linux') {
    try {
      const pdfBuffer = await printWin.webContents.printToPDF({
        pageSize: { width: 2.28, height: 11 }, // 58mm width
        margins: { top: 0, bottom: 0, left: 0, right: 0 },
        printBackground: true
      });
      const tempPdfPath = path.join(app.getPath('temp'), `comanda_${Date.now()}.pdf`);
      fs.writeFileSync(tempPdfPath, pdfBuffer);

      return new Promise((resolve) => {
        // Enviar trabajo a CUPS con opción nativa del driver Sewoo para abrir el cajón monedero (si corresponde)
        const drawerArgs = openDrawer ? ['-o', 'StartCD=3OpenDrawerAllEnabled'] : ['-o', 'StartCD=0OpenDrawersDisabled'];
        const args = (targetPrinterName && targetPrinterName.trim() !== '')
          ? ['-P', targetPrinterName, ...drawerArgs, tempPdfPath]
          : [...drawerArgs, tempPdfPath];

        const lprProc = spawn('lpr', args, { shell: false });

        lprProc.on('close', (code) => {
          try { fs.unlinkSync(tempPdfPath); } catch (e) { }
          if (code !== 0) {
            ensureCupsPrinterReady(targetPrinterName).catch(() => {});
          }
          resolve(code === 0);
        });

        lprProc.on('error', (err) => {
          console.error('[Electron Print Linux] Error al ejecutar lpr:', err);
          try { fs.unlinkSync(tempPdfPath); } catch (e) { }
          ensureCupsPrinterReady(targetPrinterName).catch(() => {});
          resolve(false);
        });
      });
    } catch (err) {
      console.error('[Electron Print Linux] Error al generar PDF para lpr:', err);
      return false;
    }
  } else {
    return new Promise((resolve) => {
      const printOptions = {
        silent: true,
        printBackground: true,
        color: false,
        margins: { marginType: 'none' }
      };

      if (targetPrinterName && targetPrinterName.trim() !== '') {
        printOptions.deviceName = targetPrinterName;
      }

      printWin.webContents.print(printOptions, (success, errorType) => {
        if (!success) {
          console.error('[Electron Print] Error al imprimir:', errorType);
        } else {
          console.log('[Electron Print] Documento impreso con éxito.');
        }
        resolve(success);
      });
    });
  }
}

async function sendRawPulseToPrinter(targetPrinterName) {
  // Nota: NO incluir 0x1B, 0x40 (ESC @ reset) porque reinicia el chip USB de la impresora y desconecta el bus
  const pulseBuffer = Buffer.from([
    0x1B, 0x70, 0x00, 0x19, 0xFA,       // ESC p 0 25 250 (Pin 2 pulse)
    0x1B, 0x70, 0x01, 0x19, 0xFA,       // ESC p 1 25 250 (Pin 5 pulse)
    0x10, 0x14, 0x01, 0x01, 0x01,       // DLE DC4 1 1 1 (Realtime pulse)
    0x07                                // BEL (Bell pulse)
  ]);
  const tempPulsePath = path.join(app.getPath('temp'), `drawer_pulse_${Date.now()}.bin`);
  fs.writeFileSync(tempPulsePath, pulseBuffer);

  const printerName = targetPrinterName || sewooPrinterName || 'SEWOO_LKTSERIES';

  if (process.platform === 'linux') {
    return new Promise((resolve) => {
      const args = (printerName && printerName.trim() !== '')
        ? ['-o', 'raw', '-P', printerName, tempPulsePath]
        : ['-o', 'raw', tempPulsePath];

      const lprProc = spawn('lpr', args, { shell: false });
      lprProc.on('close', (code) => {
        try { fs.unlinkSync(tempPulsePath); } catch (e) {}
        resolve(code === 0);
      });
      lprProc.on('error', () => {
        const lpArgs = (printerName && printerName.trim() !== '')
          ? ['-d', printerName, '-o', 'raw', tempPulsePath]
          : ['-o', 'raw', tempPulsePath];
        const lpProc = spawn('lp', lpArgs, { shell: false });
        lpProc.on('close', () => {
          try { fs.unlinkSync(tempPulsePath); } catch (e) {}
          resolve();
        });
        lpProc.on('error', () => {
          try { fs.unlinkSync(tempPulsePath); } catch (e) {}
          resolve();
        });
      });
    });
  } else if (process.platform === 'win32') {
    return new Promise((resolve) => {
      const escapedPrinter = (printerName || '').replace(/"/g, '`"');
      const escapedPath = tempPulsePath.replace(/\\/g, '\\\\');
      const psScript = `
        $printerName = "${escapedPrinter}";
        $filePath = "${escapedPath}";
        if (-not $printerName) {
          $printerName = (Get-CimInstance -ClassName Win32_Printer -ErrorAction SilentlyContinue | Where-Object { $_.Default -eq $true }).Name;
          if (-not $printerName) {
            $printerName = (Get-WmiObject -Class Win32_Printer -ErrorAction SilentlyContinue | Where-Object { $_.Default -eq $true }).Name;
          }
        }
        if ($printerName) {
          $bytes = [System.IO.File]::ReadAllBytes($filePath);
          $dllPath = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "CalibreRawPrint.dll");
          if (-not (Test-Path $dllPath)) {
            Add-Type -TypeDefinition @"
            using System;
            using System.Runtime.InteropServices;
            public class RawPrinterHelper {
              [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Ansi)]
              public class DOCINFOA {
                [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
                [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
                [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
              }
              [DllImport("winspool.Drv", EntryPoint="OpenPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true)]
              public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);
              [DllImport("winspool.Drv", EntryPoint="ClosePrinter", SetLastError=true, ExactSpelling=true)]
              public static extern bool ClosePrinter(IntPtr hPrinter);
              [DllImport("winspool.Drv", EntryPoint="StartDocPrinterA", SetLastError=true, CharSet=CharSet.Ansi, ExactSpelling=true)]
              public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
              [DllImport("winspool.Drv", EntryPoint="EndDocPrinter", SetLastError=true, ExactSpelling=true)]
              public static extern bool EndDocPrinter(IntPtr hPrinter);
              [DllImport("winspool.Drv", EntryPoint="StartPagePrinter", SetLastError=true, ExactSpelling=true)]
              public static extern bool StartPagePrinter(IntPtr hPrinter);
              [DllImport("winspool.Drv", EntryPoint="EndPagePrinter", SetLastError=true, ExactSpelling=true)]
              public static extern bool EndPagePrinter(IntPtr hPrinter);
              [DllImport("winspool.Drv", EntryPoint="WritePrinter", SetLastError=true, ExactSpelling=true)]
              public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);
              public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes) {
                IntPtr pBytes = Marshal.AllocHGlobal(bytes.Length);
                Marshal.Copy(bytes, 0, pBytes, bytes.Length);
                IntPtr hPrinter = new IntPtr(0);
                DOCINFOA di = new DOCINFOA();
                di.pDocName = "Pulse Drawer";
                di.pDataType = "RAW";
                bool bSuccess = false;
                if (OpenPrinter(szPrinterName.Normalize(), out hPrinter, IntPtr.Zero)) {
                  if (StartDocPrinter(hPrinter, 1, di)) {
                    if (StartPagePrinter(hPrinter)) {
                      bSuccess = WritePrinter(hPrinter, pBytes, bytes.Length, out _);
                      EndPagePrinter(hPrinter);
                    }
                    EndDocPrinter(hPrinter);
                  }
                  ClosePrinter(hPrinter);
                }
                Marshal.FreeHGlobal(pBytes);
                return bSuccess;
              }
            }
"@ -OutputAssembly $dllPath -ErrorAction SilentlyContinue
          }
          if (Test-Path $dllPath) {
            Add-Type -Path $dllPath -ErrorAction SilentlyContinue
          }
          [RawPrinterHelper]::SendBytesToPrinter($printerName, $bytes)
        }
      `;
      const psProc = spawn('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
      psProc.on('close', () => {
        try { fs.unlinkSync(tempPulsePath); } catch (e) {}
        resolve();
      });
      psProc.on('error', () => {
        try { fs.unlinkSync(tempPulsePath); } catch (e) {}
        resolve();
      });
    });
  } else {
    try { fs.unlinkSync(tempPulsePath); } catch (e) {}
  }
}

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

function getPromoSubItems(p) {
  if (!p) return [];
  const subItems = [];

  const getItemName = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item.trim();
    return (
      item.nombre_producto ||
      item.nombre ||
      item.nombre_opcion ||
      item.producto_nombre ||
      item.label ||
      ''
    ).trim();
  };

  let prodsIncl = p.productos_incluidos;
  if (typeof prodsIncl === 'string') {
    try { prodsIncl = JSON.parse(prodsIncl); } catch (e) { }
  }

  // 1. Si vienen productos_incluidos (formato guardado en BD / historial)
  if (prodsIncl && Array.isArray(prodsIncl) && prodsIncl.length > 0) {
    const agrupados = prodsIncl.reduce((acc, opt) => {
      const nom = getItemName(opt);
      if (nom && nom !== 'undefined') {
        const cant = parseInt(opt.cantidad) || 1;
        if (!acc[nom]) {
          acc[nom] = { nombre: nom, cantidad: 0 };
        }
        acc[nom].cantidad += cant;
      }
      return acc;
    }, {});

    Object.values(agrupados).forEach(group => {
      const cantStr = group.cantidad > 1 ? `${group.cantidad}x ` : '';
      subItems.push(`${cantStr}${group.nombre}`);
    });
  } else {
    // 2. Productos fijos de la promoción
    if (p.productos_fijos && Array.isArray(p.productos_fijos) && p.productos_fijos.length > 0) {
      p.productos_fijos.forEach(pf => {
        const nom = getItemName(pf);
        if (nom && nom !== 'undefined') {
          const cant = parseInt(pf.cantidad) || 1;
          const cantStr = cant > 1 ? `${cant}x ` : '';
          subItems.push(`${cantStr}${nom}`);
        }
      });
    }

    // 3. Opciones elegidas en los pasos de la promoción (agrupadas)
    if (p.opciones_elegidas && Array.isArray(p.opciones_elegidas) && p.opciones_elegidas.length > 0) {
      const agrupados = p.opciones_elegidas.reduce((acc, opt) => {
        const nom = getItemName(opt);
        if (nom && nom !== 'undefined') {
          const cant = parseInt(opt.cantidad) || 1;
          if (!acc[nom]) {
            acc[nom] = { nombre: nom, cantidad: 0 };
          }
          acc[nom].cantidad += cant;
        }
        return acc;
      }, {});

      Object.values(agrupados).forEach(group => {
        const cantStr = group.cantidad > 1 ? `${group.cantidad}x ` : '';
        subItems.push(`${cantStr}${group.nombre}`);
      });
    }
  }

  return subItems.filter(str => str && !str.includes('undefined'));
}

function printTicketPromise(ticket) {
  return new Promise((resolve) => {
    try {
      const itemsRows = ticket.productos.map(p => {
        const subItems = getPromoSubItems(p);
        const mostrarNombre = p.mostrar_nombre_ticket !== false && p.mostrar_nombre_ticket !== 0 && p.mostrar_nombre_ticket !== '0' && p.mostrar_nombre_ticket !== 'false';

        const subItemsHtml = subItems.length > 0
          ? subItems.map(item => `
              <div style="font-size: 9.5px; font-weight: bold; padding-left: ${mostrarNombre ? '1mm' : '0mm'}; margin-top: 0.2mm; word-break: break-word;">
                - ${item}
              </div>
            `).join('')
          : '';

        const nombreHtml = mostrarNombre
          ? `<div style="font-weight: bold;">${p.nombre || 'Producto'}</div>`
          : '';

        return `
          <tr>
            <td style="padding-left: 0.5mm; vertical-align: top;">${p.cantidad}</td>
            <td style="vertical-align: top;">
              ${nombreHtml}
              ${subItemsHtml}
            </td>
            <td style="text-align: right; padding-right: 0.5mm; vertical-align: top;">
              $${(parseFloat(p.precio) * p.cantidad).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
            </td>
          </tr>
        `;
      }).join('');

      const rawFecha = ticket.fecha_hora;
      let fechaStr = '';
      let horaStr = '';
      if (!rawFecha) {
        const dObj = new Date();
        fechaStr = dObj.toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });
        horaStr = dObj.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false });
      } else {
        const rawStr = String(rawFecha).trim();
        const match = rawStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
        if (match && !rawStr.includes('Z') && !rawStr.includes('+') && !rawStr.match(/-\d{2}:\d{2}$/)) {
          const [_, yyyy, mm, dd, hh, min] = match;
          fechaStr = `${dd}/${mm}/${yyyy}`;
          horaStr = `${hh}:${min}`;
        } else {
          const dObj = new Date(rawStr);
          fechaStr = !isNaN(dObj.getTime()) ? dObj.toLocaleDateString('es-CL', { timeZone: 'America/Santiago' }) : rawStr;
          horaStr = !isNaN(dObj.getTime()) ? dObj.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false }) : '';
        }
      }
      const tipoEntregaStr = ticket.tipo_entrega === 'Llevar' ? 'PARA LLEVAR' : 'PARA SERVIR';
      const metodoPagoStr = (ticket.tipo_transaccion || 'Efectivo').toUpperCase();
      const pagoMixtoDetalle = (ticket.tipo_transaccion === 'Mixto' && ticket.pago_mixto_detalle)
        ? `<div style="font-size: 9.5px; font-weight: bold; margin-top: 0.5mm;">(${ticket.pago_mixto_detalle})</div>`
        : '';
      const totalStr = ticket.total.toLocaleString('es-CL', { minimumFractionDigits: 0 });

      const localNombre = ticket.local_nombre || 'Calibre 25';
      const localDireccion = ticket.local_direccion || '';
      const localTelefono = ticket.local_telefono || '';
      const localPieTicket = ticket.local_pie_ticket || 'Gracias por su preferencia';
      const impuestoIvaPorcentaje = parseFloat(ticket.impuesto_iva_porcentaje) || 0;
      const impuestoIncluido = ticket.impuesto_incluido !== false;

      let impuestoHtml = '';
      if (impuestoIvaPorcentaje > 0) {
        const totalNum = parseFloat(ticket.total) || 0;
        const neto = impuestoIncluido
          ? Math.round(totalNum / (1 + (impuestoIvaPorcentaje / 100)))
          : Math.round(totalNum / (1 + (impuestoIvaPorcentaje / 100)));
        const iva = totalNum - neto;
        impuestoHtml = `
          <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: normal; margin-top: 1.5mm; border-top: 1px dashed #dddddd; padding-top: 1mm;">
            <span>${impuestoIncluido ? 'IVA Incluido' : 'Neto'}:</span>
            <span>$${iva.toLocaleString('es-CL')}</span>
          </div>
        `;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            @page {
              size: 58mm auto;
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
              width: 56mm !important;
              max-width: 56mm !important;
              margin: 0 !important;
              padding: 2mm 1mm 8mm 1mm !important;
              font-family: 'Courier New', Courier, monospace;
              font-size: 10px;
              line-height: 1.25;
              letter-spacing: 0px;
              background-color: #ffffff !important;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            
            /* Estilos réplica de la comanda digital */
            .comanda-header {
              text-align: center;
              border-bottom: 1.5px dashed #000000;
              padding-bottom: 1mm;
              margin-bottom: 1mm;
            }
            .comanda-client-name {
              font-size: 15px;
              font-weight: bold;
              margin: 0 0 0.5mm 0;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              line-height: 1.1;
              word-break: break-word;
            }
            .comanda-local-name {
              font-size: 11px;
              font-weight: bold;
              margin-bottom: 0.5mm;
              text-transform: uppercase;
            }
            .comanda-ticket-number {
              font-size: 13px;
              font-weight: bold;
              display: inline-block;
              padding: 0.5mm 2mm;
              border: 1.5px solid #000000;
              margin: 0.5mm 0 1mm 0;
            }
            .delivery-type {
              font-size: 12px;
              font-weight: bold;
              margin: 0.5mm 0;
              text-transform: uppercase;
            }
            .comanda-banner-llevar {
              background-color: #000000 !important;
              color: #ffffff !important;
              border: 2px solid #000000 !important;
              padding: 2.2mm 1mm !important;
              margin: 1.5mm 0 !important;
              text-align: center !important;
            }
            .comanda-banner-llevar * {
              color: #ffffff !important;
              background-color: #000000 !important;
            }
            .comanda-banner-servir {
              background-color: #ffffff !important;
              color: #000000 !important;
              border: 1.5px solid #000000 !important;
              padding: 1.5mm 1mm !important;
              margin: 1.5mm 0 !important;
              text-align: center !important;
            }
            .comanda-date-time {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              margin-top: 1mm;
              white-space: nowrap;
            }
            .comanda-body {
              margin-bottom: 1mm;
            }
            .comanda-table {
              width: 100%;
              table-layout: fixed;
              border-collapse: collapse;
              font-size: 10px;
              letter-spacing: 0px;
            }
            .comanda-table th {
              border-bottom: 1.2px solid #000000;
              padding: 1mm 0;
              font-weight: bold;
              text-align: left;
              white-space: nowrap;
            }
            .comanda-table td {
              padding: 1mm 0;
              border-bottom: 1px dashed #cccccc;
              word-break: break-word;
              overflow-wrap: break-word;
            }
            .comanda-footer {
              border-top: 1.5px dashed #000000;
              padding-top: 1mm;
              margin-bottom: 1mm;
              display: flex;
              flex-direction: column;
              gap: 1mm;
            }
            .comanda-note {
              font-style: italic;
              font-size: 10px;
              padding: 1mm;
              border: 1px dashed #000000;
              text-align: left;
              margin-bottom: 1mm;
              word-break: break-word;
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
              margin-top: 0.5mm;
              width: 100%;
              padding: 0 0.5mm;
            }
            .comanda-total-label {
              font-size: 13px;
              font-weight: bold;
            }
            .comanda-total-value {
              font-size: 14px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="comanda-header">
            <h2 class="comanda-client-name">${ticket.cliente || '<span style="display:inline-block; width: 140px; height: 26px; border: 1.5px solid #000; border-radius: 4px; vertical-align: middle;"></span>'}</h2>
            <div class="comanda-local-name">${localNombre}</div>
            ${localDireccion ? `<div style="font-size: 10px; font-weight: normal; margin-bottom: 0.5mm;">📍 ${localDireccion}</div>` : ''}
            ${localTelefono ? `<div style="font-size: 10px; font-weight: normal; margin-bottom: 1mm;">📞 Tel: ${localTelefono}</div>` : ''}
            ${ticket.es_comprobante
              ? `<div class="comanda-ticket-number" style="font-size: 11.5px; border: 1.5px solid #000; padding: 1mm 2mm; margin: 1mm 0;">*** COMPROBANTE DE PEDIDO ***</div>
                 <div style="font-size: 8.5px; font-weight: bold; margin-bottom: 1mm;">(PRE-CUENTA / NO VÁLIDO COMO BOLETA)</div>`
              : (ticket.tipo_transaccion === 'Pedido Externo'
                  ? `<div class="comanda-ticket-number" style="font-size: 11.5px; border: 2px solid #000; padding: 1mm 2mm; margin: 1mm 0; background: #eee;">*** PEDIDO EXTERNO ***</div>
                     <div style="font-size: 10px; font-weight: bold; margin-bottom: 1mm;">Ticket N° ${String(ticket.ticket).slice(-4)} (PEDIDOSYA / APP)</div>`
                  : `<div class="comanda-ticket-number">Ticket N° ${String(ticket.ticket).slice(-4)}</div>`)
            }
            ${ticket.tipo_entrega === 'Llevar' ? `
              <div class="comanda-banner-llevar">
                <div style="font-size: 15px; font-weight: 900 !important; letter-spacing: 1.2px; line-height: 1.1;">
                  ★★★ PARA LLEVAR ★★★
                </div>
                <div style="font-size: 9.5px; font-weight: bold !important; margin-top: 0.5mm;">
                  ${ticket.es_comprobante ? 'PRE-CUENTA / COMPROBANTE' : metodoPagoStr}
                </div>
              </div>
            ` : (ticket.tipo_transaccion === 'Pedido Externo' ? `
              <div style="background-color: #eeeeee !important; border: 2px solid #000; padding: 1.5mm 1mm; margin: 1.5mm 0; text-align: center;">
                <div style="font-size: 13px; font-weight: 900; letter-spacing: 1px;">
                  🛵 PEDIDO EXTERNO (LLEVAR)
                </div>
                <div style="font-size: 9.5px; margin-top: 0.5mm;">${ticket.es_comprobante ? 'PRE-CUENTA' : metodoPagoStr}</div>
              </div>
            ` : `
              <div class="comanda-banner-servir">
                <div style="font-size: 12.5px; font-weight: bold; letter-spacing: 0.5px;">
                  🍽️ PARA SERVIR
                </div>
                <div style="font-size: 9px; font-weight: normal; margin-top: 0.5mm;">
                  ${ticket.es_comprobante ? 'PRE-CUENTA' : metodoPagoStr}
                </div>
              </div>
            `)}
            ${pagoMixtoDetalle}
            <div class="comanda-date-time">
              <span>Fecha: ${fechaStr}</span>
              <span style="margin-left: 5mm;">Hora: ${horaStr} hrs</span>
            </div>
          </div>

          <div class="comanda-body">
            <table class="comanda-table">
              <thead>
                <tr>
                  <th style="width: 15%; padding-left: 0.5mm; white-space: nowrap;">Cant</th>
                  <th style="width: 63%;">Producto</th>
                  <th style="width: 22%; text-align: right; padding-right: 0.5mm; white-space: nowrap;">Precio</th>
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
            ${ticket.tipo_transaccion === 'Pedido Externo' ? `
              <div style="border-top: 1.5px dashed #000; padding-top: 1.5mm; margin-top: 1mm; text-align: center;">
                <div style="font-size: 12px; font-weight: bold; border: 1.5px solid #000; padding: 1mm; display: inline-block;">🛵 PEDIDO EXTERNO</div>
                <div style="font-size: 9.5px; font-weight: bold; margin-top: 1mm;">PAGADO EN PLATAFORMA / NO COBRAR</div>
              </div>
            ` : `
              <div class="comanda-total-row">
                <span class="comanda-total-label">TOTAL:</span>
                <span class="comanda-total-value">$${totalStr}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 10.5px; font-weight: bold; margin-top: 1mm; border-top: 1px dashed #000000; padding-top: 1mm;">
                <span>MÉTODO DE PAGO:</span>
                <span>${metodoPagoStr}</span>
              </div>
            `}
            ${ticket.tipo_transaccion === 'Mixto' && ticket.pago_mixto_detalle ? `
              <div style="text-align: right; font-size: 9.5px; font-weight: bold; margin-top: 0.5mm;">
                (${ticket.pago_mixto_detalle})
              </div>
            ` : ''}
            ${impuestoHtml}
          </div>

          <div class="text-center" style="font-size: 11px; margin-top: 3mm; border-top: 1px dashed #000000; padding-top: 1.5mm;">
            ${localPieTicket.split('\n').map(line => `<p style="margin: 2px 0;">${line}</p>`).join('')}
          </div>
          <div style="height: 10mm;"></div>

        </body>
        </html>
      `;

      // Cargar el HTML como data: URL para evitar latencia de I/O de archivos temporales
      // Esto hace que did-finish-load dispare casi instantáneamente en lugar de esperar al disco
      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);

      const printWin = getReusablePrintWin();

      printWin.webContents.once('did-finish-load', async () => {
        try {
          const targetPrinterName = await resolvePrinterName(printWin);
          console.log(`[Electron Print] Usando impresora para ticket: ${targetPrinterName || 'Predeterminada del Sistema'}`);

          const abrirCaja = ticket.abrir_caja !== false && !ticket.es_comprobante && ticket.tipo_transaccion !== 'Pedido Externo';

          // 1. Enviar el trabajo a la impresora de forma inmediata (inicia impresión al instante)
          await printHtmlWindow(printWin, targetPrinterName, { openDrawer: abrirCaja });

          // 2. Si es Windows y se requiere abrir cajón de dinero, enviar pulso tras enviar el documento
          if (abrirCaja && process.platform === 'win32') {
            sendRawPulseToPrinter(targetPrinterName).catch(errPulse => {
              console.error('[Electron Print] Error en RAW pulse al imprimir ticket:', errPulse);
            });
          }
        } catch (err) {
          console.error('[Electron Print] Error al imprimir ticket:', err);
        } finally {
          resolve();
        }
      });

      printWin.loadURL(dataUrl);

    } catch (err) {
      console.error('[Electron Print] Error general en el proceso de impresión:', err);
      resolve();
    }
  });
}

function printReportPromise(report) {
  return new Promise((resolve) => {
    try {
      let fechaStr = '';
      if (report.periodo_texto) {
        fechaStr = report.periodo_texto;
      } else if (report.fecha_inicio && report.fecha_fin && report.fecha_inicio !== report.fecha_fin) {
        const p1 = String(report.fecha_inicio).split('-');
        const p2 = String(report.fecha_fin).split('-');
        const f1 = p1.length === 3 ? `${p1[2]}/${p1[1]}/${p1[0]}` : report.fecha_inicio;
        const f2 = p2.length === 3 ? `${p2[2]}/${p2[1]}/${p2[0]}` : report.fecha_fin;
        fechaStr = `${f1} al ${f2}`;
      } else if (report.fecha && String(report.fecha).includes('al')) {
        const parts = String(report.fecha).split('al').map(s => s.trim());
        const f1 = parts[0].includes('-') ? parts[0].split('-').reverse().join('/') : parts[0];
        const f2 = parts[1].includes('-') ? parts[1].split('-').reverse().join('/') : parts[1];
        fechaStr = `${f1} al ${f2}`;
      } else if (report.fecha) {
        const parts = String(report.fecha).split('-');
        if (parts.length === 3) {
          fechaStr = `${parts[2]}/${parts[1]}/${parts[0]}`;
        } else {
          const d = new Date(report.fecha + 'T12:00:00');
          fechaStr = !isNaN(d.getTime()) ? d.toLocaleDateString('es-CL') : report.fecha;
        }
      }
      const impresoFecha = new Date().toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });
      const impresoHora = new Date().toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false });

      let html = '';

      if (report.tipo_reporte === 'consolidado') {
        const unificadosItems = report.productos_unificados || [];
        const totalUnidadesCount = unificadosItems.reduce((acc, curr) => acc + (curr.cantidad_total || 0), 0);

        // Agrupar productos por categoría
        const gruposCategorias = {};
        for (const item of unificadosItems) {
          const cat = item.categoria || 'Otros';
          if (!gruposCategorias[cat]) {
            gruposCategorias[cat] = [];
          }
          gruposCategorias[cat].push(item);
        }

        // Orden de categorías configurado
        const catOrder = Array.isArray(report.categorias_orden) ? report.categorias_orden : [];
        const sortedCats = Object.keys(gruposCategorias).sort((a, b) => {
          const idxA = catOrder.indexOf(a);
          const idxB = catOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.localeCompare(b);
        });

        const categoriasBloquesHtml = sortedCats.map(catName => {
          const prods = gruposCategorias[catName];
          const subtotalCat = prods.reduce((sum, p) => sum + (p.cantidad_total || 0), 0);
          const catEmoji = prods[0]?.categoria_emoji || '';

          const rows = prods.map(item => `
            <tr>
              <td style="width: 20%; padding: 0.4mm 0; font-size: 9.5px; font-weight: bold; vertical-align: top;">
                ${item.cantidad_total}x
              </td>
              <td style="width: 80%; padding: 0.4mm 0; word-break: break-word; font-size: 9.5px; vertical-align: top; border-bottom: 1px dotted #dddddd;">
                ${item.nombre_producto}
              </td>
            </tr>
          `).join('');

          return `
            <div style="margin-top: 1.8mm; margin-bottom: 0.4mm; font-size: 9.5px; font-weight: bold; border-top: 1px dashed #000000; border-bottom: 1px solid #000000; padding: 0.5mm 0 0.3mm 0; display: flex; justify-content: space-between; text-transform: uppercase;">
              <span>${catEmoji ? catEmoji + ' ' : ''}${catName}</span>
              <span>(${subtotalCat} un.)</span>
            </div>
            <table class="report-table" style="margin-bottom: 1.2mm;">
              <tbody>
                ${rows}
              </tbody>
            </table>
          `;
        }).join('');

        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              @page {
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
                width: 56mm !important;
                max-width: 56mm !important;
                margin: 0 !important;
                padding: 2mm 1mm 15mm 1mm !important;
                font-family: 'Courier New', Courier, monospace;
                font-size: 9.5px;
                background-color: #ffffff !important;
                line-height: 1.25;
                letter-spacing: 0.2px;
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
                margin-bottom: 1.2mm;
              }
              .report-title {
                font-size: 12px;
                font-weight: bold;
                margin: 0 0 0.5mm 0;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                word-break: break-word;
              }
              .report-date-time {
                font-size: 9px;
                margin-top: 0.5mm;
              }
              .report-section-title {
                font-size: 10px;
                font-weight: bold;
                border-bottom: 1.2px solid #000000;
                padding: 0.4mm 0;
                margin-top: 1.8mm;
                margin-bottom: 0.8mm;
                text-transform: uppercase;
              }
              .report-table {
                width: 100%;
                table-layout: fixed;
                border-collapse: collapse;
                font-size: 9.5px;
              }
              .report-table td {
                padding: 0.4mm 0;
                border-bottom: 1px dotted #dddddd;
                word-break: break-word;
                overflow-wrap: break-word;
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <h2 class="report-title">CONSOLIDADO DE VENTAS</h2>
              <div style="font-size: 10px;">Calibre 25</div>
              <div class="report-date-time">
                ${(report.is_intervalo || (report.fecha_inicio && report.fecha_fin && report.fecha_inicio !== report.fecha_fin) || String(report.fecha).includes('al')) ? 'Período' : 'Fecha'}: ${fechaStr}<br/>
                Impreso: ${impresoFecha} ${impresoHora}
              </div>
            </div>

            <div class="report-section-title">Productos por Categoría</div>
            <div style="font-size: 9px; margin-top: 0.4mm; margin-bottom: 0.8mm; font-weight: normal;">Consolidado de unidades vendidas:</div>

            ${categoriasBloquesHtml}

            <div style="border-top: 1.5px dashed #000000; margin-top: 2mm; padding-top: 1.2mm; display: flex; justify-content: space-between; font-size: 10.5px; font-weight: bold;">
              <span>TOTAL UNIDADES:</span>
              <span>${totalUnidadesCount} un.</span>
            </div>

            <div class="text-center" style="font-size: 9.5px; margin-top: 4mm; border-top: 1px dashed #000000; padding-top: 1.5mm;">
              <p style="margin: 2px 0;">Calibre 25 - Gestión de Caja</p>
            </div>
            <div style="height: 12mm;"></div>
          </body>
          </html>
        `;
      } else if (report.tipo_reporte === 'inventario') {
        const ingredientesRows = (report.ingredientes_gastados || []).map(ing => `
          <tr>
            <td>${ing.ingrediente_nombre}</td>
            <td style="text-align: right;">${parseFloat(ing.cantidad_gastada).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ${ing.unidad || ''}</td>
          </tr>
        `).join('');

        const inventarioRows = (report.inventario_actual || []).map(ing => `
          <tr>
            <td>${ing.nombre}</td>
            <td style="text-align: right;">${parseFloat(ing.stock).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ${ing.unidad || ''}</td>
          </tr>
        `).join('');

        const entradasRows = (report.entradas_inventario || []).map(item => `
          <tr>
            <td>${item.ingrediente_nombre}</td>
            <td style="text-align: right;">+${parseFloat(item.cantidad_total).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ${item.unidad || ''}</td>
          </tr>
        `).join('');

        const mermasRows = (report.mermas_inventario || []).map(item => `
          <tr>
            <td>${item.ingrediente_nombre}</td>
            <td style="text-align: right;">-${parseFloat(item.cantidad_total).toLocaleString('es-CL', { maximumFractionDigits: 2 })} ${item.unidad || ''}</td>
          </tr>
        `).join('');

        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              @page {
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
                width: 56mm !important;
                max-width: 56mm !important;
                margin: 0 !important;
                padding: 2mm 1mm 15mm 1mm !important;
                font-family: 'Courier New', Courier, monospace;
                font-size: 9.5px;
                background-color: #ffffff !important;
                line-height: 1.25;
                letter-spacing: 0.2px;
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
                margin-bottom: 1.2mm;
              }
              .report-title {
                font-size: 12px;
                font-weight: bold;
                margin: 0 0 0.5mm 0;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                word-break: break-word;
              }
              .report-date-time {
                font-size: 9px;
                margin-top: 0.5mm;
              }
              .report-section-title {
                font-size: 10px;
                font-weight: bold;
                border-bottom: 1.2px solid #000000;
                padding: 0.4mm 0;
                margin-top: 2.2mm;
                margin-bottom: 0.8mm;
                text-transform: uppercase;
              }
              .report-table {
                width: 100%;
                table-layout: fixed;
                border-collapse: collapse;
                font-size: 9.5px;
              }
              .report-table td {
                padding: 0.4mm 0;
                border-bottom: 1px dotted #dddddd;
                word-break: break-word;
                overflow-wrap: break-word;
                font-size: 9.5px;
              }
              .report-table th {
                border-bottom: 1.2px solid #000000;
                padding: 0.4mm 0;
                text-align: left;
                font-size: 9.5px;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <h2 class="report-title">REPORTE DE INVENTARIO</h2>
              <div style="font-size: 10px;">Calibre 25</div>
              <div class="report-date-time">
                ${(report.is_intervalo || (report.fecha_inicio && report.fecha_fin && report.fecha_inicio !== report.fecha_fin) || String(report.fecha).includes('al')) ? 'Período' : 'Fecha'}: ${fechaStr}<br/>
                ${report.turno_nombre ? `Turno: ${report.turno_nombre}<br/>` : ''}
                Impreso: ${impresoFecha} ${impresoHora}
              </div>
            </div>

            <div class="report-section-title">🥑 MATERIA PRIMA GASTADA</div>
            ${ingredientesRows ? `
              <table class="report-table">
                <thead>
                  <tr>
                    <th style="width: 65%;">Ingrediente</th>
                    <th style="width: 35%; text-align: right;">Cant</th>
                  </tr>
                </thead>
                <tbody>
                  ${ingredientesRows}
                </tbody>
              </table>
            ` : '<div style="font-size: 8.5px; padding: 1mm 0; font-style: italic;">Sin consumo de materia prima registrado.</div>'}

            <div class="report-section-title">📥 LLEGADA DE MATERIA PRIMA</div>
            ${entradasRows ? `
              <table class="report-table">
                <thead>
                  <tr>
                    <th style="width: 65%;">Ingrediente</th>
                    <th style="width: 35%; text-align: right;">Ingreso</th>
                  </tr>
                </thead>
                <tbody>
                  ${entradasRows}
                </tbody>
              </table>
            ` : '<div style="font-size: 8.5px; padding: 1mm 0; font-style: italic;">Sin entradas de mercadería registradas.</div>'}

            <div class="report-section-title">⚠️ MERMAS Y CONSUMO</div>
            ${mermasRows ? `
              <table class="report-table">
                <thead>
                  <tr>
                    <th style="width: 65%;">Ingrediente</th>
                    <th style="width: 35%; text-align: right;">Merma</th>
                  </tr>
                </thead>
                <tbody>
                  ${mermasRows}
                </tbody>
              </table>
            ` : '<div style="font-size: 8.5px; padding: 1mm 0; font-style: italic;">Sin mermas ni consumo interno registrados.</div>'}

            ${inventarioRows ? `
              <div class="report-section-title">📦 INVENTARIO ACTUAL</div>
              <table class="report-table">
                <thead>
                  <tr>
                    <th style="width: 65%;">Ingrediente</th>
                    <th style="width: 35%; text-align: right;">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  ${inventarioRows}
                </tbody>
              </table>
            ` : ''}

            <div class="text-center" style="font-size: 9.5px; margin-top: 4mm; border-top: 1px dashed #000000; padding-top: 1.5mm;">
              <p style="margin: 2px 0;">Calibre 25 - Control de Inventario</p>
            </div>
            <div style="height: 12mm;"></div>
          </body>
          </html>
        `;
      } else {
        const productosRows = (report.productos_vendidos || []).map(p => `
          <tr>
            <td style="width: 16%;">${p.cantidad_vendida}</td>
            <td style="width: 52%;">${p.nombre_producto}</td>
            <td style="width: 32%; text-align: right;">
              $${(p.total_pesos || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
            </td>
          </tr>
        `).join('');

        const envasesRow = (report.envases_vendidos && report.envases_vendidos.cantidad > 0) ? `
          <tr>
            <td style="width: 16%;">${report.envases_vendidos.cantidad}</td>
            <td style="width: 52%;">Envases para llevar</td>
            <td style="width: 32%; text-align: right;">
              $${(report.envases_vendidos.total_pesos || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}
            </td>
          </tr>
        ` : '';

        const totalEnvasesPesos = report.envases_vendidos ? (report.envases_vendidos.total_pesos || 0) : 0;
        const totalProductosPesos = (report.productos_vendidos || []).reduce((acc, curr) => acc + (curr.total_pesos || 0), 0) + totalEnvasesPesos;
        const totalProductosPesosStr = totalProductosPesos.toLocaleString('es-CL', { minimumFractionDigits: 0 });

        const totalVentasStr = parseFloat(report.total_ventas || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });
        const totalEfectivoStr = parseFloat(report.total_efectivo || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });
        const totalGastosNum = parseFloat(report.total_gastos || 0);
        const totalGastosStr = totalGastosNum.toLocaleString('es-CL', { minimumFractionDigits: 0 });
        const totalDebitoStr = parseFloat(report.total_debito || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });
        const totalCreditoStr = parseFloat(report.total_credito || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });

        const fondoAperturaStr = parseFloat(report.fondo_apertura || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });
        const efectivoRealStr = parseFloat(report.efectivo_real || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });
        const efectivoEsperadoNum = parseFloat(report.total_efectivo || 0) + parseFloat(report.fondo_apertura || 0) - totalGastosNum;
        const efectivoEsperadoStr = efectivoEsperadoNum.toLocaleString('es-CL', { minimumFractionDigits: 0 });
        const diferenciaStr = (report.diferencia >= 0 ? '+' : '') + parseFloat(report.diferencia || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 });

        html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              @page {
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
                width: 56mm !important;
                max-width: 56mm !important;
                margin: 0 !important;
                padding: 2mm 1mm 15mm 1mm !important;
                font-family: 'Courier New', Courier, monospace;
                font-size: 9.5px;
                background-color: #ffffff !important;
                line-height: 1.25;
                letter-spacing: 0.2px;
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
                margin-bottom: 1.2mm;
              }
              .report-title {
                font-size: 12px;
                font-weight: bold;
                margin: 0 0 0.5mm 0;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                word-break: break-word;
              }
              .report-date-time {
                font-size: 9px;
                margin-top: 0.5mm;
              }
              .report-section-title {
                font-size: 10px;
                font-weight: bold;
                border-bottom: 1.2px solid #000000;
                padding: 0.4mm 0;
                margin-top: 2mm;
                margin-bottom: 0.8mm;
                text-transform: uppercase;
              }
              .report-table {
                width: 100%;
                table-layout: fixed;
                border-collapse: collapse;
                font-size: 9.5px;
              }
              .report-table td {
                padding: 0.4mm 0;
                border-bottom: 1px dotted #dddddd;
                word-break: break-word;
                overflow-wrap: break-word;
                font-size: 9.5px;
              }
              .report-table th {
                border-bottom: 1.2px solid #000000;
                padding: 0.4mm 0;
                text-align: left;
                font-size: 9.5px;
                font-weight: bold;
              }
              .report-summary-row {
                display: table;
                padding: 0.4mm 0;
                border-bottom: 1px dotted #dddddd;
                width: 100%;
                font-size: 9.5px;
              }
              .report-summary-row span:first-child {
                display: table-cell;
                text-align: left;
              }
              .report-summary-row span:last-child {
                display: table-cell;
                text-align: right;
              }
              .report-summary-row.total {
                border-top: 1.2px solid #000000;
                border-bottom: 1.2px solid #000000;
                padding: 0.8mm 0;
                font-size: 10.5px;
                margin-top: 0.5mm;
                font-weight: bold;
              }
              .cierre-status {
                padding: 0.8mm;
                border: 1px dashed #000000;
                margin-top: 1.2mm;
                text-align: center;
                font-size: 9.5px;
                font-weight: bold;
                word-break: break-word;
              }
            </style>
          </head>
          <body>
            <div class="report-header">
              <h2 class="report-title">REPORTE FINANCIERO</h2>
              <div style="font-size: 10px;">Calibre 25</div>
              <div class="report-date-time">
                ${(report.is_intervalo || (report.fecha_inicio && report.fecha_fin && report.fecha_inicio !== report.fecha_fin) || String(report.fecha).includes('al')) ? 'Período' : 'Fecha Cierre'}: ${fechaStr}<br/>
                ${report.turno_nombre ? `Turno: ${report.turno_nombre}<br/>` : ''}
                Impreso: ${impresoFecha} ${impresoHora}
              </div>
            </div>

            <div class="report-section-title">Resumen Financiero</div>
            <div class="report-summary-row">
              <span>Efectivo Ventas:</span>
              <span>$${totalEfectivoStr}</span>
            </div>
            ${totalGastosNum > 0 ? `
              <div class="report-summary-row" style="color: #dc2626 !important;">
                <span>Gastos Efectivo (-):</span>
                <span>-$${totalGastosStr}</span>
              </div>
            ` : ''}
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

            ${(report.gastos && report.gastos.length > 0) ? `
              <div class="report-section-title">💸 GASTOS EN EFECTIVO (${report.gastos.length})</div>
              <div class="report-summary-row" style="color: #dc2626 !important;">
                <span>Total Gastos:</span>
                <span>-$${totalGastosStr}</span>
              </div>
              ${report.gastos.map(g => `
                <div style="font-size: 9.5px; border-bottom: 1px dotted #cccccc; padding: 0.5mm 0; display: flex; justify-content: space-between;">
                  <span>• ${g.descripcion} (${g.registrado_por || 'Cajero'})</span>
                  <span>-$${(parseFloat(g.monto) || 0).toLocaleString('es-CL')}</span>
                </div>
              `).join('')}
            ` : ''}

            ${(report.comandas_eliminadas && report.comandas_eliminadas.length > 0) ? `
              <div class="report-section-title" style="color: #dc2626 !important;">⚠️ COMANDAS ELIMINADAS (${report.comandas_eliminadas.length})</div>
              <div class="report-summary-row" style="color: #dc2626 !important;">
                <span>Total Anulado:</span>
                <span>$${(report.monto_total_eliminado || 0).toLocaleString('es-CL', { minimumFractionDigits: 0 })}</span>
              </div>
              ${report.comandas_eliminadas.map(c => `
                <div style="font-size: 9.5px; border-bottom: 1px dotted #cccccc; padding: 0.5mm 0;">
                  #${c.id} - ${c.cliente_nombre || 'Sin Nombre'} ($${(c.total || 0).toLocaleString('es-CL')})<br/>
                  <span style="font-size: 8.5px; opacity: 0.8;">Anuló: ${c.eliminado_por} (${c.hora_eliminado || ''})</span>
                </div>
              `).join('')}
            ` : ''}

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
              <div class="report-section-title">Arqueo de Caja</div>
              <div class="report-summary-row">
                <span>Fondo Inicial:</span>
                <span>$${fondoAperturaStr}</span>
              </div>
              <div class="report-summary-row">
                <span>Efectivo Est. en Caja:</span>
                <span>$${efectivoEsperadoStr}</span>
              </div>
              <div class="cierre-status" style="border-color: #f59e0b; color: #d97706;">
                TURNO EN CURSO (SIN ARQUEO FINAL)
              </div>
            `}

            <div class="report-section-title">Productos y Envases Vendidos</div>
            <table class="report-table">
              <thead>
                <tr>
                  <th style="width: 16%;">Cant</th>
                  <th style="width: 52%;">Detalle</th>
                  <th style="width: 32%; text-align: right;">Total</th>
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

            <div class="text-center" style="font-size: 9.5px; margin-top: 4mm; border-top: 1px dashed #000000; padding-top: 1.5mm;">
              <p style="margin: 2px 0;">Calibre 25 - Gestión de Caja</p>
            </div>
            <div style="height: 12mm;"></div>
          </body>
          </html>
        `;
      }

      const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);

      const printWin = getReusablePrintWin();

      printWin.webContents.once('did-finish-load', async () => {
        try {
          const targetPrinterName = await resolvePrinterName(printWin);
          console.log(`[Electron Print] Usando impresora para reporte: ${targetPrinterName || 'Predeterminada del Sistema'}`);
          await printHtmlWindow(printWin, targetPrinterName);
        } catch (err) {
          console.error('[Electron Print] Error al imprimir reporte:', err);
        } finally {
          resolve();
        }
      });

      printWin.loadURL(dataUrl);

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
});

ipcMain.on('open-cash-drawer', async (event) => {
  console.log('[Electron Print] Petición de apertura de cajón monedero recibida.');
  try {
    const targetPrinterName = sewooPrinterName || 'SEWOO_LKTSERIES';

    // 1. Enviar pulso directo RAW INMEDIATAMENTE (apertura instantánea en ~10-20ms)
    sendRawPulseToPrinter(targetPrinterName).catch(e => console.error('[Electron Print] Error en RAW pulse:', e));

    // 2. Comprobante mini para impresoras térmicas cuyo cajón responde al driver
    const printWin = getReusablePrintWin();

    const dObj = new Date();
    const fechaStr = dObj.toLocaleDateString('es-CL', { timeZone: 'America/Santiago' });
    const horaStr = dObj.toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit' });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { margin: 0; }
    body {
      font-family: 'Courier New', Courier, monospace;
      width: 58mm;
      margin: 0 auto;
      padding: 2mm;
      box-sizing: border-box;
      font-size: 11px;
      color: #000;
      text-align: center;
    }
    .divider { border-bottom: 1px dashed #000; margin: 2px 0; }
  </style>
</head>
<body>
  <div style="font-weight: bold; font-size: 12px;">CALIBRE 25</div>
  <div>APERTURA DE CAJA</div>
  <div class="divider"></div>
  <div>${fechaStr} ${horaStr}</div>
</body>
</html>`;

    const dataUrl = 'data:text/html;charset=utf-8,' + encodeURIComponent(html);

    printWin.webContents.once('did-finish-load', async () => {
      try {
        await printHtmlWindow(printWin, targetPrinterName, { openDrawer: true });
      } catch (err) {
        console.error('[Electron Print] Error en proceso de apertura de caja:', err);
      }
    });

    printWin.loadURL(dataUrl);
  } catch (err) {
    console.error('[Electron Print] Fallo general al abrir cajón:', err);
  }
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

// Abrir carpeta física de la base de datos SQLite en el explorador de archivos
ipcMain.handle('open-db-folder', async () => {
  try {
    const isDev = !app.isPackaged;
    const dbDir = isDev
      ? path.join(__dirname, '../backend')
      : (process.env.USER_DATA_PATH || path.join(path.dirname(app.getPath('exe')), 'data'));
    const dbFile = path.join(dbDir, 'database.sqlite');
    if (fs.existsSync(dbFile)) {
      shell.showItemInFolder(dbFile);
    } else {
      shell.openPath(dbDir);
    }
    return { success: true, path: dbFile };
  } catch (err) {
    console.error('[Electron] Error al abrir carpeta de base de datos:', err);
    return { success: false, error: err.message };
  }
});

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// Manejador IPC en memoria para llamadas API (comunicación directa con Named Pipe / Socket sin puertos TCP)
ipcMain.handle('api-ipc-call', async (event, reqData) => {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(reqData.url, 'http://localhost');
      const reqPath = urlObj.pathname + urlObj.search;

      const headers = Object.assign({}, reqData.headers || {});
      let bodyData = reqData.body;
      if (bodyData && typeof bodyData === 'object' && !(bodyData instanceof Buffer)) {
        bodyData = JSON.stringify(bodyData);
      }
      if (bodyData) {
        headers['content-length'] = Buffer.byteLength(bodyData);
        if (!headers['content-type'] && !headers['Content-Type']) {
          headers['content-type'] = 'application/json';
        }
      }

      const options = {
        socketPath: PIPE_PATH,
        path: reqPath,
        method: reqData.method || 'GET',
        headers: headers
      };

      const req = http.request(options, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const contentType = String(res.headers['content-type'] || '').toLowerCase();
          const isBinary = (
            contentType.includes('application/octet-stream') ||
            contentType.includes('application/vnd.openxmlformats') ||
            contentType.includes('excel') ||
            contentType.includes('image/')
          );
          resolve({
            status: res.statusCode || 200,
            statusText: res.statusMessage || 'OK',
            headers: res.headers,
            isBinary: isBinary,
            body: isBinary ? buf.toString('base64') : buf.toString('utf8')
          });
        });
      });

      req.on('error', (err) => {
        console.error('[Electron IPC API] Error en llamada a pipe:', err);
        resolve({
          status: 500,
          statusText: 'Internal Error',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ error: err.message })
        });
      });

      if (bodyData) {
        req.write(bodyData);
      }
      req.end();
    } catch (e) {
      console.error('[Electron IPC API] Excepción en api-ipc-call:', e);
      resolve({
        status: 500,
        statusText: 'Internal Error',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: e.message })
      });
    }
  });
});


