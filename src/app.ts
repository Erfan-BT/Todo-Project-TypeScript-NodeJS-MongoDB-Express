import express, { NextFunction, Request, Response } from 'express'
import compression from 'compression'
import helmet from 'helmet'
import cors from 'cors'
import { env } from './configs/env.config.js'

import AuthRoutes from './routes/auth.routes.js'
import TodoRoutes from './routes/todo.routes.js'
import AdminRoutes from './routes/admin/admin.routes.js'
import { errorHandler } from './middleware/errorHandler.middleware.js'
import { NotFoundError } from './utils/appError.js'
import { loggerMiddleware } from './middleware/logger.middleware.js'

const app = express()

app.use(compression({
    level : 6, 
    threshold : 1024,
    filter : (req : Request, res : Response) => {
        if (req.path.startsWith('/api/')) {
            return true
        }
        return compression.filter(req, res)
    }
}))

app.use(helmet())
app.use(cors({
    origin : env.FRONTEND_URL
}))

app.use(express.json())
app.use(express.urlencoded({
    extended:true
}))

app.use(loggerMiddleware)

// ---------- Routes ----------
// Health
app.get('/health', (req: Request, res: Response) => {
    req.logger.info('HEALTH')
    res.json({
        success : true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    })
})

// Main Routes
app.use('/api/v1/auth', AuthRoutes)
app.use('/api/v1/todos', TodoRoutes)
app.use('/api/v1/admin', AdminRoutes)

// Error Handler
app.use((req : Request , res : Response, next : NextFunction) => {
    next(new NotFoundError(req.method + ' => ' + req.path))
})

app.use(errorHandler)

export default app