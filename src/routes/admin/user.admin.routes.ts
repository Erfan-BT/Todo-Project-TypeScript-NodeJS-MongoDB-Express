import express from 'express'
import userAdminController from '../../controllers/admin/user.admin.controller.js'
import { validate } from '../../middleware/validation.middleware.js'
import { adminChangeUserPasswordSchema, changeUserSchema, userIdSchema, userQS } from '../../validations/auth.validation.js'
import { reasonSchema } from '../../validations/audit.validation.js'
import { getUserIdLimiter } from '../../middleware/rateLimiter.middleware.js'

const router = express.Router()

router.get('/', validate({ query : userQS }), getUserIdLimiter(), userAdminController.getAllUsers)
router.get('/:userId', validate({ params : userIdSchema }), getUserIdLimiter(), userAdminController.getUser)
router.post('/:userId/restore', validate({ params : userIdSchema, body : reasonSchema }), getUserIdLimiter(), userAdminController.restoreUser)
router.patch('/:userId/password', validate({ params : userIdSchema, body : adminChangeUserPasswordSchema }), getUserIdLimiter(), userAdminController.changeUserPassword)
router.patch('/:userId/status', validate({ params : userIdSchema, body : reasonSchema }), getUserIdLimiter(), userAdminController.changeUserStatus)
router.patch('/:userId', validate({ params : userIdSchema, body : changeUserSchema }), getUserIdLimiter(), userAdminController.changeUser)
router.delete('/:userId', validate({ params : userIdSchema, body : reasonSchema }), getUserIdLimiter(), userAdminController.deleteUser)

export default router