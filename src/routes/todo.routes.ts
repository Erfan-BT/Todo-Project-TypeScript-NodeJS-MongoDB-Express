import express from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validate } from '../middleware/validation.middleware.js'
import { todoQS } from '../validations/todo.validation.js'
import todoController from '../controllers/todo.controller.js'

const router = express.Router()

router.get('/', authMiddleware, validate({ query : todoQS }), todoController.getUserTodos)

export default router