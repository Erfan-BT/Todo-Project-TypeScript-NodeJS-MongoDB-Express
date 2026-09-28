import express from 'express'
import { validate } from '../../middleware/validation.middleware.js'
import auditAdminController from '../../controllers/admin/audit.admin.controller.js'
import { auditQS } from '../../validations/audit.validation.js'

const router = express.Router()

router.get('/', validate({ query : auditQS }), auditAdminController.getAllAudits)

export default router