import express from 'express'
import { validate } from '../middleware/validation.middleware.js'
import { registerSchema } from '../validations/auth.validation.js'
import authControllers from '../controllers/auth.controller.js'

const router = express.Router()

router.get('/register', validate({ body : registerSchema }), authControllers.register)

export default router