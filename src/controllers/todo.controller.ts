import { NextFunction, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { TodoQSDto } from "../validations/todo.validation.js";
import todoService from "../services/todo.service.js";

class TodoController {
    async getUserTodos (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId } = req.user!
            const qs = req.validated.query as TodoQSDto
            const data = await todoService.getUserTodos(qs, userId)

            res.status(200).json({
                success : true,
                msg : 'All User Todos Successfully Found',
                data
            })
        } catch (error) {
            next(error)
        }
    }
}

export default new TodoController()