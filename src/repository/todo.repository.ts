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
}

export default new TodoRepository()