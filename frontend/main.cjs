const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
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
