import express from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validation.middleware.js'
import { changeTodoSchema, changeTodoStatusSchema, createTodoSchema, todoIdSchema, todoQS } from '../validations/todo.validation.js'
import todoController from '../controllers/todo.controller.js'
import { getUserIdLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

router.get('/', authMiddleware, validate({ query : todoQS }), getUserIdLimiter(), todoController.getUserTodos)
router.get('/:todoId', authMiddleware, validate({ params : todoIdSchema }), getUserIdLimiter(), todoController.getUserTodo)
router.post('/', authMiddleware, validate({ body : createTodoSchema }), getUserIdLimiter(), todoController.createTodo)
router.post('/:todoId/restore', authMiddleware, validate({ params : todoIdSchema }), getUserIdLimiter(), todoController.restoreTodo)
router.patch('/:todoId/status', authMiddleware, validate({ body : changeTodoStatusSchema, params : todoIdSchema }), getUserIdLimiter(), todoController.changeTodoStatus)
router.patch('/:todoId', authMiddleware, validate({ body : changeTodoSchema, params : todoIdSchema }), getUserIdLimiter(), todoController.changeTodo)
router.delete('/clear', authMiddleware, getUserIdLimiter(), todoController.clearUserTodos)
router.delete('/:todoId', authMiddleware, validate({ params : todoIdSchema }), getUserIdLimiter(), todoController.deleteTodo)

export default router