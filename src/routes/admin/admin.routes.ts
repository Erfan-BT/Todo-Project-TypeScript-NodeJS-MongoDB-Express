import express from 'express'
import { adminMiddleware, authMiddleware } from '../../middleware/auth.middleware.js'
import AdminUserRoutes from './user.admin.routes.js'

const router = express.Router()

router.use('/users', authMiddleware, adminMiddleware, AdminUserRoutes)

export default router