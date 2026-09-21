import express from 'express'
import { validate } from '../../middleware/validation.middleware.js'
import { changeTodoSchema, changeTodoStatusSchema, todoIdSchema, todoQS } from '../../validations/todo.validation.js'
import todoAdminController from '../../controllers/admin/todo.admin.controller.js'
import { reasonSchema } from '../../validations/audit.validation.js'

const router = express.Router()

router.get('/', validate({ query : todoQS }), todoAdminController.getAllTodos)
router.get('/:todoId', validate({ params : todoIdSchema }), todoAdminController.getTodo)
router.post('/:todoId/restore', validate({ params : todoIdSchema, body : reasonSchema }), todoAdminController.restoreTodo)
router.patch('/:todoId/status', validate({ params : todoIdSchema , body : changeTodoStatusSchema }), todoAdminController.changeTodoStatus)
router.patch('/:todoId', validate({ params : todoIdSchema , body : changeTodoSchema }), todoAdminController.changeTodo)
router.delete('/:todoId/hard-delete', validate({ params : todoIdSchema, body : reasonSchema }), todoAdminController.deleteHardTodo)
router.delete('/:todoId', validate({ params : todoIdSchema, body : reasonSchema }), todoAdminController.deleteSoftTodo)

export default router