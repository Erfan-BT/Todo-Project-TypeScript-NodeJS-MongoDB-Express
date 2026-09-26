import express from 'express'
import { validate } from '../middleware/validation.middleware.js'
import { changePasswordSchema, loginSchema, refreshTokenSchema, registerSchema } from '../validations/auth.validation.js'
import authControllers from '../controllers/auth.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { getAuthIpLimiter, getAuthUsernameLimiter, getUserIdLimiter } from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

router.post('/register', getAuthIpLimiter(), validate({ body : registerSchema }), getAuthUsernameLimiter(), authControllers.register)
router.post('/login', getAuthIpLimiter(), validate({ body : loginSchema }), getAuthUsernameLimiter(), authControllers.login)
router.post('/refresh', getAuthIpLimiter(), validate({ body : refreshTokenSchema }), authControllers.refresh)
router.patch('/change-password', getAuthIpLimiter(), authMiddleware, validate({ body : changePasswordSchema }), getUserIdLimiter(), authControllers.changePassword)
router.post('/logout', authMiddleware, authControllers.logout)
router.post('/logout-all', authMiddleware, authControllers.logoutAll)
router.get('/me', authMiddleware, getUserIdLimiter(), authControllers.getUserAccount)

export default router