import { Types } from "mongoose"
import { User } from "../models/index.js"
import { IUser } from "../models/user.model.js"
import { RegisterDto } from "../validations/auth.validation.js"

class AuthRepository {
    async getUserByUsername (username : string)
    : Promise<IUser | null> {
        return await User.findOne({
            username,
        })
        .lean()
    }

    async getUserById (userId : Types.ObjectId)
    : Promise<IUser | null> {
        return await User.findOne({
            _id : userId
        })
        .lean()
    }

    async createUser (data : RegisterDto)
    : Promise<IUser> {
        return await User.create(data)
    }
}

export default new AuthRepository()