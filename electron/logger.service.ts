// electron/logger.service.ts
import winston from 'winston';
import 'winston-daily-rotate-file';
import { ipcMain } from 'electron';

const transport = new winston.transports.DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(),
        transport
    ]
});

ipcMain.on('log', (event, level, message, meta) => {
    logger.log(level, message, meta);
});

export default logger;
