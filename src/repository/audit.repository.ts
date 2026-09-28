import { ClientSession } from "mongoose";
import { CreateAudit } from "../types/audit.type.js";
import { Audit } from "../models/index.js";
import { IAudit } from "../models/admin.audit.model.js";

class AuditRepository {
    async createAudit (data : CreateAudit, session : ClientSession)
    : Promise<IAudit | undefined> {
        const [audit] = await Audit.create([data], {session})
        return audit
    }

    async getAllAudits (limit : number, skip : number, where : any, sort : any)
    : Promise<IAudit[]> {
        return await Audit
            .find(where)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean()
    }
}

export default new AuditRepository()