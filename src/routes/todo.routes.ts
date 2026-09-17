import express from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validation.middleware.js'
import { changeTodoSchema, changeTodoStatusSchema, createTodoSchema, todoIdSchema, todoQS } from '../validations/todo.validation.js'
import todoController from '../controllers/todo.controller.js'

const router = express.Router()

router.get('/', authMiddleware, validate({ query : todoQS }), todoController.getUserTodos)
router.get('/:todoId', authMiddleware, validate({ params : todoIdSchema }), todoController.getUserTodo)
router.post('/', authMiddleware, validate({ body : createTodoSchema }), todoController.createTodo)
router.patch('/:todoId', authMiddleware, validate({ body : changeTodoSchema, params : todoIdSchema }), todoController.changeTodo)
router.patch('/:todoId/status', authMiddleware, validate({ body : changeTodoStatusSchema, params : todoIdSchema }), todoController.changeTodoStatus)
router.delete('/:todoId', authMiddleware, validate({ params : todoIdSchema }), todoController.deleteTodo)

export default router