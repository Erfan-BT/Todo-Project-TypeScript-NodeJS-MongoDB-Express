import { NextFunction, Request, Response } from "express";
import { ChangePasswordDto, LoginDto, RefreshTokenDto, RegisterDto } from "../validations/auth.validation.js";
import authService from "../services/auth.service.js";
import { AuthRequest } from "../middleware/auth.middleware.js";

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
                msg : 'New Tokens Created',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async changePassword (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const changePasswordData = req.validated.body as ChangePasswordDto
            const { userId } = req.user!
            const data = await authService.changePassword(userId, changePasswordData)

            res.status(200).json({
                success : true,
                msg : 'Password Changed Successfully',
                data : null
            })
        } catch (error) {
            next(error)
        }
    }

    async logout (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId, jti} = req.user!
            await authService.logout(userId, jti)

            res.status(200).json({
                success : true,
                msg : 'Logout Successful',
                data : null
            })
        } catch (error) {
            next(error)
        }
    } 

    async logoutAll (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId } = req.user!
            await authService.logoutAll(userId)

            res.status(200).json({
                success : true,
                msg : 'Logout From All Devices Successful',
                data : null
            })
        } catch (error) {
            next(error)
        }
    } 

    async getUserAccount (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId } = req.user!
            const data = await authService.getUserAccount(userId)

            res.status(200).json({
                success : true,
                msg : 'User Account Successfully Found',
                data
            })
        } catch (error) {
            next(error)
        }
    } 
}

export default new AuthController()