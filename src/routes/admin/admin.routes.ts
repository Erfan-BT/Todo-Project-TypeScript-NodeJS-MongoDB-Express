import express from 'express'
import { adminMiddleware, authMiddleware } from '../../middleware/auth.middleware.js'
import AdminUserRoutes from './user.admin.routes.js'
import AdminTodoRoutes from './todo.admin.routes.js'

const router = express.Router()

router.use('/users', authMiddleware, adminMiddleware, AdminUserRoutes)
router.use('/todos', authMiddleware, adminMiddleware, AdminTodoRoutes)

export default router