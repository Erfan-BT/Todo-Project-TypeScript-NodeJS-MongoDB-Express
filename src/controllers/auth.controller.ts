import { NextFunction, Request, Response } from "express";
import { LoginDto, RefreshTokenDto, RegisterDto } from "../validations/auth.validation.js";
import authService from "../services/auth.service.js";

class AuthController {
    async register (req : Request, res : Response, next : NextFunction) {
        try {
            const registerData = req.validated.body as RegisterDto
            const userAgent = req.headers['user-agent'] ?? '';
            const data = await authService.register(registerData, userAgent)

            res.status(201).json({
                success : true,
                msg : 'Registration Successful',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async login (req : Request, res : Response, next : NextFunction) {
        try {
            const loginData = req.validated.body as LoginDto
            const userAgent = req.headers['user-agent'] ?? '';
            const data = await authService.login(loginData, userAgent)

            res.status(200).json({
                success : true,
                msg : 'Login Successful',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async refresh (req : Request, res : Response, next : NextFunction) {
        try {
            const { refreshToken } = req.validated.body as RefreshTokenDto
            const userAgent = req.headers['user-agent'] ?? '';
            const data = await authService.refresh(refreshToken, userAgent)

            res.status(200).json({
                success : true,
                msg : 'Login Successful',
                data
            })
        } catch (error) {
            next(error)
        }
    }
}

export default new AuthController()