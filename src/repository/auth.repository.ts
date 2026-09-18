import { Types } from "mongoose"
import { User } from "../models/index.js"
import { IUser } from "../models/user.model.js"
import { RegisterDto } from "../validations/auth.validation.js"

class AuthRepository {
    async getUserByUsername (username : string)
    : Promise<IUser | null> {
        return await User.findOne({
            username,
            deletedAt : null
        })
        .select('-password')
        .lean()
    }

    async getUserById (userId : Types.ObjectId)
    : Promise<IUser | null> {
        return await User.findOne({
            _id : userId,
            deletedAt : null
        })
        .select('-password')
        .lean()
    }

    async getUserPassword (userId : Types.ObjectId)
    : Promise<string> {
        return (await User.findOne({
            _id : userId,
            deletedAt : null
        })
        .select('password')
        .lean()
        )!.password
        
    }

    async createUser (data : RegisterDto)
    : Promise<IUser> {
        return await User.create(data)
    }

    async changePassword (userId : Types.ObjectId, password : string)
    : Promise<boolean> {
        const result = await User.updateOne({
            _id : userId
        }, {
            $set : {
                password
            }
        })
        return result.modifiedCount === 1
    }

    // ----- Admin -----
    async getAllUsers (limit : number, skip : number, where : any, sort : any)
    : Promise<IUser[]> {
        return User
            .find(where)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .select('-password')
            .lean()
    }

    async getAdminUserById (userId : Types.ObjectId)
    : Promise<IUser | null> {
        return await User.findOne({
            _id : userId,
        })
        .select('-password')
        .lean()
    }

    async changeUser (userId : Types.ObjectId, data : Partial<Pick<IUser, 'fullname' | 'username'>>)
    : Promise<boolean> {
        const result = await User.updateOne({
            _id : userId,
            deletedAt : null
        }, {
            $set : {
                ...data
            }
        })

        return result.modifiedCount === 1
    }

    async changeUserStatus (userId : Types.ObjectId, currentStatus : boolean)
    : Promise<boolean> {
        const result = await User.updateOne({
            _id : userId,
            active : currentStatus,
            deletedAt : null
        }, {
            $set : {
                active : !currentStatus
            }
        })

        return result.modifiedCount === 1
    }

    async deleteUser (userId : Types.ObjectId)
    : Promise<boolean> {
        const result = await User.updateOne({
            _id : userId,
            deletedAt : null
        }, {
            $set : {
                deletedAt : new Date(),
                active : false
            }
        })

        return result.modifiedCount === 1
    }
}

export default new AuthRepository()