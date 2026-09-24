import jwt from 'jsonwebtoken'
import argon2 from 'argon2'
import { env } from '../configs/env.config.js'
import { randomUUID } from 'crypto'
import sessionRepository from '../repository/session.repository.js';
import { Types } from 'mongoose';
import { BadRequestError, UnauthorizedError } from '../utils/appError.js';

class TokenService {
    generateAccessToken (userId : Types.ObjectId, jti : string)
    : string {
        return jwt.sign({
            userId,
            jti
        }, env.JWT_SECRET, {
            expiresIn : env.JWT_EXPIRES_IN as any
        })
    }

    generateRefreshToken (userId : Types.ObjectId, jti : string)
    : string {
        const refreshToken = jwt.sign({
            userId,
            jti,
        }, env.JWT_REFRESH_SECRET, {
            expiresIn : env.JWT_REFRESH_EXPIRES_IN as any
        })

        return refreshToken

    }

    async generateTokens(userId : Types.ObjectId, device : string)
    : Promise<{
        accessToken : string;
        refreshToken : string;
    }> {
        const jti = randomUUID() as string
        const accessToken = this.generateAccessToken(userId, jti)
        const refreshToken = this.generateRefreshToken(userId, jti)
        
        const hashedRefreshToken = await argon2.hash(refreshToken)

        const session = await sessionRepository.createSession(userId, jti, hashedRefreshToken, env.JWT_REFRESH_EXPIRES_IN, device)

        return {
            accessToken,
            refreshToken
        }
    }

    verifyRefreshToken (token : string)
    : {
        userId : Types.ObjectId;
        jti : string;
    } {
        try {
            return jwt.verify(token, env.JWT_REFRESH_SECRET) as {
                userId : Types.ObjectId,
                jti : string
            }
        } catch (error) {
            throw new BadRequestError('Invalid Refresh Token')
        }
    }

    verifyAccessToken (token : string)
    : {
        userId : Types.ObjectId;
        jti : string;
    } {
        try {
            return jwt.verify(token, env.JWT_SECRET) as {
                userId : Types.ObjectId,
                jti : string
            }
        } catch (error) {
            throw new UnauthorizedError('Invalid Access Token')
        }
    }

    async revokeRefreshTokenSession (userId : Types.ObjectId, jti : string)
    : Promise<void> {
        if (!await sessionRepository.deleteSession(userId, jti))
            throw new BadRequestError('Refresh Token Not Revoked')
    }

    async refreshTokens (userId : Types.ObjectId, device : string, jti : string)
    : Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        // Delete Session
        await this.revokeRefreshTokenSession(userId, jti)

        // Generate Tokens
        return await this.generateTokens(userId, device)
    }
}

export default new TokenService()