const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printTicket: (ticketData) => ipcRenderer.send('print-ticket', ticketData),
  printReport: (reportData) => ipcRenderer.send('print-report', reportData),
  getPrinters: () => ipcRenderer.invoke('get-printers'),
  getSelectedPrinter: () => ipcRenderer.invoke('get-selected-printer'),
  setSelectedPrinter: (printerName) => ipcRenderer.invoke('set-selected-printer', printerName)
});
