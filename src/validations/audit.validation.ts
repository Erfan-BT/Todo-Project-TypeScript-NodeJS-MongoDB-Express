import z from "zod";
import { AuditAction, AuditEntityType, AuditSort } from "../types/audit.enum.js";
import { SortType } from "../types/sort.type.js";
import { Types } from "mongoose";

export const reasonSchema = z.object({
    reason : z.string().trim().min(3).max(200)
})

export const auditQS = z.object({
    page : z.coerce.number().int().positive().default(1),
    limit : z.coerce.number().int().positive().max(50).default(30),

    sort : z.enum(AuditSort).default(AuditSort.CREATEDAT),
    sortType : z.enum(SortType).default(SortType.DESC),

    q : z.string().trim().max(50, 'Max Characters : 50').optional(),

    action : z.enum(AuditAction).optional(),
    entityType : z.enum(AuditEntityType).optional(),

    from : z.coerce.date().optional(),
    to : z.coerce.date().optional(),
})
.superRefine((data, ctx) => {
    if (
        data.from !== undefined &&
        data.to !== undefined &&
        data.to.getTime() < data.from.getTime()
    ) {
        ctx.addIssue({
            code : z.ZodIssueCode.custom,
            path : ['to'],
            message : 'To Date Must Be Greater Than Or Equal To From Date'
        })
    }
})

export const auditIdSchema = z.object({
    auditId : z.string().trim().refine(Types.ObjectId.isValid, 'Invalid ObjectId').transform(v => new Types.ObjectId(v))
})

export type ReasonDto = z.infer<typeof reasonSchema>
export type AuditQSDto = z.infer<typeof auditQS>
export type AuditIdDto = z.infer<typeof auditIdSchema>