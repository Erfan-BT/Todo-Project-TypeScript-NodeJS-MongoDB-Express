import express from 'express'
import userAdminController from '../../controllers/admin/user.admin.controller.js'
import { validate } from '../../middleware/validation.middleware.js'
import { adminChangeUserPasswordSchema, changeUserSchema, userIdSchema, userQS } from '../../validations/auth.validation.js'
import { reasonSchema } from '../../validations/audit.validation.js'

const router = express.Router()

router.get('/', validate({ query : userQS }), userAdminController.getAllUsers)
router.get('/:userId', validate({ params : userIdSchema }), userAdminController.getUser)
router.post('/:userId/restore', validate({ params : userIdSchema, body : reasonSchema }), userAdminController.restoreUser)
router.patch('/:userId/password', validate({ params : userIdSchema, body : adminChangeUserPasswordSchema }), userAdminController.changeUserPassword)
router.patch('/:userId/status', validate({ params : userIdSchema, body : reasonSchema }), userAdminController.changeUserStatus)
router.patch('/:userId', validate({ params : userIdSchema, body : changeUserSchema }), userAdminController.changeUser)
router.delete('/:userId', validate({ params : userIdSchema, body : reasonSchema }), userAdminController.deleteUser)

export default router