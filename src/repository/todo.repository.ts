import { Types } from "mongoose"
import { Todo } from "../models/index.js"
import { ITodo } from "../models/todo.model.js"

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
}

export default new TodoRepository()