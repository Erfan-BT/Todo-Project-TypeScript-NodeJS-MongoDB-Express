import { Schema, Types } from "mongoose";

export interface IUser {
    _id : Types.ObjectId;
    fullname : string;
    username : string;
    password : string;
    role : 'Admin' | 'User';
    active : boolean;
    createdAt : Date;
    updatedAt : Date | null;
}

export const userSchema = new Schema<IUser>(
    {
        fullname : {
            type : String,
            required : true
        },
        username : {
            type : String,
            required : true,
            unique : true
        },
        password : {
            type : String,
            required : true
        },
        role : {
            type : String,
            enum : ['Admin', 'User'],
            default : "User"
        },
        active : {
            type : Boolean,
            default : true
        }
    },
    {
        timestamps : true,
    }
)