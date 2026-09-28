import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { AuditQSDto } from "../../validations/audit.validation.js";
import auditAdminService from "../../services/admin/audit.admin.service.js";

class AuditAdminController {
    async getAllAudits (req : AuthRequest, res : Response, next : NextFunction) {
        try {
            const qs = req.validated.query as AuditQSDto
            const data = await auditAdminService.getAllAudits(qs)

            res.status(200).json({
                success : true,
                msg : 'All Audits Successfully Found',
                data
            })
        } catch (error) {
            next(error)
        }
    }

}

export default new AuditAdminController()