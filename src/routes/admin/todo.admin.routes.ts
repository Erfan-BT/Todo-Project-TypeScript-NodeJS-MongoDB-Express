import express from 'express'
import { validate } from '../../middleware/validation.middleware.js'
import { todoQS } from '../../validations/todo.validation.js'
import todoAdminController from '../../controllers/admin/todo.admin.controller.js'

const router = express.Router()

router.get('/', validate({ query : todoQS }), todoAdminController.getAllTodos)

export default router