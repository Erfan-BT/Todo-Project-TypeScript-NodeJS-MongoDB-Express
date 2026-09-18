import express from 'express'
import { validate } from '../../middleware/validation.middleware.js'
import { todoIdSchema, todoQS } from '../../validations/todo.validation.js'
import todoAdminController from '../../controllers/admin/todo.admin.controller.js'

const router = express.Router()

router.get('/', validate({ query : todoQS }), todoAdminController.getAllTodos)
router.get('/:todoId', validate({ params : todoIdSchema }), todoAdminController.getTodo)

export default router