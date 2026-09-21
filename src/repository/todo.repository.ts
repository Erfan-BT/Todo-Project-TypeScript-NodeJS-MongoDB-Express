import { ClientSession, Types } from "mongoose"
import { Todo } from "../models/index.js"
import { ITodo } from "../models/todo.model.js"
import { CreateTodoDto } from "../validations/todo.validation.js"
import { TodoStatus } from "../types/todo.enum.js"
import { UserTodosState } from "../types/todo.type.js"

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

    async userTodosState (userId : Types.ObjectId)
    : Promise<UserTodosState> {
        const now = new Date()

        const startOfToday = new Date(now)
        startOfToday.setHours(0, 0, 0, 0)

        const startOfTomorrow = new Date(startOfToday)
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)

        const [
            active,
            deleted,
            pending,
            completed,
            canceled,
            upcoming,
            overdue,
            today
        ] = await Promise.all([
            Todo.countDocuments({userId, deletedAt : null}),

            Todo.countDocuments({userId, deletedAt : { $ne : null }}),

            Todo.countDocuments({userId, status : TodoStatus.PENDING, deletedAt : null}),

            Todo.countDocuments({userId, status : TodoStatus.COMPLETED, deletedAt : null}),

            Todo.countDocuments({userId, status : TodoStatus.CANCELED, deletedAt : null}),

            Todo.countDocuments({userId, dueDate : { $gte : now }, deletedAt : null}),

            Todo.countDocuments({userId, dueDate : { $lt : now }, status : TodoStatus.PENDING, deletedAt : null}),

            Todo.countDocuments({userId, createdAt : { $gte : startOfToday, $lt : startOfTomorrow }}),
        ])

        return {
            active,
            deleted,
            pending,
            completed,
            canceled,
            upcoming,
            overdue,
            today
        }
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

    async changeAdminTodo (todoId : Types.ObjectId, data : Partial<Pick<ITodo, 'title' | 'description' | 'priority' | 'dueDate'>>, session : ClientSession)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
        }, {
            $set : {
                ...data
            }
        }, {
            session
        })

        return result.modifiedCount === 1
    }

    async changeAdminTodoStatus (todoId : Types.ObjectId, currentStatus : TodoStatus, newStatus : TodoStatus, session : ClientSession)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
            status : currentStatus,
            deletedAt : null
        }, {
            $set : {
                status : newStatus
            }
        }, {
            session
        })

        return result.modifiedCount === 1
    }

    async deleteAdminSoftTodo (todoId : Types.ObjectId, session : ClientSession)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
            deletedAt : null
        }, {
            $set : {
                deletedAt : new Date(),
            }
        }, {
            session
        })

        return result.modifiedCount === 1
    }

    async deleteAdminHardTodo (todoId : Types.ObjectId, session : ClientSession)
    : Promise<boolean> {
        const result = await Todo.deleteOne({
            _id : todoId,
            deletedAt : { $ne : null }
        }, {
            session
        })

        return result.deletedCount === 1
    }
    
    async restoreAdminTodo (todoId : Types.ObjectId, session : ClientSession)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
            deletedAt : {
                $ne : null
            }
        }, {
            $set : {
                deletedAt : null
            }
        }, {
            session
        })

        return result.modifiedCount === 1
    }
}

export default new TodoRepository()