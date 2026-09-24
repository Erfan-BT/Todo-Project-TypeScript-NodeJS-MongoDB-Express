import 'dotenv/config'
import app from './app.js'
import { env } from './configs/env.config.js'
import { logger } from './configs/pino.config.js'
import { connectDB } from './configs/mongoose.config.js'

const port = env.SERVER_PORT

async function startServer() {
    try {
        // Connect DB
        await connectDB()
        
        // Start Server
        app.listen(port, () => {
            logger.info(`Server Run On Port ${port}`)
        })
    } catch (error) {
        logger.fatal({error : String(error)}, "Server Not Run")
        process.exit(1)
    }
}

await startServer()