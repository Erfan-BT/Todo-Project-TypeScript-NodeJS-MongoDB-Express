import { AuditQSDto } from "../../validations/audit.validation.js";
import { AuditQueryBuilder } from '../../builders/audit.query.builder.js'
import auditRepository from '../../repository/audit.repository.js'
import { IAudit } from "../../models/admin.audit.model.js";
import { Types } from "mongoose";
import { NotFoundError } from '../../utils/appError.js'
class AuditAdminService {
    async getAllAudits(qs : AuditQSDto)
    : Promise<IAudit[]> {
        // Create Options
        const options = AuditQueryBuilder.build(qs)

        // Get Audits
        return await auditRepository.getAllAudits(options.limit, options.skip, options.where, options.sort)
    }

    async getAudit(auditId : Types.ObjectId)
    : Promise<IAudit> {
        // Get Audit
        const audit = await auditRepository.getAudit(auditId)
        if (!audit)
            throw new NotFoundError(`Audit Not Found (ID : ${auditId} )`)

        return audit
    }
}

export default new AuditAdminService()