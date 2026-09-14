import { Schema, Types } from "mongoose";

export interface ISession {
    _id : Types.ObjectId;
    userId : Types.ObjectId;
    jti : string;
    refreshTokenHash : string;
    expiresTime : string;
    createdAt : Date;
    updatedAt : Date | null;
    device : string | null;
}

export const sessionSchema = new Schema<ISession>(
    {
        userId : {
            type : Schema.Types.ObjectId,
            ref : 'User',
            required : true
        },
        jti : {
            type : String,
            required : true,
            unique : true
        },
        refreshTokenHash : {
            type : String,
            required : true
        },
        expiresTime : {
            type : String,
            required : true
        },
        device : {
            type : String,
            required : false,
            allowNull : true
        }
    },
    {
        timestamps : true,
    }
).index(
    { userId: 1, device: 1 },
    { unique: true }
)