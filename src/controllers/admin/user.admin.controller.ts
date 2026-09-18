import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { AdminChangeUserPasswordDto, ChangeUserDto, UserIdDto, UserQSDto } from "../../validations/auth.validation.js";
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

    async changeUser (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId } = req.validated.params as UserIdDto
            const userData = req.validated.body as ChangeUserDto
            const data = await userAdminService.changeUser(userId, userData)

            res.status(200).json({
                success : true,
                msg : 'User Successfully Changed',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async changeUserPassword (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId } = req.validated.params as UserIdDto
            const { newPassword } = req.validated.body as AdminChangeUserPasswordDto
            await userAdminService.changeUserPassword(userId, newPassword)

            res.status(200).json({
                success : true,
                msg : 'User Password Successfully Changed',
                data : null
            })
        } catch (error) {
            next(error)
        }
    }

    async changeUserStatus (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId } = req.validated.params as UserIdDto
            const data = await userAdminService.changeUserStatus(userId)

            res.status(200).json({
                success : true,
                msg : 'User Status Successfully Changed',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async deleteUser (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId } = req.validated.params as UserIdDto
            await userAdminService.deleteUser(userId)

            res.status(200).json({
                success : true,
                msg : 'User Successfully Deleted',
                data : null
            })
        } catch (error) {
            next(error)
        }
    }
}

export default new UserAdminController()