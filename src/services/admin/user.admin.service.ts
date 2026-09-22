import mongoose, { Types } from "mongoose";
import { UserQuaryBuilder } from "../../builders/user.quary.builder.js";
import { IUser } from "../../models/user.model.js";
import authRepository from "../../repository/auth.repository.js";
import { ChangeUserDto, UserQSDto } from "../../validations/auth.validation.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/appError.js";
import argon2 from "argon2";
import auditRepository from "../../repository/audit.repository.js";
import { AuditAction, AuditEntityType } from "../../types/audit.enum.js";
import { UserTodosState } from "../../types/todo.type.js";
import todoRepository from "../../repository/todo.repository.js";

class UserAdminService {
    async getAllUsers (qs : UserQSDto)
    : Promise<IUser[]> {
        // Create Options
        const options = UserQuaryBuilder.build(qs)

        // Get Users
        return await authRepository.getAllUsers(options.limit, options.skip, options.where, options.sort)
    }

    async getUser (userId : Types.ObjectId)
    : Promise<{
        user : IUser;
        state : UserTodosState
    }> {
        // Get User
        const user = await authRepository.getAdminUserById(userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${userId} }`)

         // Get User Todos State
        const state = await todoRepository.userTodosState(userId)
        
        return {
            user,
            state
        }
    }

    async changeUser (userId : Types.ObjectId, userData : ChangeUserDto, adminId : Types.ObjectId, ipAddress : string)
    : Promise<ChangeUserDto> {
        // Get User
        const user = await authRepository.getAdminUserById(userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${userId} }`)

        // Create Data
        const data : Partial<Pick<IUser, 'fullname' | 'username'>> = {}

        if (userData.fullname !== undefined && userData.fullname !== user.fullname)
            data.fullname = userData.fullname

        if (userData.username !== undefined && userData.username !== user.username)
            data.username = userData.username

        if (!Object.keys(data).length)
            return data

        const session = await mongoose.startSession()

        try {
            await session.withTransaction(async () => {
                // Change User
                if (!await authRepository.changeUser(userId, data, session))
                    throw new ConflictError('User Not Changed')

                // Add Admin Audit
                await auditRepository.createAudit({
                    adminId,
                    action : AuditAction.CHANGE,
                    entityType : AuditEntityType.USER,
                    entityId : userId,
                    oldValue : {
                        fullname : user.fullname,
                        username : user.username
                    },
                    newValue : data,
                    ipAddress
                }, session)

            })
        } finally {
            await session.endSession()
        }

        return data
    }

    async changeUserPassword (userId : Types.ObjectId, newPassword : string, adminId : Types.ObjectId, reason : string, ipAddress : string)
    : Promise<void> {
        // Get User
        const user = await authRepository.getAdminUserById(userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${userId} }`)

        if (user.deletedAt !== null)
            throw new ForbiddenError('Can Not Change Deleted User Password')

        // Hash Password
        const hashedNewPassword = await argon2.hash(newPassword)

        const session = await mongoose.startSession()

        try {
            await session.withTransaction(async () => {
                // Change User Password
                if (!await authRepository.changeAdminPassword(userId, hashedNewPassword, session))
                    throw new ConflictError('User Password Not Changed')

                // Add Admin Audit
                await auditRepository.createAudit({
                    adminId,
                    action : AuditAction.CHANGE_PASSWORD,
                    entityType : AuditEntityType.USER,
                    entityId : userId,
                    reason,
                    ipAddress
                    }, session)

                })
        } finally {
            await session.endSession()
        }

        return
    }

    async changeUserStatus (userId : Types.ObjectId, adminId : Types.ObjectId, reason : string, ipAddress : string)
    : Promise<boolean> {
        // Get User
        const user = await authRepository.getAdminUserById(userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${userId} }`)

        if (user.deletedAt !== null)
            throw new ForbiddenError('Can Not Change Deleted User Status')

        const session = await mongoose.startSession()
        
        try {
            await session.withTransaction(async () => {
                // Change User Status
                if (!await authRepository.changeUserStatus(userId, user.active, session))
                    throw new ConflictError('User Status Not Changed')

                // Add Admin Audit
                await auditRepository.createAudit({
                    adminId,
                    action : user.active ? AuditAction.DEACTIVE : AuditAction.ACTIVE,
                    entityType : AuditEntityType.USER,
                    entityId : userId,
                    reason,
                    ipAddress
                }, session)

            })
        } finally {
            await session.endSession()
        }

        return !user.active
    }

    async deleteUser (userId : Types.ObjectId, adminId : Types.ObjectId, reason : string, ipAddress : string)
    : Promise<void> {
        // Get User
        const user = await authRepository.getAdminUserById(userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${userId} }`)

        if (user.deletedAt !== null)
            return

        const session = await mongoose.startSession()

        try {
            await session.withTransaction(async () => {
                // Delete User
                if (!await authRepository.deleteUser(userId, session))
                    throw new ConflictError('User Not Deleted')

                // Add Admin Audit
                await auditRepository.createAudit({
                    adminId,
                    action : AuditAction.DELETE,
                    entityType : AuditEntityType.USER,
                    entityId : userId,
                    reason,
                    ipAddress
                }, session)

            })
        } finally {
            await session.endSession()
        }

        return
    }

    async restoreUser (userId : Types.ObjectId, adminId : Types.ObjectId, reason : string, ipAddress : string)
    : Promise<IUser> {
        // Get User
        const user = await authRepository.getAdminUserById(userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${userId} }`)

        if (user.deletedAt === null)
            return user

        const session = await mongoose.startSession()

        try {
            await session.withTransaction(async () => {
                // Restore User
                if (!await authRepository.restoreUser(userId, session))
                    throw new ConflictError('User Not Restored')

                // Add Admin Audit
                await auditRepository.createAudit({
                    adminId,
                    action : AuditAction.RESTORE,
                    entityType : AuditEntityType.USER,
                    entityId : userId,
                    reason,
                    ipAddress
                }, session)

            })
        } finally {
            await session.endSession()
        }

        user.deletedAt = null
        user.active = true
        return user
    }
}

export default new UserAdminService()