import { DeleteResult, Types } from "mongoose"
import { Session } from "../models/index.js"
import { ISession } from "../models/session.model.js"

class SessionRepository {
    async getSession (userId : Types.ObjectId, jti : string)
    : Promise<ISession | null> {
        return await Session.findOne({
            userId,
            jti
        })
        .lean()
    }

    async createSession (userId : Types.ObjectId, jti : string, refreshTokenHash : string, expiresTime : string, device : string)
    : Promise<ISession> {
        return await Session.create({
            userId,
            jti,
            refreshTokenHash,
            expiresTime,
            device
        })
    }

    async deleteSessions (userId : Types.ObjectId, device ?: string)
    : Promise<boolean> {
        const result = await Session.deleteMany({
            userId,
            ...(device ? {device} : {})
        })
        return result.deletedCount > 0
    }

    async deleteSession (userId : Types.ObjectId, jti : string)
    : Promise<boolean> {
        const result = await Session.deleteMany({
            userId,
            jti
        })
        return result.deletedCount === 0
    }
}

export default new SessionRepository()