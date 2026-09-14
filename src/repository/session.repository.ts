import { Types } from "mongoose"
import { Session } from "../models/index.js"
import { ISession } from "../models/session.model.js"

class SessionRepository {
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
}

export default new SessionRepository()