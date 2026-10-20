const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printTicket: (ticketData) => ipcRenderer.send('print-ticket', ticketData),
  printReport: (reportData) => ipcRenderer.send('print-report', reportData),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  getSelectedPrinter: () => ipcRenderer.invoke('get-selected-printer'),
  setSelectedPrinter: (printerName) => ipcRenderer.invoke('set-selected-printer', printerName),
  setZoomFactor: (factor) => {
    try {
      webFrame.setZoomFactor(factor);
    } catch (e) {
      console.error('Error setting zoom factor:', e);
    }
  },
  openCashDrawer: () => ipcRenderer.send('open-cash-drawer'),
  openDbFolder: () => ipcRenderer.invoke('open-db-folder'),
  invokeApi: (reqData) => ipcRenderer.invoke('api-ipc-call', reqData)
});

// Enrutar todas las llamadas de la API internamente por IPC en memoria (CERO puertos TCP)
try {
  webFrame.executeJavaScript(`
    (() => {
      const _origFetch = window.fetch;
      window.fetch = async function(resource, init = {}) {
        const rawUrl = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
        if (rawUrl && (rawUrl.includes(':5000/api/') || rawUrl.startsWith('/api/'))) {
          try {
            const method = (init && init.method) || (resource && resource.method) || 'GET';
            let headers = (init && init.headers) || (resource && resource.headers) || {};
            if (headers instanceof Headers) {
              const plain = {};
              headers.forEach((v, k) => { plain[k] = v; });
              headers = plain;
            }
            let body = (init && init.body);
            if (body && typeof body !== 'string') {
              try { body = JSON.stringify(body); } catch(e) {}
            }

            const res = await window.electronAPI.invokeApi({ url: rawUrl, method, headers, body });
            
            let responseBody;
            if (res.isBinary && typeof res.body === 'string') {
              const binaryStr = atob(res.body);
              const bytes = new Uint8Array(binaryStr.length);
              for (let i = 0; i < binaryStr.length; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              responseBody = bytes.buffer;
            } else {
              responseBody = res.body;
            }

            return new Response(responseBody, {
              status: res.status || 200,
              statusText: res.statusText || 'OK',
              headers: res.headers || {}
            });
          } catch (err) {
            console.error('[In-Memory IPC Fetch Error]', err);
            return new Response(JSON.stringify({ error: err.message }), {
              status: 500,
              headers: { 'content-type': 'application/json' }
            });
          }
        }
        return _origFetch.apply(this, arguments);
      };
    })();
  `);
} catch (e) {
  console.error('[preload] Error instalando IPC fetch hook:', e);
}


