import crypto from "node:crypto";
import { NextFunction, Request, Response } from "express";
import { logger } from "../configs/pino.config.js";

export function loggerMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    req.requestId = crypto.randomUUID();

    req.logger = logger.child({
        requestId: req.requestId,
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
    })

    next();
}