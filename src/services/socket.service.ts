import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import winston from 'winston';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'socket-service' },
    transports: [
        new winston.transports.Console(),
    ],
});

export class SocketService {
    private static instance: SocketService;
    private io: SocketIOServer | null = null;

    private constructor() { }

    public static getInstance(): SocketService {
        if (!SocketService.instance) {
            SocketService.instance = new SocketService();
        }
        return SocketService.instance;
    }

    public initialize(httpServer: HttpServer, corsOptions: any): void {
        this.io = new SocketIOServer(httpServer, {
            cors: corsOptions
        });

        this.io.on('connection', (socket) => {
            logger.info(`Client connected: ${socket.id}`);

            socket.on('disconnect', () => {
                logger.info(`Client disconnected: ${socket.id}`);
            });
        });

        logger.info('Socket.io initialized');
    }

    public emit(event: string, data: any): void {
        if (this.io) {
            this.io.emit(event, data);
            logger.info(`Emitted event: ${event}`, { data });
        } else {
            logger.warn('Socket.io not initialized, cannot emit event');
        }
    }
}
