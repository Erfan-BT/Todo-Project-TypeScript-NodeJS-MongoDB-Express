import { Types } from "mongoose";
import { UserQuaryBuilder } from "../../builders/user.quary.builder.js";
import { IUser } from "../../models/user.model.js";
import authRepository from "../../repository/auth.repository.js";
import { UserIdDto, UserQSDto } from "../../validations/auth.validation.js";
import { NotFoundError } from "../../utils/appError.js";

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
        const user = await authRepository.getUserById(userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${userId} }`)

        return user
    }
}

export default new UserAdminService()