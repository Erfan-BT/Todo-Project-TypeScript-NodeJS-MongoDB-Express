import { Types } from "mongoose"
import { Todo } from "../models/index.js"
import { ITodo } from "../models/todo.model.js"
import { CreateTodoDto } from "../validations/todo.validation.js"
import { TodoStatus } from "../types/todo.enum.js"

class TodoRepository {
    async getUserTodos (userId : Types.ObjectId, limit : number, skip : number, where : any, sort : any)
    : Promise<ITodo[]> {
        return Todo
            .find({
                userId,
                ...where
            })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean()
    }

    async getUserTodo (userId : Types.ObjectId, todoId : Types.ObjectId)
    : Promise<ITodo | null> {
        return Todo.findOne({
            userId,
            _id : todoId,
        })
        .lean()
    }

    async createTodo (userId : Types.ObjectId, todoData : CreateTodoDto)
    : Promise<ITodo> {
        return await Todo.create({
            userId,
            ...todoData
        })
    }

    async changeTodo (todoId : Types.ObjectId, userId : Types.ObjectId, data : Partial<Pick<ITodo, 'title' | 'description' | 'priority' | 'dueDate'>>)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
            userId,
            deletedAt : null
        }, {
            $set : {
                ...data
            }
        })

        return result.modifiedCount === 1
    }

    async changeTodoStatus (todoId : Types.ObjectId, userId : Types.ObjectId, currentStatus : TodoStatus, newStatus : TodoStatus)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
            userId,
            deletedAt : null,
            status : currentStatus
        }, {
            $set : {
                status : newStatus
            }
        })

        return result.modifiedCount === 1
    }

    async deleteTodo (todoId : Types.ObjectId, userId : Types.ObjectId)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
            userId,
            deletedAt : null
        }, {
            $set : {
                deletedAt : new Date()
            }
        })

        return result.modifiedCount === 1
    }

    async restoreTodo (todoId : Types.ObjectId, userId : Types.ObjectId)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
            userId,
            deletedAt : {
                $ne : null
            }
        }, {
            $set : {
                deletedAt : null
            }
        })

        return result.modifiedCount === 1
    }
    
    async clearUserTodos (userId : Types.ObjectId)
    : Promise<boolean> {
        const result = await Todo.updateMany({
            userId,
            deletedAt : null
        }, {
            $set : {
                deletedAt : new Date()
            }
        })

        return result.modifiedCount > 0
    }

    // ----- Admin -----
    async getAdminUserTodos (userId : Types.ObjectId | null, limit : number, skip : number, where : any, sort : any)
    : Promise<ITodo[]> {
        return Todo
            .find({
                ...(userId !== null ? {userId} : {}),
                ...where
            })
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean()
    }
    
    async getAdminTodo (todoId : Types.ObjectId)
    : Promise<ITodo | null> {
        return Todo.findOne({
            _id : todoId
        })
        .lean()
    }

    async changeAdminTodo (todoId : Types.ObjectId, data : Partial<Pick<ITodo, 'title' | 'description' | 'priority' | 'dueDate'>>)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
        }, {
            $set : {
                ...data
            }
        })

        return result.modifiedCount === 1
    }

    async changeAdminTodoStatus (todoId : Types.ObjectId, currentStatus : TodoStatus, newStatus : TodoStatus)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
            status : currentStatus,
            deletedAt : null
        }, {
            $set : {
                status : newStatus
            }
        })

        return result.modifiedCount === 1
    }

    async deleteAdminSoftTodo (todoId : Types.ObjectId)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
            deletedAt : null
        }, {
            $set : {
                deletedAt : new Date(),
            }
        })

        return result.modifiedCount === 1
    }
}

export default new TodoRepository()