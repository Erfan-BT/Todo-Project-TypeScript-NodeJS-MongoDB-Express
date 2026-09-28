import { Types } from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditQueryBuilder } from "../../../src/builders/audit.query.builder";
import auditRepository from "../../../src/repository/audit.repository";
import { IAudit } from "../../../src/models/admin.audit.model";
import auditAdminServiceTs from "../../../src/services/admin/audit.admin.service";
import { AuditAction, AuditEntityType } from "../../../src/types/audit.enum";
import { NotFoundError } from "../../../src/utils/appError";

vi.mock('../../../src/repository/audit.repository.js', () => ({
    default: {
        getAllAudits : vi.fn(),
        getAudit : vi.fn(),
    }
}))
vi.mock('../../../src/builders/audit.query.builder.js', () => ({
    AuditQueryBuilder: {
        build: vi.fn()
    }
}))

beforeEach(() => {
    vi.clearAllMocks()
})

const auditId = new Types.ObjectId()
const date = new Date()

const audit1 = {
    _id : auditId,
    adminId : new Types.ObjectId(),
    action : AuditAction.ACTIVE,
    entityType : AuditEntityType.USER,
    entityId : new Types.ObjectId(),
    reason : 'reason', 
    ipAddress : 'unknown',
    createdAt : date,
    updatedAt : date
}

const audit2 = {
    _id : new Types.ObjectId(),
    adminId : new Types.ObjectId(),
    action : AuditAction.CHANGE,
    entityType : AuditEntityType.USER,
    entityId : new Types.ObjectId(),
    oldValue : {},
    newValue : {},
    reason : 'reason', 
    ipAddress : 'unknown',
    createdAt : date,
    updatedAt : date
}

describe('auditAdminService.getAllAudits', () => {
    it ('should get audits successfully', async () => {

        const qs = {
            page: 1,
            limit: 10,
            sort: 'CREATEDAT',
            sortType: 'DESC'
        } as any

        const options = {
            limit: 10,
            skip: 0,
            where: {},
            sort: {
                createdAt: -1,
                _id: -1
            }
        }

        vi.mocked(AuditQueryBuilder.build)
            .mockReturnValue(options)

        vi.mocked(auditRepository.getAllAudits)
            .mockResolvedValue([audit1, audit2] as IAudit[])

        const result = await auditAdminServiceTs.getAllAudits(qs)

        expect(AuditQueryBuilder.build)
            .toHaveBeenCalledOnce()

        expect(AuditQueryBuilder.build)
            .toHaveBeenCalledWith(qs)

        expect(auditRepository.getAllAudits)
            .toHaveBeenCalledOnce()

        expect(auditRepository.getAllAudits)
            .toHaveBeenCalledWith(
                options.limit,
                options.skip,
                options.where,
                options.sort
            )

            expect(result)
                .toEqual([audit1, audit2] as IAudit[])
    })

    it('should propagate repository error', async () => {
    
        const qs = {
            page: 1,
            limit: 10,
            sort: 'CREATEDAT',
            sortType: 'DESC'
        } as any
    
        const options = {
            limit: 10,
            skip: 0,
            where: {},
            sort: {}
        }
    
        const error = new Error('Database Error')
    
    
        vi.mocked(AuditQueryBuilder.build)
            .mockReturnValue(options as any)
    
        vi.mocked(auditRepository.getAllAudits)
            .mockRejectedValue(error)
    
    
        await expect(
            auditAdminServiceTs.getAllAudits(qs)
        ).rejects.toBe(error)
    })
})

describe('auditAdminService.getAudit', () => {
    it ('should get audit successfully', async () => {

        vi.mocked(auditRepository.getAudit)
            .mockResolvedValue(audit1)

        const result = await auditAdminServiceTs.getAudit(auditId)

        expect(auditRepository.getAudit)
            .toHaveBeenCalledWith(auditId)

        expect(result)
            .toEqual(audit1)
    })

    it ('should throw NotFoundError', async () => {

        vi.mocked(auditRepository.getAudit)
            .mockResolvedValue(null)

        const wrongAuditId = new Types.ObjectId()
        await expect(
            auditAdminServiceTs.getAudit(wrongAuditId)
        ).rejects.toBeInstanceOf(NotFoundError)
    })
})