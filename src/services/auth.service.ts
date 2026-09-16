import argon2 from "argon2";
import authRepository from "../repository/auth.repository.js";
import { BadRequestError, ConflictError, ForbiddenError } from "../utils/appError.js";
import { LoginDto, RegisterDto } from "../validations/auth.validation.js";
import tokenService from "./token.service.js";
import {  Types } from "mongoose";
import sessionRepository from "../repository/session.repository.js";
import { UAParser } from "ua-parser-js";

class AuthService {
    async register (registerData : RegisterDto, userAgent : string)
    : Promise<{
        userId: Types.ObjectId;
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }> {
        // Check Username
        const existsUser = await authRepository.getUserByUsername(registerData.username)
        if (existsUser)
            throw new ConflictError('This Username Already Exists')

        // Hash Password
        const hashedPassword = await argon2.hash(registerData.password)
        const userData = {
            fullname : registerData.fullname,
            username : registerData.username,
            password : hashedPassword
        }

        // Create User
        const user = await authRepository.createUser(userData)

        // Create Tokens
        const deviceInfo = new UAParser(userAgent).getDevice()
        const device = [
            deviceInfo.vendor,
            deviceInfo.model,
        ].filter(Boolean).join(' ') || 'unknown'

        const tokens = await tokenService.generateTokens(user._id, device)

        return {
            userId : user._id,
            tokens
        }
    }

    async login (loginData : LoginDto, userAgent : string)
    : Promise<{
        userId: Types.ObjectId;
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }> {
        // Check Username
        const user = await authRepository.getUserByUsername(loginData.username)
        if (!user)
            throw new BadRequestError('Username Or Password Is Incorrect')

        // Check User Activation
        if (!user.active)
            throw new ForbiddenError('This Account Has Been Deactivated')

        // Check Password
        const checkPassword = await argon2.verify(user.password, loginData.password)
        if (!checkPassword)
            throw new BadRequestError('Username Or Password Is Incorrect')

        // Delete User Session(s)
        const deviceInfo = new UAParser(userAgent).getDevice()
        const device = [
            deviceInfo.vendor,
            deviceInfo.model,
        ].filter(Boolean).join(' ') || 'unknown'

        await sessionRepository.deleteSessions(user._id, device)

        // Create Tokens
        const tokens = await tokenService.generateTokens(user._id, device)

        return {
            userId : user._id,
            tokens
        }
    }

    async refresh (refreshToken : string, userAgent : string)
    : Promise<{
        userId: Types.ObjectId;
        tokens: {
            accessToken: string;
            refreshToken: string;
        };
    }> {
        // Decode Refresh Token
        const decode = tokenService.verifyRefreshToken(refreshToken)

        // Get Session
        const deviceInfo = new UAParser(userAgent).getDevice()
        const device = [
            deviceInfo.vendor,
            deviceInfo.model,
        ].filter(Boolean).join(' ') || 'unknown'

        const session = await sessionRepository.getSession(decode.userId, decode.jti)
        if (!session)
            throw new BadRequestError()

        // Check Hashed Token
        const verifyResult = await argon2.verify(session.refreshTokenHash, refreshToken)
        if (!verifyResult)
            throw new BadRequestError()

        // Token Rotation
        const tokens = await tokenService.refreshTokens(decode.userId, device, decode.jti)

        return {
            userId : decode.userId,
            tokens
        }
    }

    async logout (userId : Types.ObjectId, jti : string)
    : Promise<void> {
        // Delete Session
        await tokenService.revokeRefreshTokenSession(userId, jti)
    }

    async logoutAll (userId : Types.ObjectId)
    : Promise<void> {
        // Delete Session(s)
        await sessionRepository.deleteSessions(userId)
    }
}

export default new AuthService()