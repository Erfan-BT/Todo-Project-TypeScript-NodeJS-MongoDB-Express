import { Types } from "mongoose"
import { AuditAction, AuditEntityType } from "./audit.enum.js";

export type CreateAudit = {
    adminId : Types.ObjectId;
    action : AuditAction;
    entityType : AuditEntityType;
    entityId : Types.ObjectId;
    oldValue ?: Record<string, unknown>;
    newValue ?: Record<string, unknown>;
    reason ?: string;
    ipAddress : string;
}