import { Types } from "mongoose";
import { UserQuaryBuilder } from "../../builders/user.quary.builder.js";
import { IUser } from "../../models/user.model.js";
import authRepository from "../../repository/auth.repository.js";
import { ChangeUserDto, UserQSDto } from "../../validations/auth.validation.js";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/appError.js";
import argon2 from "argon2";

class UserAdminService {
    async getAllUsers (qs : UserQSDto)
    : Promise<IUser[]> {
        // Create Options
        const options = UserQuaryBuilder.build(qs)

        // Get Users
        return await authRepository.getAllUsers(options.limit, options.skip, options.where, options.sort)
    }

    async getUser (userId : Types.ObjectId)
    : Promise<IUser> {
        // Get User
        const user = await authRepository.getAdminUserById(userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${userId} }`)

        return user
    }

    async changeUser (userId : Types.ObjectId, userData : ChangeUserDto)
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

        // Change User
        if (!await authRepository.changeUser(userId, data))
            throw new ConflictError('User Not Changed')

        return data
    }

    async changeUserPassword (userId : Types.ObjectId, newPassword : string)
    : Promise<void> {
        // Get User
        const user = await authRepository.getAdminUserById(userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${userId} }`)

        if (user.deletedAt !== null)
            throw new ForbiddenError('Can Not Change Deleted User Password')

        // Hash Password
        const hashedNewPassword = await argon2.hash(newPassword)

        // Change User Password
        if (!await authRepository.changePassword(userId, hashedNewPassword))
            throw new ConflictError('User Password Not Changed')

        return
    }

    async changeUserStatus (userId : Types.ObjectId)
    : Promise<boolean> {
        // Get User
        const user = await authRepository.getAdminUserById(userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${userId} }`)

        if (user.deletedAt !== null)
            throw new ForbiddenError('Can Not Change Deleted User Status')

        // Change User Status
        if (!await authRepository.changeUserStatus(userId, user.active))
            throw new ConflictError('User Status Not Changed')

        return !user.active
    }

    async deleteUser (userId : Types.ObjectId)
    : Promise<void> {
        // Get User
        const user = await authRepository.getAdminUserById(userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${userId} }`)

        if (user.deletedAt !== null)
            return

        // Delete User
        if (!await authRepository.deleteUser(userId))
            throw new ConflictError('User Not Deleted')

        return
    }
}

export default new UserAdminService()