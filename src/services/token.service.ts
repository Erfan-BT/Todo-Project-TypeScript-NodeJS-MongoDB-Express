import jwt from 'jsonwebtoken'
import argon2 from 'argon2'
import { env } from '../configs/env.config.js'
import { randomUUID } from 'crypto'
import sessionRepository from '../repository/session.repository.js';
import { Types } from 'mongoose';
import { BadRequestError } from '../utils/appError.js';

class TokenService {
    generateAccessToken (userId : Types.ObjectId)
    : string {
        return jwt.sign({userId}, env.JWT_SECRET, {
            expiresIn : env.JWT_EXPIRES_IN as any
        })
    }

    generateRefreshToken (userId : Types.ObjectId)
    : {
        refreshToken : string;
        jti : string;
    } {
        const jti = randomUUID() as string
        const refreshToken = jwt.sign({
            userId,
            jti,
        }, env.JWT_REFRESH_SECRET, {
            expiresIn : env.JWT_REFRESH_EXPIRES_IN as any
        })

        return {
            refreshToken,
            jti
        }
    }

    async generateTokens(userId : Types.ObjectId, device : string)
    : Promise<{
        accessToken : string;
        refreshToken : string;
    }> {
        const accessToken = this.generateAccessToken(userId);
        const {refreshToken , jti} = this.generateRefreshToken(userId)
        
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
        return jwt.verify(token, env.JWT_REFRESH_SECRET) as {
            userId : Types.ObjectId,
            jti : string
        }
    }

    async revokeRefreshTokenSession (userId : Types.ObjectId, jti : string)
    : Promise<void> {
        if (!await sessionRepository.deleteSessions(userId, jti))
            throw new BadRequestError
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