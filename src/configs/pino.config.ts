import "dotenv/config"
import pino from "pino";
import path from "path";
import fs from "fs";
import { env } from "./env.config.js";

const isDevelopment = env.NODE_ENV === 'development';
const isProduction = env.NODE_ENV === 'production';

const logDir = path.join(process.cwd(), '../Logs');
if (isProduction && !fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

export const logger = pino({
    level : isDevelopment ? 'debug' : 'info',
    
    base : {
        service : 'todo-project',
        env : env.NODE_ENV || 'dev',
    },
    
    redact : {
        paths : [
            'password',
            'token',
            'cookie',
            '*.password',
            '*.token',
            'authorization',
            'headers.authorization',
            'req.headers.authorization'
        ],
        censor : '[REDACTED]',
    },
    serializers : {
        err : pino.stdSerializers.err,
        req : pino.stdSerializers.req,
        res : pino.stdSerializers.res
    },
    
    transport : isDevelopment ?
        {
            target: 'pino-pretty',
            options: {
                ignore: 'pid,hostname',
                colorize: true,
                translateTime: 'SYS:standard',
                levelFirst: true,
                messageFormat: '{msg}'
            }
        } :
        {
            targets: [
                {
                    level: 'info',
                    target: 'pino/file',
                    options: {
                        destination: path.join(logDir, 'app.log'),
                        mkdir: true
                    }
                },
                {
                    level: 'error',
                    target: 'pino/file',
                    options: {
                        destination: path.join(logDir, 'error.log'),
                        mkdir: true
                    }
                }
            ]
        }
})