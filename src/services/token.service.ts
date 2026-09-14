import jwt from 'jsonwebtoken'
import argon2 from 'argon2'
import { env } from '../configs/env.config.js'
import { randomUUID } from 'crypto'
import sessionRepository from '../repository/session.repository.js';
import { Types } from 'mongoose';

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
}

export default new TokenService()