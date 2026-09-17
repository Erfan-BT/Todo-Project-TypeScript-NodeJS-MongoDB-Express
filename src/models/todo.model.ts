import { Schema, Types } from "mongoose";

export interface ITodo {
    _id : Types.ObjectId;
    title : string;
    description : string;
    userId : Types.ObjectId;
    status : 'Pending' | 'Completed' | 'Canceled';
    priority : number;
    dueDate : Date | null;
    createdAt : Date;
    updatedAt : Date;
    deletedAt : Date | null;
}

export const todoSchema = new Schema<ITodo>(
    {
        title : {
            type : String,
            required : true
        },
        description : {
            type : String,
            required : true
        },
        userId : {
            type : Schema.Types.ObjectId,
            required : true,
            ref : 'User'
        },
        status : {
            type : String,
            enum : ['Pending', 'Complated', 'Canceled'],
            required : false,
            default : "Pending"
        },
        priority : {
            type : Number,
            required : true,
            min : 1,
            max : 10
        },
        dueDate : {
            type : Date,
            required : false,
            default : null
        },
        deletedAt : {
            type : Date,
            required : false,
            default : null
        }
    },
    {
        timestamps : true
    }
)