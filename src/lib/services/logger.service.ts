// src/lib/services/logger.service.ts
const logger = {
    info: (message: string, meta?: any) => {
        window.ipcRenderer.send('log', 'info', message, meta);
    },
    warn: (message: string, meta?: any) => {
        window.ipcRenderer.send('log', 'warn', message, meta);
    },
    error: (message: string, meta?: any) => {
        window.ipcRenderer.send('log', 'error', message, meta);
    }
};

export default logger;
