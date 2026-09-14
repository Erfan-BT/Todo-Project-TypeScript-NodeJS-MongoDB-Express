import express from 'express'
import { validate } from '../middleware/validation.middleware.js'
import { loginSchema, registerSchema } from '../validations/auth.validation.js'
import authControllers from '../controllers/auth.controller.js'

const router = express.Router()

router.post('/register', validate({ body : registerSchema }), authControllers.register)
router.post('/login', validate({ body : loginSchema }), authControllers.login)

export default router