import express from 'express'
import userAdminController from '../../controllers/admin/user.admin.controller.js'
import { validate } from '../../middleware/validation.middleware.js'
import { changeUserSchema, userIdSchema, userQS } from '../../validations/auth.validation.js'

const router = express.Router()

router.get('/', validate({ query : userQS }), userAdminController.getAllUsers)
router.get('/:userId', validate({ params : userIdSchema }), userAdminController.getUser)
router.patch('/userId/status', validate({ params : userIdSchema }), userAdminController.changeUserStatus)
router.patch('/userId', validate({ params : userIdSchema, body : changeUserSchema }), userAdminController.changeUser)
router.delete('/userId', validate({ params : userIdSchema }), userAdminController.deleteUser)

export default router