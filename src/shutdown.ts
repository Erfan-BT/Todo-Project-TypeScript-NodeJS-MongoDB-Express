import { Server } from 'node:http'
import { logger } from './configs/pino.config.js'
import { disconnectDB } from './configs/mongoose.config.js'

let isShuttingDown = false
const SHUTDOWN_TIMEOUT = 15000 // 15s

export const gracefulShutdown = async (
    server: Server,
    signal: 'SIGINT' | 'SIGTERM'
): Promise<void> => {
    // Check Status
    if (isShuttingDown)
        return

    isShuttingDown = true

    logger.info(`${signal} Received. Starting Graceful Shutdown...`)

    try {
        // Timeout
        const forceShutdownTimer = setTimeout(() => {
            logger.fatal('Graceful Shutdown Timeout. Forcing Shutdown...')
            process.exit(1)
        }, SHUTDOWN_TIMEOUT)

        // Stop accepting new requests
        await new Promise<void>((resolve, reject) => {
            server.close(error => {
                if (error)
                    return reject(error)

                resolve()
            })
        })

        clearTimeout(forceShutdownTimer)
        logger.info('HTTP Server Closed')

        // Close MongoDB connection
        await disconnectDB()
        logger.info('MongoDB Connection Closed')

        // Exit Process
        logger.info('Graceful Shutdown Completed')
        process.exit(0)

    } catch (error) {
        logger.fatal({ err : error }, 'Error During Graceful Shutdown')
        process.exit(1)
    }
}