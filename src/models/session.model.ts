import { Schema } from "mongoose";

export interface ISession {
    _id : Number;
    userId : Number;
    jti : string;
    refreshTokenHash : string;
    expiresTime : string;
    revokedAt : Date | null;
    createdAt : Date;
    updatedAt : Date | null;
    device : string;
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
        revokedAt : {
            type : Date,
            default : null,
            allowNull : true
        },
        device : {
            type : String,
            required : true
        }
    },
    {
        timestamps : true,
    }
).index(
    { userId: 1, device: 1 },
    { unique: true }
)