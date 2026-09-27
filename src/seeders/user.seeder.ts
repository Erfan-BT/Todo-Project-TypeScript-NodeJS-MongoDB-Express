import argon2 from "argon2";
import { User } from "../models/index.js";
import { env } from "../configs/env.config.js";
import { logger } from "../configs/pino.config.js";

export const adminSeeder = async () => {
    logger.info('Init Admin Seeder')
    try {
        // Find Admin
        const admin = await User.findOne({
            role : "Admin",
            username : env.ADMIN_USERNAME
        })
    
        if (admin)
            return
    
        // Hash Password
        const hashedPassword = await argon2.hash(env.ADMIN_PASSWORD)
    
        await User.create({
            fullname : env.ADMIN_FULLNAME,
            username : env.ADMIN_USERNAME,
            password : hashedPassword,
            role : "Admin",
            active : true
        })
    } catch (error) {
        logger.error({ err : error }, 'ERROR ON ADMIN SEEDER')
        throw error
    }
}