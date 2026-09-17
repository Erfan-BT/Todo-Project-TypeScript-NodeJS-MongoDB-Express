import { Types } from "mongoose";
import { TodoQSDto } from "../validations/todo.validation.js";
import { TodoQuaryBuilder } from "../builders/todo.quary.builder.js";
import todoRepository from "../repository/todo.repository.js";
import { ITodo } from "../models/todo.model.js";

class TodoService {
    async getUserTodos (qs : TodoQSDto, userId : Types.ObjectId)
    : Promise<ITodo[]> {
        // Create Options
        const options = TodoQuaryBuilder.build(qs)

        // Get Tdods
        return await todoRepository.getUserTodos(userId, options.limit, options.skip, options.where, options.sort)
    }
}

export default new TodoService()