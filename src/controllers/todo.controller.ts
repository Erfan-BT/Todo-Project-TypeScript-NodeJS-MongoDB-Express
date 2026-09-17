import { NextFunction, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { ChangeTodoDto, CreateTodoDto, TodoIdDto, TodoQSDto } from "../validations/todo.validation.js";
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

    async getUserTodo (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId } = req.user!
            const { todoId } = req.validated.params as TodoIdDto
            const data = await todoService.getUserTodo(todoId, userId)

            res.status(200).json({
                success : true,
                msg : 'User Todo Successfully Found',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async createTodo (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId } = req.user!
            const todoData = req.validated.body as CreateTodoDto
            const data = await todoService.createTodo(userId, todoData)

            res.status(200).json({
                success : true,
                msg : 'Todo Successfully Created',
                data
            })
        } catch (error) {
            next(error)
        }
    }

    async changeTodo (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const { userId } = req.user!
            const { todoId } = req.validated.params as TodoIdDto
            const todoData = req.validated.body as ChangeTodoDto
            const data = await todoService.changeTodo(userId, todoId, todoData)

            res.status(200).json({
                success : true,
                msg : 'Todo Successfully Changed',
                data
            })
        } catch (error) {
            next(error)
        }
    }
}

export default new TodoController()