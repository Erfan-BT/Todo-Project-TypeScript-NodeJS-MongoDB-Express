import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { UserIdDto, UserQSDto } from "../../validations/auth.validation.js";
import userAdminService from "../../services/admin/user.admin.service.js";

class UserAdminController {
    async getAllUsers (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const qs = req.validated.query as UserQSDto
            const data = await userAdminService.getAllUsers(qs)

            res.status(200).json({
                success : true,
                msg : 'All Users Successfully Found',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async getUser (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId } = req.validated.params as UserIdDto
            const data = await userAdminService.getUser(userId)

            res.status(200).json({
                success : true,
                msg : 'User Successfully Found',
                data
            })
        } catch (error) {
            next(error)
        }
    }
}

export default new UserAdminController()