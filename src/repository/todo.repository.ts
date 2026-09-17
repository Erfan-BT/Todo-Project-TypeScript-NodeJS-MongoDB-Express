import { Types } from "mongoose"
import { Todo } from "../models/index.js"
import { ITodo } from "../models/todo.model.js"
import { CreateTodoDto } from "../validations/todo.validation.js"

class TodoRepository {
    async getUserTodos (userId : Types.ObjectId, limit : number, skip : number, where : any, sort : any)
    : Promise<ITodo[]> {
        return Todo
            .find(
                userId,
                ...where
            )
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

    async changeTodo (todoId : Types.ObjectId, userId : Types.ObjectId, data : Partial<Pick<ITodo, 'title' | 'description' | 'priority'>>)
    : Promise<boolean> {
        const result = await Todo.updateOne({
            _id : todoId,
            userId,
            deletedAt : null
        }, data)

        return result.modifiedCount === 1
    }
}

export default new TodoRepository()