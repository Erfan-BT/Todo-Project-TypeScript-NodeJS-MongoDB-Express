import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { ChangeTodoDto, ChangeTodoStatusDto, TodoIdDto, TodoQSDto } from "../../validations/todo.validation.js";
import todoAdminService from "../../services/admin/todo.admin.service.js";
import { ReasonDto } from "../../validations/audit.validation.js";

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

    async getTodo (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { todoId } = req.validated.params as TodoIdDto
            const data = await todoAdminService.getTodo(todoId)

            res.status(200).json({
                success : true,
                msg : 'Todo Successfully Found',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async restoreTodo (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { todoId } = req.validated.params as TodoIdDto
            const { reason } = req.validated.body as ReasonDto
            const adminId = req.user!.userId
            const data = await todoAdminService.restoreTodo(todoId, adminId, reason, req.ip ?? '-0-')

            res.status(200).json({
                success : true,
                msg : 'Todo Successfully Restored',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async changeTodo (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { todoId } = req.validated.params as TodoIdDto
            const todoData = req.validated.body as ChangeTodoDto
            const adminId = req.user!.userId
            const data = await todoAdminService.changeTodo(todoId, todoData, adminId, req.ip ?? '-0-')

            res.status(200).json({
                success : true,
                msg : 'Todo Successfully Changed',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async changeTodoStatus (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { todoId } = req.validated.params as TodoIdDto
            const { status } = req.validated.body as ChangeTodoStatusDto
            const adminId = req.user!.userId
            const data = await todoAdminService.changeTodoStatus(todoId, status, adminId, req.ip ?? '-0-')

            res.status(200).json({
                success : true,
                msg : 'Todo Status Successfully Changed',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async deleteSoftTodo (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { todoId } = req.validated.params as TodoIdDto
            const { reason } = req.validated.body as ReasonDto
            const adminId = req.user!.userId
            await todoAdminService.deleteSoftTodo(todoId, adminId, reason, req.ip ?? '-0-')

            res.status(200).json({
                success : true,
                msg : 'Todo Successfully Deleted (Soft)',
                data : null
            })
        } catch (error) {
            next(error)
        }
    }

    async deleteHardTodo (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { todoId } = req.validated.params as TodoIdDto
            const { reason } = req.validated.body as ReasonDto
            const adminId = req.user!.userId
            await todoAdminService.deleteHardTodo(todoId, adminId, reason, req.ip ?? '-0-')

            res.status(200).json({
                success : true,
                msg : 'Todo Successfully Deleted (Hard)',
                data : null
            })
        } catch (error) {
            next(error)
        }
    }
}

export default new TodoAdminController()