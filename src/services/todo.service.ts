import { Types } from "mongoose";
import { ChangeTodoDto, CreateTodoDto, TodoQSDto } from "../validations/todo.validation.js";
import { TodoQueryBuilder } from "../builders/todo.query.builder.js";
import todoRepository from "../repository/todo.repository.js";
import { ITodo } from "../models/todo.model.js";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/appError.js";
import { TodoStatus } from "../types/todo.enum.js";

class TodoService {
    async getUserTodos (qs : TodoQSDto, userId : Types.ObjectId)
    : Promise<ITodo[]> {
        // Create Options
        const options = TodoQueryBuilder.build(qs)

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

    async restoreTodo (userId : Types.ObjectId, todoId : Types.ObjectId)
    : Promise<ITodo> {
        // Get Todo
        const todo = await todoRepository.getUserTodo(userId, todoId)
        if (!todo)
            throw new NotFoundError(`Todo Not Found { ID : ${todoId} }`)

        // Todo Not Deleted
        if (todo.deletedAt === null)
            return todo

        // Restore Deleted Todo
        if (!await todoRepository.restoreTodo(todoId, userId))
            throw new ConflictError('Todo Can Not Restored')

        todo.deletedAt = null
        return todo
    }

    async changeTodo (userId : Types.ObjectId, todoId : Types.ObjectId, todoData : ChangeTodoDto)
    : Promise<ChangeTodoDto> {
        // Get Todo
        const todo = await todoRepository.getUserTodo(userId, todoId)
        if (!todo)
            throw new NotFoundError(`Todo Not Found { ID : ${todoId} }`)

        if (todo.deletedAt !== null)
            throw new BadRequestError('Can Not Change Deleted Todo')

        // Create Data
        const data : Partial<Pick<ITodo, 'title' | 'description' | 'priority' | 'dueDate'>> = {}

        if (todoData.title !== undefined && todoData.title !== todo.title)
            data.title = todoData.title

        if (todoData.description !== undefined && todoData.description !== todo.description)
            data.description = todoData.description

        if (todoData.priority !== undefined && todoData.priority !== todo.priority)
            data.priority = todoData.priority

        if (todoData.dueDate !== undefined && todoData.dueDate.getTime() !== todo.dueDate.getTime())
            data.dueDate = todoData.dueDate

        if (!Object.keys(data).length)
            return data

        // Change Todo
        if (!await todoRepository.changeTodo(todoId, userId, data))
            throw new ConflictError('Todo Data Not Changed')

        return data
    }

    async changeTodoStatus (userId : Types.ObjectId, todoId : Types.ObjectId, status : TodoStatus)
    : Promise<TodoStatus> {
        // Get Todo
        const todo = await todoRepository.getUserTodo(userId, todoId)
        if (!todo)
            throw new NotFoundError(`Todo Not Found { ID : ${todoId} }`)

        if (todo.deletedAt !== null)
            throw new BadRequestError('Can Not Change Deleted Todo')

        // Change Todo Status
        if (todo.status !== status)
            if (!await todoRepository.changeTodoStatus(todoId, userId, todo.status, status))
                throw new ConflictError('Todo Status Not Changed')

        return status
    }

    async deleteTodo (userId : Types.ObjectId, todoId : Types.ObjectId)
    : Promise<void> {
        // Get Todo
        const todo = await todoRepository.getUserTodo(userId, todoId)
        if (!todo)
            throw new NotFoundError(`Todo Not Found { ID : ${todoId} }`)

        // Delete Todo (Soft)
        if (!await todoRepository.deleteTodo(todoId, userId))
            throw new ConflictError('Todo Not Deleted')

        return
    }

    async clearUserTodos (userId : Types.ObjectId,)
    : Promise<void> {
        // Delete Todos (Soft)
        if (!await todoRepository.clearUserTodos(userId))
            throw new ConflictError('User Todos Not Deleted')

        return
    }
}

export default new TodoService()