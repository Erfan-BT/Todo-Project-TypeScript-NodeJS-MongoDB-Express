import express from 'express'
import { validate } from '../middleware/validation.middleware.js'
import { loginSchema, refreshTokenSchema, registerSchema } from '../validations/auth.validation.js'
import authControllers from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/register', validate({ body : registerSchema }), authControllers.register)
router.post('/login', validate({ body : loginSchema }), authControllers.login)
router.post('/refresh', validate({ body : refreshTokenSchema }), authControllers.refresh)

export default router