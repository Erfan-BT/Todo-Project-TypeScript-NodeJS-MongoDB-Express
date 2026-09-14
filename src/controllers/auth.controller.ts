import { NextFunction, Request, Response } from "express";
import { RegisterDto } from "../validations/auth.validation.js";
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
}

export default new AuthController()