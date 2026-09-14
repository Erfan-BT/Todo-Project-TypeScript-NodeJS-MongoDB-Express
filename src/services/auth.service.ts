import argon2 from "argon2";
import authRepository from "../repository/auth.repository.js";
import { ConflictError } from "../utils/appError.js";
import { RegisterDto } from "../validations/auth.validation.js";
import tokenService from "./token.service.js";
import {  Types } from "mongoose";

class AuthService {
    async register (registerData : RegisterDto, device : string)
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
        registerData.password = hashedPassword

        // Create User
        const user = await authRepository.createUser(registerData)

        // Create Tokens
        const tokens = await tokenService.generateTokens(user._id, device)

        return {
            userId : user._id,
            tokens
        }
    }
}

export default new AuthService()