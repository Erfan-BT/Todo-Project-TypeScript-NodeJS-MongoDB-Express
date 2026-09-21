import mongoose, { Types } from "mongoose";
import { TodoQuaryBuilder } from "../../builders/todo.quary.builder.js";
import { ITodo } from "../../models/todo.model.js";
import todoRepository from "../../repository/todo.repository.js";
import { ChangeTodoDto, TodoQSDto } from "../../validations/todo.validation.js";
import authRepository from "../../repository/auth.repository.js";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../../utils/appError.js";
import { IUser } from "../../models/user.model.js";
import { TodoStatus } from "../../types/todo.enum.js";
import auditRepository from "../../repository/audit.repository.js";
import { AuditAction, AuditEntityType } from "../../types/audit.enum.js";

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

    async getTodo (todoId : Types.ObjectId)
    : Promise<{
        todo : ITodo;
        user : IUser;
    }> {
        // Get Todo
        const todo = await todoRepository.getAdminTodo(todoId)
        if (!todo)
            throw new NotFoundError(`Todo Not Found { ID : ${todoId} }`)

        // Get Todo User
        const user = await authRepository.getAdminUserById(todo.userId)
        if (!user)
            throw new NotFoundError(`User Not Found { ID : ${todo.userId} }`)

        return {
            todo,
            user
        }
    }

    async changeTodo (todoId : Types.ObjectId, todoData : ChangeTodoDto, adminId : Types.ObjectId, ipAddress : string)
    : Promise<ChangeTodoDto> {
        // Get Todo
        const todo = await todoRepository.getAdminTodo(todoId)
        if (!todo)
            throw new NotFoundError(`Todo Not Found { ID : ${todoId} }`)

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

        const session = await mongoose.startSession()

        try {
            await session.withTransaction(async () => {
                // Change Todo
                if (!await todoRepository.changeAdminTodo(todoId, data, session))
                    throw new ConflictError('Todo Not Changed')
    
                // Add Admin Audit
                await auditRepository.createAudit({
                    adminId,
                    action : AuditAction.CHANGE,
                    entityType : AuditEntityType.TODO,
                    entityId : todoId,
                    oldValue : {
                        title : todo.title,
                        description : todo.description,
                        priority : todo.priority,
                        dueDate : todo.dueDate,
                    },
                    newValue : data,
                    ipAddress
                }, session)
            })
        } finally {
            await session.endSession()
        }

        return data
    }

    async changeTodoStatus (todoId : Types.ObjectId, status : TodoStatus, adminId : Types.ObjectId, ipAddress : string)
    : Promise<TodoStatus> {
        // Get Todo
        const todo = await todoRepository.getAdminTodo(todoId)
        if (!todo)
            throw new NotFoundError(`Todo Not Found { ID : ${todoId} }`)

        if (todo.deletedAt !== null)
            throw new BadRequestError('Can Not Change Deleted Todo')

        if (todo.status === status)
            return status

        const session = await mongoose.startSession()

        try {
            await session.withTransaction(async () => {
                // Change Todo Status
                if (!await todoRepository.changeAdminTodoStatus(todoId, todo.status, status, session))
                    throw new ConflictError('Todo Status Not Changed')
    
                // Add Admin Audit
                await auditRepository.createAudit({
                    adminId,
                    action : AuditAction.CHANGE,
                    entityType : AuditEntityType.TODO,
                    entityId : todoId,
                    oldValue : {
                        status : todo.status
                    },
                    newValue : {
                        status
                    },
                    ipAddress
                }, session)
            })
        } finally {
            await session.endSession()
        }

        return status
    }

    async deleteSoftTodo (todoId : Types.ObjectId, adminId : Types.ObjectId, reason : string, ipAddress : string)
    : Promise<void> {
        // Get Todo
        const todo = await todoRepository.getAdminTodo(todoId)
        if (!todo)
            throw new NotFoundError(`Todo Not Found { ID : ${todoId} }`)

        if (todo.deletedAt !== null)
            return

        const session = await mongoose.startSession()

        try {
            await session.withTransaction(async () => {
                // Delete Todo
                if (!await todoRepository.deleteAdminSoftTodo(todoId, session))
                    throw new ConflictError('Todo Not Deleted')

                // Add Admin Audit
                await auditRepository.createAudit({
                    adminId,
                    action : AuditAction.DELETE,
                    entityType : AuditEntityType.TODO,
                    entityId : todoId,
                    reason,
                    ipAddress
                }, session)
            })
        } finally {
            await session.endSession()
        }

        return
    }

    async restoreTodo (todoId : Types.ObjectId, adminId : Types.ObjectId, reason : string, ipAddress : string)
    : Promise<ITodo> {
        // Get Todo
        const todo = await todoRepository.getAdminTodo(todoId)
        if (!todo)
            throw new NotFoundError(`Todo Not Found { ID : ${todoId} }`)

        if (todo.deletedAt === null)
            return todo

        const session = await mongoose.startSession()

        try {
            await session.withTransaction(async () => {
                // Restore Todo
                if (!await todoRepository.restoreAdminTodo(todoId, session))
                    throw new ConflictError('Todo Not Restored')

                // Add Admin Audit
                await auditRepository.createAudit({
                    adminId,
                    action : AuditAction.RESTORE,
                    entityType : AuditEntityType.TODO,
                    entityId : todoId,
                    reason,
                    ipAddress
                }, session)
            })
        } finally {
            await session.endSession()
        }

        todo.deletedAt = null
        return todo
    }

    async deleteHardTodo (todoId : Types.ObjectId, adminId : Types.ObjectId, reason : string, ipAddress : string)
    : Promise<void> {
        // Get Todo
        const todo = await todoRepository.getAdminTodo(todoId)
        if (!todo)
            throw new NotFoundError(`Todo Not Found { ID : ${todoId} }`)

        if (todo.deletedAt === null)
            throw new ForbiddenError('Soft Deleted Required First')

        const session = await mongoose.startSession()

        try {
            await session.withTransaction(async () => {
                // Delete Todo (Hard)
                if (!await todoRepository.deleteAdminHardTodo(todoId, session))
                    throw new ConflictError('Todo Not Deleted')

                // Add Admin Audit
                await auditRepository.createAudit({
                    adminId,
                    action : AuditAction.DELETE_HARD,
                    entityType : AuditEntityType.TODO,
                    entityId : todoId,
                    reason,
                    ipAddress
                }, session)

            })
        } finally {
            await session.endSession()
        }
        
        return
    }
}

export default new TodoAdminService()