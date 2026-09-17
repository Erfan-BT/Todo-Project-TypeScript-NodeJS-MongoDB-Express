import { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/appError.js";
import tokenService from "../services/token.service.js";
import authRepository from "../repository/auth.repository.js";
import sessionRepository from "../repository/session.repository.js";
import { Types } from "mongoose";

export interface AuthRequest extends Request {
    user ?: {
        userId : Types.ObjectId;
        username : string;
        role : 'Admin' | 'User';
        jti : string;
    }
}


export const authMiddleware = async (req : AuthRequest, res : Response, next : NextFunction) => {
    try {
        // Get Authorization Header
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer '))
            throw new UnauthorizedError('The Token Is Invalid Or Expired')

        // Get Token And Payload
        const accessToken : string = authHeader.split(' ')[1]!
        const { userId, jti } = tokenService.verifyAccessToken(accessToken)

        // Get User
        const user = await authRepository.getUserById(userId)
        if (!user)
            throw new UnauthorizedError('The Token Is Invalid Or Expired')

        if (!user.active)
            throw new ForbiddenError('This Account Has Been Deactivated')

        // Get Session
        const session = await sessionRepository.getSession(userId, jti)
        if (!session)
            throw new UnauthorizedError('The Token Is Invalid Or Expired')

        // Add Data To Request
        req.user = {
            userId,
            jti,
            username : user.username,
            role : user.role
        }

        next()
    } catch (error) {
        if (error instanceof UnauthorizedError || error instanceof ForbiddenError)
            return next(error)
        
        req.logger.error({ error }, 'Auth Middleware Error')
        next(new UnauthorizedError())
    }
}

export const adminMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const user = req.user
        if (!user)
            throw new UnauthorizedError('Login First')

        if (user.role !== "Admin")
            throw new ForbiddenError('Not Access')

        next()
    } catch (error) {
        next(error)
    }
}