import { Request, Response } from 'express';
import rateLimit, { ipKeyGenerator, Options, RateLimitRequestHandler } from 'express-rate-limit';
import { AuthRequest } from './auth.middleware.js';
import { logger } from '../configs/pino.config.js';

let generalIpLimiter : RateLimitRequestHandler | null = null
let authIpLimiter : RateLimitRequestHandler | null = null
let authUsernameLimiter : RateLimitRequestHandler | null = null
let userIdLimiter : RateLimitRequestHandler | null = null

const createRateLimiter = (
    windowMs: number,
    limit: number,
    message: string,
    keyBy : 'Ip' | 'UserId' | 'Username' = 'Ip'
) : RateLimitRequestHandler => {
    const options: Partial<Options> = {
        windowMs,
        limit,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        keyGenerator: req => { 
            switch (keyBy) { 
                case 'Ip' :
                    return ipKeyGenerator(req.ip ?? 'unknown')

                case 'UserId' : { 
                    const user = (req as AuthRequest).user
                    return user?.userId.toString() ?? 'unknown-user'
                }

                case 'Username' :
                    return req.body.username?.trim().toLowerCase() ?? 'unknown-username'
            }
        },
        handler: (_req: Request, res: Response) => {
            res.status(429).json({
                success : false,
                msg : message,
                data : 'Try Again ' + Math.ceil(windowMs / (1000 * 60)) + 'm Later',
            })
        },
    }

    return rateLimit(options)
}

export const getGeneralIpLimiter = () : RateLimitRequestHandler => {
    if (!generalIpLimiter) {
        generalIpLimiter = createRateLimiter(
            15 * 60 * 1000,
            100,
            'Too Many Requests From This IP, Please Try Again Later'
        )
        logger.info('Rate Limiter Created : General<Ip>')
    }
    return generalIpLimiter
}

export const getAuthIpLimiter = (): RateLimitRequestHandler => {
    if (!authIpLimiter) {
        authIpLimiter = createRateLimiter(
            15 * 60 * 1000,
            20,
            'Too Many Authentication Requests From This IP, Please Try Again Later'
        )
        logger.info('Rate Limiter Created : Auth<Ip>')
    }
    return authIpLimiter
}

export const getAuthUsernameLimiter = (): RateLimitRequestHandler => {
    if (!authUsernameLimiter) {
        authUsernameLimiter = createRateLimiter(
            15 * 60 * 1000,
            5,
            'Too Many Authentication Requests From This Username, Please Try Again Later',
            'Username'
        )
        logger.info('Rate Limiter Created : Auth<Username>')
    }
    return authUsernameLimiter
}

export const getUserIdLimiter = (): RateLimitRequestHandler => {
    if (!userIdLimiter) {
        userIdLimiter = createRateLimiter(
            15 * 60 * 1000,
            60,
            'Too Many Requests From This UserId, Please Try Again Later',
            'UserId'
        )
        logger.info('Rate Limiter Created : User<Id>')
    }
    return userIdLimiter
}

export const initializeRateLimiters = () => {
    const generalIp = getGeneralIpLimiter()
    const authIp = getAuthIpLimiter()
    const authUsername = getAuthUsernameLimiter()
    const userId = getUserIdLimiter()
}