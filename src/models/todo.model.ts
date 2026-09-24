import { Schema, Types } from "mongoose";
import { TodoStatus } from "../types/todo.enum.js";

export interface ITodo {
    _id : Types.ObjectId;
    title : string;
    description : string;
    userId : Types.ObjectId;
    status : TodoStatus;
    priority : number;
    dueDate : Date;
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
            enum : TodoStatus,
            required : false,
            default : TodoStatus.PENDING
        },
        priority : {
            type : Number,
            required : true,
            min : 1,
            max : 10
        },
        dueDate : {
            type : Date,
            required : true,
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

todoSchema.index({
    userId: 1,
    createdAt: -1,
    _id: -1
})

todoSchema.index({
    userId: 1,
    priority: -1,
    _id: -1
})

todoSchema.index({
    userId: 1,
    dueDate: -1,
    _id: -1
})