import { Types } from 'mongoose'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import todoAdminService from '../../../src/services/admin/todo.admin.service.js'
import todoRepository from '../../../src/repository/todo.repository.js'
import authRepository from '../../../src/repository/auth.repository.js'
import { TodoQuaryBuilder } from '../../../src/builders/todo.quary.builder.js'

import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError
} from '../../../src/utils/appError.js'

import { TodoStatus } from '../../../src/types/todo.enum.js'
import { ITodo } from '../../../src/models/todo.model.js'
import { IUser } from '../../../src/models/user.model.js'

vi.mock('../../../src/repository/todo.repository.js', () => ({
    default: {
        getAdminUserTodos: vi.fn(),
        getAdminTodo: vi.fn(),
        changeAdminTodo: vi.fn(),
        changeAdminTodoStatus: vi.fn(),
        deleteAdminSoftTodo: vi.fn(),
        restoreAdminTodo: vi.fn(),
        deleteAdminHardTodo: vi.fn()
    }
}))

vi.mock('../../../src/repository/auth.repository.js', () => ({
    default: {
        getAdminUserByUsername: vi.fn(),
        getAdminUserById: vi.fn()
    }
}))

vi.mock('../../../src/builders/todo.quary.builder.js', () => ({
    TodoQuaryBuilder: {
        build: vi.fn()
    }
}))

const todoId = new Types.ObjectId()
const userId = new Types.ObjectId()

const anotherUserId = new Types.ObjectId()

const createTodo = (
    overrides: Partial<ITodo> = {}
): ITodo => ({
    _id: todoId,
    title: 'Test Todo',
    description: 'Test Description',
    userId,
    status: TodoStatus.PENDING,
    priority: 3,
    dueDate: new Date('2026-12-20T10:00:00.000Z'),
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    deletedAt: null,
    ...overrides
})

const createUser = (
    overrides: Partial<IUser> = {}
): IUser => ({
    _id: userId,
    fullname: 'Test User',
    username: 'testuser',
    password: 'hashed-password',
    role: 'User',
    active: true,
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-01T10:00:00.000Z'),
    deletedAt: null,
    ...overrides
})

describe('TodoAdminService', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getAllTodos', () => {

        it('should return all todos without username filter', async () => {

            const qs = {
                page: 1,
                limit: 30,
                username: undefined
            } as any

            const options = {
                limit: 30,
                skip: 0,
                where: {
                    $and: []
                },
                sort: { createdAt: -1, _id: -1 }
            }

            const todos = [
                createTodo(),
                createTodo({
                    _id: new Types.ObjectId(),
                    title: 'Second Todo'
                })
            ]

            vi.mocked(TodoQuaryBuilder.build)
                .mockReturnValue(options)

            vi.mocked(todoRepository.getAdminUserTodos)
                .mockResolvedValue(todos)

            const result = await todoAdminService.getAllTodos(qs)

            expect(TodoQuaryBuilder.build)
                .toHaveBeenCalledWith(qs)

            expect(authRepository.getAdminUserByUsername)
                .not.toHaveBeenCalled()

            expect(todoRepository.getAdminUserTodos)
                .toHaveBeenCalledWith(
                    null,
                    30,
                    0,
                    { $and : [] },
                    { createdAt: -1, _id: -1 }
                )

            expect(result).toEqual(todos)
        })


        it('should get user by username and return that user todos', async () => {

            const qs = {
                page: 2,
                limit: 10,
                username: 'testuser'
            } as any

            const options = {
                limit: 10,
                skip: 10,
                where: {
                    $and: [
                        {
                            status: TodoStatus.PENDING
                        }
                    ]
                },
                sort: { priority: -1, _id: -1 }
            }

            const user = createUser()

            const todos = [
                createTodo()
            ]

            vi.mocked(TodoQuaryBuilder.build)
                .mockReturnValue(options)

            vi.mocked(authRepository.getAdminUserByUsername)
                .mockResolvedValue(user)

            vi.mocked(todoRepository.getAdminUserTodos)
                .mockResolvedValue(todos)

            const result = await todoAdminService.getAllTodos(qs)

            expect(TodoQuaryBuilder.build)
                .toHaveBeenCalledWith(qs)

            expect(authRepository.getAdminUserByUsername)
                .toHaveBeenCalledWith('testuser')

            expect(todoRepository.getAdminUserTodos)
                .toHaveBeenCalledWith(
                    user._id,
                    10,
                    10,
                    {
                        $and: [
                            {
                                status: TodoStatus.PENDING
                            }
                        ]
                    },
                    { priority: -1, _id: -1 }
                )

            expect(result).toEqual(todos)
        })


        it('should throw NotFoundError when username does not exist', async () => {

            const qs = {
                page: 1,
                limit: 30,
                username: 'unknown'
            } as any

            const options = {
                limit: 30,
                skip: 0,
                where: { $and : [] },
                sort: { createdAt: -1, _id: -1 }
            }

            vi.mocked(TodoQuaryBuilder.build)
                .mockReturnValue(options)

            vi.mocked(authRepository.getAdminUserByUsername)
                .mockResolvedValue(null)

            await expect(
                todoAdminService.getAllTodos(qs)
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.getAdminUserTodos)
                .not.toHaveBeenCalled()
        })


        it('should propagate repository error', async () => {

            const qs = {
                page: 1,
                limit: 30,
                username: undefined
            } as any

            const options = {
                limit: 30,
                skip: 0,
                where: { $and : [] },
                sort: { createdAt: -1, _id: -1 }
            }

            const error = new Error('Database Error')

            vi.mocked(TodoQuaryBuilder.build)
                .mockReturnValue(options)

            vi.mocked(todoRepository.getAdminUserTodos)
                .mockRejectedValue(error)

            await expect(
                todoAdminService.getAllTodos(qs)
            ).rejects.toBe(error)
        })
    })

    describe('getTodo', () => {

        it('should return todo and its user', async () => {

            const todo = createTodo()
            const user = createUser()

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(user)

            const result = await todoAdminService.getTodo(todoId)

            expect(todoRepository.getAdminTodo)
                .toHaveBeenCalledWith(todoId)

            expect(authRepository.getAdminUserById)
                .toHaveBeenCalledWith(todo.userId)

            expect(result).toEqual({
                todo,
                user
            })
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(null)

            await expect(
                todoAdminService.getTodo(todoId)
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(authRepository.getAdminUserById)
                .not.toHaveBeenCalled()
        })


        it('should throw NotFoundError when todo user does not exist', async () => {

            const todo = createTodo()

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)

            await expect(
                todoAdminService.getTodo(todoId)
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(authRepository.getAdminUserById)
                .toHaveBeenCalledWith(todo.userId)
        })


        it('should propagate repository error', async () => {

            const error = new Error('Database Error')

            vi.mocked(todoRepository.getAdminTodo)
                .mockRejectedValue(error)

            await expect(
                todoAdminService.getTodo(todoId)
            ).rejects.toBe(error)
        })
    })

    describe('changeTodo', () => {

        it('should change all changed fields', async () => {

            const oldDueDate = new Date('2026-12-20T10:00:00.000Z')
            const newDueDate = new Date('2027-01-20T10:00:00.000Z')

            const todo = createTodo({
                dueDate: oldDueDate
            })

            const todoData = {
                title: 'New Title',
                description: 'New Description',
                priority: 5,
                dueDate: newDueDate
            } as any

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodo)
                .mockResolvedValue(true)

            const result = await todoAdminService.changeTodo(
                todoId,
                todoData
            )

            expect(todoRepository.changeAdminTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    {
                        title: 'New Title',
                        description: 'New Description',
                        priority: 5,
                        dueDate: newDueDate
                    }
                )

            expect(result).toEqual({
                title: 'New Title',
                description: 'New Description',
                priority: 5,
                dueDate: newDueDate
            })
        })


        it('should change only fullname-equivalent todo field: title', async () => {

            const todo = createTodo()

            const todoData = {
                title: 'New Title'
            } as any

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodo)
                .mockResolvedValue(true)

            const result = await todoAdminService.changeTodo(
                todoId,
                todoData
            )

            expect(todoRepository.changeAdminTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    {
                        title: 'New Title'
                    }
                )

            expect(result).toEqual({
                title: 'New Title'
            })
        })


        it('should change only description', async () => {

            const todo = createTodo()

            const todoData = {
                description: 'New Description'
            } as any

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodo)
                .mockResolvedValue(true)

            const result = await todoAdminService.changeTodo(
                todoId,
                todoData
            )

            expect(todoRepository.changeAdminTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    {
                        description: 'New Description'
                    }
                )

            expect(result).toEqual({
                description: 'New Description'
            })
        })


        it('should change only priority', async () => {

            const todo = createTodo({
                priority: 3
            })

            const todoData = {
                priority: 5
            } as any

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodo)
                .mockResolvedValue(true)

            const result = await todoAdminService.changeTodo(
                todoId,
                todoData
            )

            expect(todoRepository.changeAdminTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    {
                        priority: 5
                    }
                )

            expect(result).toEqual({
                priority: 5
            })
        })


        it('should change only dueDate', async () => {

            const oldDueDate = new Date('2026-12-20T10:00:00.000Z')
            const newDueDate = new Date('2027-01-20T10:00:00.000Z')

            const todo = createTodo({
                dueDate: oldDueDate
            })

            const todoData = {
                dueDate: newDueDate
            } as any

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodo)
                .mockResolvedValue(true)

            const result = await todoAdminService.changeTodo(
                todoId,
                todoData
            )

            expect(todoRepository.changeAdminTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    {
                        dueDate: newDueDate
                    }
                )

            expect(result).toEqual({
                dueDate: newDueDate
            })
        })


        it('should not update when no field has changed', async () => {

            const todo = createTodo({
                title: 'Test Todo',
                description: 'Test Description',
                priority: 3,
                dueDate: new Date('2026-12-20T10:00:00.000Z')
            })

            const todoData = {
                title: 'Test Todo',
                description: 'Test Description',
                priority: 3,
                dueDate: new Date('2026-12-20T10:00:00.000Z')
            } as any

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            const result = await todoAdminService.changeTodo(
                todoId,
                todoData
            )

            expect(todoRepository.changeAdminTodo)
                .not.toHaveBeenCalled()

            expect(result).toEqual({})
        })


        it('should allow changing a soft-deleted todo', async () => {

            const todo = createTodo({
                deletedAt: new Date('2026-09-01T10:00:00.000Z')
            })

            const todoData = {
                title: 'Changed Deleted Todo'
            } as any

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodo)
                .mockResolvedValue(true)

            const result = await todoAdminService.changeTodo(
                todoId,
                todoData
            )

            expect(todoRepository.changeAdminTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    {
                        title: 'Changed Deleted Todo'
                    }
                )

            expect(result).toEqual({
                title: 'Changed Deleted Todo'
            })
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(null)

            await expect(
                todoAdminService.changeTodo(
                    todoId,
                    {
                        title: 'New Title'
                    } as any
                )
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.changeAdminTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when repository update fails', async () => {

            const todo = createTodo()

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodo)
                .mockResolvedValue(false)

            await expect(
                todoAdminService.changeTodo(
                    todoId,
                    {
                        title: 'New Title'
                    } as any
                )
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('changeTodoStatus', () => {

        it('should change status from PENDING to COMPLETED', async () => {

            const todo = createTodo({
                status: TodoStatus.PENDING
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodoStatus)
                .mockResolvedValue(true)

            const result = await todoAdminService.changeTodoStatus(
                todoId,
                TodoStatus.COMPLETED
            )

            expect(todoRepository.changeAdminTodoStatus)
                .toHaveBeenCalledWith(
                    todoId,
                    TodoStatus.PENDING,
                    TodoStatus.COMPLETED
                )

            expect(result)
                .toBe(TodoStatus.COMPLETED)
        })


        it('should change status from COMPLETED to PENDING', async () => {

            const todo = createTodo({
                status: TodoStatus.COMPLETED
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodoStatus)
                .mockResolvedValue(true)

            const result = await todoAdminService.changeTodoStatus(
                todoId,
                TodoStatus.PENDING
            )

            expect(todoRepository.changeAdminTodoStatus)
                .toHaveBeenCalledWith(
                    todoId,
                    TodoStatus.COMPLETED,
                    TodoStatus.PENDING
                )

            expect(result)
                .toBe(TodoStatus.PENDING)
        })


        it('should not update when status is already the same', async () => {

            const todo = createTodo({
                status: TodoStatus.PENDING
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            const result = await todoAdminService.changeTodoStatus(
                todoId,
                TodoStatus.PENDING
            )

            expect(todoRepository.changeAdminTodoStatus)
                .not.toHaveBeenCalled()

            expect(result)
                .toBe(TodoStatus.PENDING)
        })


        it('should throw BadRequestError when todo is deleted', async () => {

            const todo = createTodo({
                deletedAt: new Date('2026-09-01T10:00:00.000Z')
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            await expect(
                todoAdminService.changeTodoStatus(
                    todoId,
                    TodoStatus.COMPLETED
                )
            ).rejects.toBeInstanceOf(BadRequestError)

            expect(todoRepository.changeAdminTodoStatus)
                .not.toHaveBeenCalled()
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(null)

            await expect(
                todoAdminService.changeTodoStatus(
                    todoId,
                    TodoStatus.COMPLETED
                )
            ).rejects.toBeInstanceOf(NotFoundError)
        })


        it('should throw ConflictError when repository update fails', async () => {

            const todo = createTodo({
                status: TodoStatus.PENDING
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodoStatus)
                .mockResolvedValue(false)

            await expect(
                todoAdminService.changeTodoStatus(
                    todoId,
                    TodoStatus.COMPLETED
                )
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('deleteSoftTodo', () => {

        it('should soft delete an active todo', async () => {

            const todo = createTodo({
                deletedAt: null
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.deleteAdminSoftTodo)
                .mockResolvedValue(true)

            await expect(
                todoAdminService.deleteSoftTodo(todoId)
            ).resolves.toBeUndefined()

            expect(todoRepository.deleteAdminSoftTodo)
                .toHaveBeenCalledWith(todoId)
        })


        it('should do nothing when todo is already deleted', async () => {

            const todo = createTodo({
                deletedAt: new Date('2026-09-01T10:00:00.000Z')
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            await todoAdminService.deleteSoftTodo(todoId)

            expect(todoRepository.deleteAdminSoftTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(null)

            await expect(
                todoAdminService.deleteSoftTodo(todoId)
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.deleteAdminSoftTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when soft delete fails', async () => {

            const todo = createTodo({
                deletedAt: null
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.deleteAdminSoftTodo)
                .mockResolvedValue(false)

            await expect(
                todoAdminService.deleteSoftTodo(todoId)
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('restoreTodo', () => {

        it('should restore a deleted todo', async () => {

            const deletedAt = new Date('2026-09-01T10:00:00.000Z')

            const todo = createTodo({
                deletedAt
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.restoreAdminTodo)
                .mockResolvedValue(true)

            const result = await todoAdminService.restoreTodo(todoId)

            expect(todoRepository.restoreAdminTodo)
                .toHaveBeenCalledWith(todoId)

            expect(result.deletedAt)
                .toBeNull()
        })


        it('should do nothing when todo is already active', async () => {

            const todo = createTodo({
                deletedAt: null
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            const result = await todoAdminService.restoreTodo(todoId)

            expect(todoRepository.restoreAdminTodo)
                .not.toHaveBeenCalled()

            expect(result)
                .toBe(todo)
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(null)

            await expect(
                todoAdminService.restoreTodo(todoId)
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.restoreAdminTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when restore fails', async () => {

            const todo = createTodo({
                deletedAt: new Date('2026-09-01T10:00:00.000Z')
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.restoreAdminTodo)
                .mockResolvedValue(false)

            await expect(
                todoAdminService.restoreTodo(todoId)
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('deleteHardTodo', () => {

        it('should hard delete a soft-deleted todo', async () => {

            const todo = createTodo({
                deletedAt: new Date('2026-09-01T10:00:00.000Z')
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.deleteAdminHardTodo)
                .mockResolvedValue(true)

            await expect(
                todoAdminService.deleteHardTodo(todoId)
            ).resolves.toBeUndefined()

            expect(todoRepository.deleteAdminHardTodo)
                .toHaveBeenCalledWith(todoId)
        })


        it('should throw ForbiddenError when todo is not soft-deleted', async () => {

            const todo = createTodo({
                deletedAt: null
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            await expect(
                todoAdminService.deleteHardTodo(todoId)
            ).rejects.toBeInstanceOf(ForbiddenError)

            expect(todoRepository.deleteAdminHardTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(null)

            await expect(
                todoAdminService.deleteHardTodo(todoId)
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.deleteAdminHardTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when hard delete fails', async () => {

            const todo = createTodo({
                deletedAt: new Date('2026-09-01T10:00:00.000Z')
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.deleteAdminHardTodo)
                .mockResolvedValue(false)

            await expect(
                todoAdminService.deleteHardTodo(todoId)
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })
})