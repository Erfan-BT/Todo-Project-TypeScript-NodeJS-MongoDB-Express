import mongoose, { Types } from 'mongoose'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import todoAdminService from '../../../src/services/admin/todo.admin.service.js'

import todoRepository from '../../../src/repository/todo.repository.js'
import authRepository from '../../../src/repository/auth.repository.js'
import auditRepository from '../../../src/repository/audit.repository.js'

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


vi.mock('../../../src/repository/audit.repository.js', () => ({
    default: {
        createAudit: vi.fn()
    }
}))


vi.mock('../../../src/builders/todo.quary.builder.js', () => ({
    TodoQuaryBuilder: {
        build: vi.fn()
    }
}))


const todoId = new Types.ObjectId()
const userId = new Types.ObjectId()
const adminId = new Types.ObjectId()

const ipAddress = '127.0.0.1'


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

    let session: {
        withTransaction: ReturnType<typeof vi.fn>
        endSession: ReturnType<typeof vi.fn>
    }


    beforeEach(() => {

        vi.clearAllMocks()

        session = {
            withTransaction: vi.fn(
                async (callback: () => Promise<void>) => {
                    await callback()
                }
            ),

            endSession: vi.fn().mockResolvedValue(undefined)
        }

        vi.spyOn(mongoose, 'startSession')
            .mockResolvedValue(session as any)

        vi.mocked(auditRepository.createAudit)
            .mockResolvedValue(undefined as any)
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
                sort: {
                    createdAt: -1,
                    _id: -1
                }
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

            const result =
                await todoAdminService.getAllTodos(qs)

            expect(TodoQuaryBuilder.build)
                .toHaveBeenCalledWith(qs)

            expect(authRepository.getAdminUserByUsername)
                .not.toHaveBeenCalled()

            expect(todoRepository.getAdminUserTodos)
                .toHaveBeenCalledWith(
                    null,
                    30,
                    0,
                    { $and: [] },
                    {
                        createdAt: -1,
                        _id: -1
                    }
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
                sort: {
                    priority: -1,
                    _id: -1
                }
            }

            const user = createUser()
            const todos = [createTodo()]

            vi.mocked(TodoQuaryBuilder.build)
                .mockReturnValue(options)

            vi.mocked(authRepository.getAdminUserByUsername)
                .mockResolvedValue(user)

            vi.mocked(todoRepository.getAdminUserTodos)
                .mockResolvedValue(todos)

            const result =
                await todoAdminService.getAllTodos(qs)

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
                    {
                        priority: -1,
                        _id: -1
                    }
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
                where: {
                    $and: []
                },
                sort: {
                    createdAt: -1,
                    _id: -1
                }
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
                where: {
                    $and: []
                },
                sort: {
                    createdAt: -1,
                    _id: -1
                }
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

            const result =
                await todoAdminService.getTodo(todoId)

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

        it('should change todo successfully and create audit log', async () => {

            const todo = createTodo()

            const todoData = {
                title: 'New Title',
                description: 'New Description',
                priority: 5,
                dueDate: new Date('2027-01-20T10:00:00.000Z')
            } as any

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodo)
                .mockResolvedValue(true)

            const result =
                await todoAdminService.changeTodo(
                    todoId,
                    todoData,
                    adminId,
                    ipAddress
                )

            expect(mongoose.startSession)
                .toHaveBeenCalledOnce()

            expect(session.withTransaction)
                .toHaveBeenCalledOnce()

            expect(todoRepository.changeAdminTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    {
                        title: 'New Title',
                        description: 'New Description',
                        priority: 5,
                        dueDate: todoData.dueDate
                    },
                    session
                )

            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    {
                        adminId,
                        action: expect.anything(),
                        entityType: expect.anything(),
                        entityId: todoId,

                        oldValue: {
                            title: todo.title,
                            description: todo.description,
                            priority: todo.priority,
                            dueDate: todo.dueDate
                        },

                        newValue: {
                            title: 'New Title',
                            description: 'New Description',
                            priority: 5,
                            dueDate: todoData.dueDate
                        },

                        ipAddress
                    },
                    session
                )

            expect(session.endSession)
                .toHaveBeenCalledOnce()

            expect(result).toEqual({
                title: 'New Title',
                description: 'New Description',
                priority: 5,
                dueDate: todoData.dueDate
            })
        })


        it('should change only changed fields', async () => {

            const todo = createTodo()

            const todoData = {
                title: 'New Title'
            } as any

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodo)
                .mockResolvedValue(true)

            const result =
                await todoAdminService.changeTodo(
                    todoId,
                    todoData,
                    adminId,
                    ipAddress
                )

            expect(todoRepository.changeAdminTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    {
                        title: 'New Title'
                    },
                    session
                )

            expect(result).toEqual({
                title: 'New Title'
            })
        })


        it('should not update when no field has changed', async () => {

            const todo = createTodo()

            const todoData = {
                title: todo.title,
                description: todo.description,
                priority: todo.priority,
                dueDate: new Date(todo.dueDate)
            } as any

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            const result =
                await todoAdminService.changeTodo(
                    todoId,
                    todoData,
                    adminId,
                    ipAddress
                )

            expect(todoRepository.changeAdminTodo)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
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

            const result =
                await todoAdminService.changeTodo(
                    todoId,
                    todoData,
                    adminId,
                    ipAddress
                )

            expect(todoRepository.changeAdminTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    {
                        title: 'Changed Deleted Todo'
                    },
                    session
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
                    } as any,
                    adminId,
                    ipAddress
                )
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.changeAdminTodo)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
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
                    } as any,
                    adminId,
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ConflictError)

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should propagate audit error', async () => {

            const todo = createTodo()

            const error = new Error('Audit Error')

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodo)
                .mockResolvedValue(true)

            vi.mocked(auditRepository.createAudit)
                .mockRejectedValue(error)

            await expect(
                todoAdminService.changeTodo(
                    todoId,
                    {
                        title: 'New Title'
                    } as any,
                    adminId,
                    ipAddress
                )
            ).rejects.toBe(error)

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })
    })


    describe('changeTodoStatus', () => {

        it('should change status successfully and create audit log', async () => {

            const todo = createTodo({
                status: TodoStatus.PENDING
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodoStatus)
                .mockResolvedValue(true)

            const result =
                await todoAdminService.changeTodoStatus(
                    todoId,
                    TodoStatus.COMPLETED,
                    adminId,
                    ipAddress
                )

            expect(todoRepository.changeAdminTodoStatus)
                .toHaveBeenCalledWith(
                    todoId,
                    TodoStatus.PENDING,
                    TodoStatus.COMPLETED,
                    session
                )

            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    {
                        adminId,
                        action: expect.anything(),
                        entityType: expect.anything(),
                        entityId: todoId,
                        oldValue: {
                            status: TodoStatus.PENDING
                        },
                        newValue: {
                            status: TodoStatus.COMPLETED
                        },
                        ipAddress
                    },
                    session
                )

            expect(result)
                .toBe(TodoStatus.COMPLETED)

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should change status from COMPLETED to PENDING', async () => {

            const todo = createTodo({
                status: TodoStatus.COMPLETED
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodoStatus)
                .mockResolvedValue(true)

            const result =
                await todoAdminService.changeTodoStatus(
                    todoId,
                    TodoStatus.PENDING,
                    adminId,
                    ipAddress
                )

            expect(todoRepository.changeAdminTodoStatus)
                .toHaveBeenCalledWith(
                    todoId,
                    TodoStatus.COMPLETED,
                    TodoStatus.PENDING,
                    session
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

            const result =
                await todoAdminService.changeTodoStatus(
                    todoId,
                    TodoStatus.PENDING,
                    adminId,
                    ipAddress
                )

            expect(todoRepository.changeAdminTodoStatus)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
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
                    TodoStatus.COMPLETED,
                    adminId,
                    ipAddress
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
                    TodoStatus.COMPLETED,
                    adminId,
                    ipAddress
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
                    TodoStatus.COMPLETED,
                    adminId,
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ConflictError)

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should propagate audit error', async () => {

            const todo = createTodo()

            const error = new Error('Audit Error')

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.changeAdminTodoStatus)
                .mockResolvedValue(true)

            vi.mocked(auditRepository.createAudit)
                .mockRejectedValue(error)

            await expect(
                todoAdminService.changeTodoStatus(
                    todoId,
                    TodoStatus.COMPLETED,
                    adminId,
                    ipAddress
                )
            ).rejects.toBe(error)

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })
    })


    describe('deleteSoftTodo', () => {

        it('should soft delete an active todo and create audit log', async () => {

            const todo = createTodo({
                deletedAt: null
            })

            const reason = 'Administrative deletion'

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.deleteAdminSoftTodo)
                .mockResolvedValue(true)

            await expect(
                todoAdminService.deleteSoftTodo(
                    todoId,
                    adminId,
                    reason,
                    ipAddress
                )
            ).resolves.toBeUndefined()

            expect(todoRepository.deleteAdminSoftTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    session
                )

            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    {
                        adminId,
                        action: expect.anything(),
                        entityType: expect.anything(),
                        entityId: todoId,
                        reason,
                        ipAddress
                    },
                    session
                )

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should do nothing when todo is already deleted', async () => {

            const todo = createTodo({
                deletedAt: new Date('2026-09-01T10:00:00.000Z')
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            await todoAdminService.deleteSoftTodo(
                todoId,
                adminId,
                'Already deleted',
                ipAddress
            )

            expect(todoRepository.deleteAdminSoftTodo)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
                .not.toHaveBeenCalled()
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(null)

            await expect(
                todoAdminService.deleteSoftTodo(
                    todoId,
                    adminId,
                    'Delete',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.deleteAdminSoftTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when soft delete fails', async () => {

            const todo = createTodo()

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.deleteAdminSoftTodo)
                .mockResolvedValue(false)

            await expect(
                todoAdminService.deleteSoftTodo(
                    todoId,
                    adminId,
                    'Delete',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ConflictError)

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })

    })


    describe('restoreTodo', () => {

        it('should restore deleted todo and create audit log', async () => {

            const todo = createTodo({
                deletedAt: new Date('2026-09-01T10:00:00.000Z')
            })

            const reason = 'Administrative restore'

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.restoreAdminTodo)
                .mockResolvedValue(true)

            const result =
                await todoAdminService.restoreTodo(
                    todoId,
                    adminId,
                    reason,
                    ipAddress
                )

            expect(todoRepository.restoreAdminTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    session
                )

            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    {
                        adminId,
                        action: expect.anything(),
                        entityType: expect.anything(),
                        entityId: todoId,
                        reason,
                        ipAddress
                    },
                    session
                )

            expect(result)
                .toBe(todo)

            expect(result.deletedAt)
                .toBeNull()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should do nothing when todo is already active', async () => {

            const todo = createTodo({
                deletedAt: null
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            const result =
                await todoAdminService.restoreTodo(
                    todoId,
                    adminId,
                    'Restore',
                    ipAddress
                )

            expect(todoRepository.restoreAdminTodo)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
                .not.toHaveBeenCalled()

            expect(result)
                .toBe(todo)
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(null)

            await expect(
                todoAdminService.restoreTodo(
                    todoId,
                    adminId,
                    'Restore',
                    ipAddress
                )
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
                todoAdminService.restoreTodo(
                    todoId,
                    adminId,
                    'Restore',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ConflictError)

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should propagate audit error', async () => {

            const todo = createTodo({
                deletedAt: new Date('2026-09-01T10:00:00.000Z')
            })

            const error = new Error('Audit Error')

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.restoreAdminTodo)
                .mockResolvedValue(true)

            vi.mocked(auditRepository.createAudit)
                .mockRejectedValue(error)

            await expect(
                todoAdminService.restoreTodo(
                    todoId,
                    adminId,
                    'Restore',
                    ipAddress
                )
            ).rejects.toBe(error)

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })
    })


    describe('deleteHardTodo', () => {

        it('should hard delete a soft-deleted todo and create audit log', async () => {

            const todo = createTodo({
                deletedAt: new Date('2026-09-01T10:00:00.000Z')
            })

            const reason = 'Permanent deletion'

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.deleteAdminHardTodo)
                .mockResolvedValue(true)

            await expect(
                todoAdminService.deleteHardTodo(
                    todoId,
                    adminId,
                    reason,
                    ipAddress
                )
            ).resolves.toBeUndefined()

            expect(todoRepository.deleteAdminHardTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    session
                )

            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    {
                        adminId,
                        action: expect.anything(),
                        entityType: expect.anything(),
                        entityId: todoId,
                        reason,
                        ipAddress
                    },
                    session
                )

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should throw ForbiddenError when todo is not soft-deleted', async () => {

            const todo = createTodo({
                deletedAt: null
            })

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            await expect(
                todoAdminService.deleteHardTodo(
                    todoId,
                    adminId,
                    'Permanent deletion',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ForbiddenError)

            expect(todoRepository.deleteAdminHardTodo)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
                .not.toHaveBeenCalled()
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(null)

            await expect(
                todoAdminService.deleteHardTodo(
                    todoId,
                    adminId,
                    'Permanent deletion',
                    ipAddress
                )
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
                todoAdminService.deleteHardTodo(
                    todoId,
                    adminId,
                    'Permanent deletion',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ConflictError)

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should propagate audit error', async () => {

            const todo = createTodo({
                deletedAt: new Date('2026-09-01T10:00:00.000Z')
            })

            const error = new Error('Audit Error')

            vi.mocked(todoRepository.getAdminTodo)
                .mockResolvedValue(todo)

            vi.mocked(todoRepository.deleteAdminHardTodo)
                .mockResolvedValue(true)

            vi.mocked(auditRepository.createAudit)
                .mockRejectedValue(error)

            await expect(
                todoAdminService.deleteHardTodo(
                    todoId,
                    adminId,
                    'Permanent deletion',
                    ipAddress
                )
            ).rejects.toBe(error)

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })
    })
})