import { Types } from "mongoose";
import { CreateTodoDto, TodoQSDto } from "../validations/todo.validation.js";
import { TodoQuaryBuilder } from "../builders/todo.quary.builder.js";
import todoRepository from "../repository/todo.repository.js";
import { ITodo } from "../models/todo.model.js";
import { NotFoundError } from "../utils/appError.js";

class TodoService {
    async getUserTodos (qs : TodoQSDto, userId : Types.ObjectId)
    : Promise<ITodo[]> {
        // Create Options
        const options = TodoQuaryBuilder.build(qs)

        // Get Tdods
        return await todoRepository.getUserTodos(userId, options.limit, options.skip, options.where, options.sort)
    }

    async getUserTodo (todoId : Types.ObjectId, userId : Types.ObjectId)
    : Promise<ITodo> {
        // Get Todo
        const todo = await todoRepository.getUserTodo(userId, todoId)
        if (!todo)
            throw new NotFoundError(`Todo Not Found { ID : ${todoId} }`)

        return todo
    }

    async createTodo (userId : Types.ObjectId, todoData : CreateTodoDto)
    : Promise<ITodo> {
        // Create Todo
        return await todoRepository.createTodo(userId, todoData)
    }
}

export default new TodoService()