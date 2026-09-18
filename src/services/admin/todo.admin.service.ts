import { Types } from "mongoose";
import { TodoQuaryBuilder } from "../../builders/todo.quary.builder.js";
import { ITodo } from "../../models/todo.model.js";
import todoRepository from "../../repository/todo.repository.js";
import { TodoQSDto } from "../../validations/todo.validation.js";
import authRepository from "../../repository/auth.repository.js";
import { NotFoundError } from "../../utils/appError.js";

class TodoAdminService {
    async getAllTodos (qs : TodoQSDto)
    : Promise<ITodo[]> {
        // Create Options
        const options = TodoQuaryBuilder.build(qs)
        
        let userId : Types.ObjectId | null = null
        if (qs.username !== undefined) {
            const user = await authRepository.getAdminUserByUsername(qs.username)
            if (!user)
                throw new NotFoundError(`User Not Found { Username : ${qs.username} }`)

            userId = user._id
        }

        // Get Todos
        return await todoRepository.getAdminUserTodos(userId, options.limit, options.skip, options.where, options.sort)
    }
}

export default new TodoAdminService()