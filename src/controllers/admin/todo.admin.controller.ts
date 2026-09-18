import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { TodoQSDto } from "../../validations/todo.validation.js";
import todoAdminService from "../../services/admin/todo.admin.service.js";

class TodoAdminController {
    async getAllTodos (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const qs = req.validated.query as TodoQSDto
            const data = await todoAdminService.getAllTodos(qs)

            res.status(200).json({
                success : true,
                msg : 'All Todos Successfully Found',
                data
            })
        } catch (error) {
            next(error)
        }
    }
}

export default new TodoAdminController()