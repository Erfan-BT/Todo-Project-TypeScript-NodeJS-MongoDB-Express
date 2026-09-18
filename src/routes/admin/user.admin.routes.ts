import express from 'express'
import userAdminController from '../../controllers/admin/user.admin.controller.js'
import { validate } from '../../middleware/validation.middleware.js'
import { userIdSchema, userQS } from '../../validations/auth.validation.js'

const router = express.Router()

router.get('/', validate({ query : userQS }), userAdminController.getAllUsers)
router.get('/:userId', validate({ params : userIdSchema }), userAdminController.getUser)

export default router