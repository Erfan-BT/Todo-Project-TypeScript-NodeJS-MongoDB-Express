import 'dotenv/config'
import app from './app.js'
import { env } from './configs/env.config.js'
import { logger } from './configs/pino.config.js'
import { connectDB } from './configs/mongoose.config.js'
import { gracefulShutdown } from './shutdown.js'
import { initializeRateLimiters } from './middleware/rateLimiter.middleware.js'

const port = env.SERVER_PORT

async function startServer() {
    try {
        // Connect DB
        await connectDB()

        // Init Rate Limiters
        initializeRateLimiters()
        
        // Start Server
        const server = app.listen(port, () => {
            logger.info(`Server Run On Port ${port}`)
        })

        // Graceful Shutdown
        process.on('SIGTERM', () => {
            gracefulShutdown(server, 'SIGTERM')
        })

        process.on('SIGINT', () => {
            gracefulShutdown(server, 'SIGINT')
        })
    } catch (error) {
        logger.fatal({error : String(error)}, "Server Not Run")
        process.exit(1)
    }
}

await startServer()