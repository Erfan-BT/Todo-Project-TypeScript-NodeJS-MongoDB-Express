import { AuditQSDto } from "../../validations/audit.validation.js";
import { AuditQueryBuilder } from '../../builders/audit.query.builder.js'
import auditRepository from '../../repository/audit.repository.js'
import { IAudit } from "../../models/admin.audit.model.js";
class AuditAdminService {
    async getAllAudits(qs : AuditQSDto)
    : Promise<IAudit[]> {
        // Create Options
        const options = AuditQueryBuilder.build(qs)

        // Get Audits
        return await auditRepository.getAllAudits(options.limit, options.skip, options.where, options.sort)
    }
}

export default new AuditAdminService()