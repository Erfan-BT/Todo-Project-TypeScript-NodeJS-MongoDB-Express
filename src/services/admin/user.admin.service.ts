import { UserQuaryBuilder } from "../../builders/user.quary.builder.js";
import { IUser } from "../../models/user.model.js";
import authRepository from "../../repository/auth.repository.js";
import { UserQSDto } from "../../validations/auth.validation.js";

class UserAdminService {
    async getAllUsers (qs : UserQSDto)
    : Promise<IUser[]> {
        // Create Options
        const options = UserQuaryBuilder.build(qs)

        // Get Users
        return await authRepository.getAllUsers(options.limit, options.skip, options.where, options.sort)
    }
}

export default new UserAdminService()