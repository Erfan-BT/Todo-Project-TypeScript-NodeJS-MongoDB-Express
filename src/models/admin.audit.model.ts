import { Schema, Types } from "mongoose";
import { AuditAction, AuditEntityType } from "../types/audit.enum.js";

export interface IAudit {
    _id : Types.ObjectId;
    adminId : Types.ObjectId;
    action : string;
    entityType : string;
    entityId : Types.ObjectId;
    oldValue ?: Record<string, unknown>;
    newValue ?: Record<string, unknown>;
    reason ?: string;
    ipAddress : string;
    createdAt : Date;
    updatedAt : Date;
}

export const auditSchema = new Schema<IAudit>(
    {
        adminId : {
            type : Types.ObjectId,
            required : true,
            ref : 'User'
        },
        action : {
            type : String,
            enum : AuditAction,
            required : true,
            index : true
        },
        entityType : {
            type : String,
            enum : AuditEntityType,
            required : true,
            index : true
        },
        entityId : {
            type : Types.ObjectId,
            required : true
        },
        oldValue : {
            type : Schema.Types.Mixed,
            required : false,
            allowNull : true,
            default : null
        },
        newValue : {
            type : Schema.Types.Mixed,
            required : false,
            allowNull : true,
            default : null
        },
        reason : {
            type : String,
            required : false,
            allowNull : true,
            default : null
        },
        ipAddress : {
            type : String,
            required : true
        }
    },
    {
        timestamps : true
    }
)