import { Request, Response, NextFunction } from 'express'
import { AppError, InternalServerError } from '../utils/appError.js' 

export function errorHandler(
    err : any,
    req : Request,
    res : Response,
    _next : NextFunction
) {
    if (!(err instanceof AppError)) {
        req.logger.error({ error : String(err) }, 'Unhandled Error')
        err = new InternalServerError(undefined, undefined, false)
    }

    req.logger.error({errorCode : err.statusCode, errorMsg : err.message, errorContext : err.context, err}, "ERROR MIDDLEWARE")

    res.status(err.statusCode).json({
        success : false,
        msg : err.message,
        data : err.context ?? null
    })
}