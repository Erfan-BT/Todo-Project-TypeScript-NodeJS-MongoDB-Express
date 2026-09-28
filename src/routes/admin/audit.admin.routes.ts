import express from 'express'
import { validate } from '../../middleware/validation.middleware.js'
import auditAdminController from '../../controllers/admin/audit.admin.controller.js'
import { auditIdSchema, auditQS } from '../../validations/audit.validation.js'

const router = express.Router()

router.get('/', validate({ query : auditQS }), auditAdminController.getAllAudits)
router.get('/:auditId', validate({ params : auditIdSchema }), auditAdminController.getAudit)

export default router