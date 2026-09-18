import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Types } from 'mongoose'

import todoService from '../../../src/services/todo.service.js'
import todoRepository from '../../../src/repository/todo.repository.js'
import { TodoQuaryBuilder } from '../../../src/builders/todo.quary.builder.js'

import {
    BadRequestError,
    ConflictError,
    NotFoundError
} from '../../../src/utils/appError.js'

import { TodoStatus } from '../../../src/types/todo.enum.js'


vi.mock('../../../src/repository/todo.repository.js', () => ({
    default: {
        getUserTodos: vi.fn(),
        getUserTodo: vi.fn(),
        createTodo: vi.fn(),
        restoreTodo: vi.fn(),
        changeTodo: vi.fn(),
        changeTodoStatus: vi.fn(),
        deleteTodo: vi.fn(),
        clearUserTodos: vi.fn()
    }
}))


vi.mock('../../../src/builders/todo.quary.builder.js', () => ({
    TodoQuaryBuilder: {
        build: vi.fn()
    }
}))


describe('TodoService', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getUserTodos', () => {

        it('should get user todos successfully', async () => {

            const userId = new Types.ObjectId()

            const qs = {
                page: 2,
                limit: 10,
                sort: 'PRIORITY',
                sortType: 'DESC',
                showDeleted: 'No'
            } as any

            const options = {
                limit: 10,
                skip: 10,
                where: {
                    $and: [
                        {
                            deletedAt: {
                                $ne : null
                            }
                        }
                    ]
                },
                sort: {
                    priority: -1,
                    _id: -1
                }
            }

            const todos = [
                {
                    _id: new Types.ObjectId(),
                    title: 'Todo 1',
                    userId
                }
            ]

            vi.mocked(TodoQuaryBuilder.build)
                .mockReturnValue(options)

            vi.mocked(todoRepository.getUserTodos)
                .mockResolvedValue(todos as any)

            const result = await todoService.getUserTodos(
                qs,
                userId
            )

            expect(TodoQuaryBuilder.build)
                .toHaveBeenCalledWith(qs)

            expect(todoRepository.getUserTodos)
                .toHaveBeenCalledWith(
                    userId,
                    options.limit,
                    options.skip,
                    options.where,
                    options.sort
                )

            expect(result).toEqual(todos)
        })
    })

    describe('getUserTodo', () => {

        it('should get user todo successfully', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                title: 'Test Todo',
                description: 'Test Description',
                priority: 5,
                dueDate: new Date('2026-10-01'),
                status: TodoStatus.PENDING,
                deletedAt: null
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            const result = await todoService.getUserTodo(
                todoId,
                userId
            )

            expect(todoRepository.getUserTodo)
                .toHaveBeenCalledWith(
                    userId,
                    todoId
                )

            expect(result).toEqual(todo)
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(null)

            await expect(
                todoService.getUserTodo(
                    todoId,
                    userId
                )
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.getUserTodo)
                .toHaveBeenCalledWith(
                    userId,
                    todoId
                )
        })
    })

    describe('createTodo', () => {

        it('should create todo successfully', async () => {

            const userId = new Types.ObjectId()

            const todoData = {
                title: 'Test Todo',
                description: 'Test Description',
                priority: 5,
                dueDate: new Date('2026-10-01'),
                status: TodoStatus.PENDING
            }

            const createdTodo = {
                _id: new Types.ObjectId(),
                userId,
                ...todoData,
                deletedAt: null
            }

            vi.mocked(todoRepository.createTodo)
                .mockResolvedValue(createdTodo as any)

            const result = await todoService.createTodo(
                userId,
                todoData as any
            )

            expect(todoRepository.createTodo)
                .toHaveBeenCalledWith(
                    userId,
                    todoData
                )

            expect(result).toEqual(createdTodo)
        })
    })

    describe('restoreTodo', () => {

        it('should restore deleted todo successfully', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                title: 'Deleted Todo',
                description: 'Description',
                priority: 5,
                dueDate: new Date('2026-10-01'),
                status: TodoStatus.PENDING,
                deletedAt: new Date('2026-09-10')
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            vi.mocked(todoRepository.restoreTodo)
                .mockResolvedValue(true)

            const result = await todoService.restoreTodo(
                userId,
                todoId
            )

            expect(todoRepository.getUserTodo)
                .toHaveBeenCalledWith(
                    userId,
                    todoId
                )

            expect(todoRepository.restoreTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    userId
                )

            expect(todo.deletedAt).toBeNull()

            expect(result).toEqual(todo)
        })


        it('should return todo when todo is already active', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                title: 'Active Todo',
                deletedAt: null
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            const result = await todoService.restoreTodo(
                userId,
                todoId
            )

            expect(result).toEqual(todo)

            expect(todoRepository.restoreTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(null)

            await expect(
                todoService.restoreTodo(
                    userId,
                    todoId
                )
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.restoreTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when restore fails', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                title: 'Deleted Todo',
                deletedAt: new Date()
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            vi.mocked(todoRepository.restoreTodo)
                .mockResolvedValue(false)

            await expect(
                todoService.restoreTodo(
                    userId,
                    todoId
                )
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('changeTodo', () => {

        it('should change todo successfully', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                title: 'Old Title',
                description: 'Old Description',
                priority: 3,
                dueDate: new Date('2026-09-20'),
                status: TodoStatus.PENDING,
                deletedAt: null
            }

            const todoData = {
                title: 'New Title',
                description: 'New Description',
                priority: 8,
                dueDate: new Date('2026-10-01')
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            vi.mocked(todoRepository.changeTodo)
                .mockResolvedValue(true)

            const result = await todoService.changeTodo(
                userId,
                todoId,
                todoData as any
            )

            expect(todoRepository.changeTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    userId,
                    todoData
                )

            expect(result).toEqual(todoData)
        })


        it('should send only changed fields to repository', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                title: 'Old Title',
                description: 'Description',
                priority: 5,
                dueDate: null,
                status: TodoStatus.PENDING,
                deletedAt: null
            }

            const todoData = {
                title: 'New Title'
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            vi.mocked(todoRepository.changeTodo)
                .mockResolvedValue(true)

            const result = await todoService.changeTodo(
                userId,
                todoId,
                todoData as any
            )

            expect(todoRepository.changeTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    userId,
                    {
                        title: 'New Title'
                    }
                )

            expect(result).toEqual({
                title: 'New Title'
            })
        })


        it('should return empty object when no field has changed', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const dueDate = new Date('2026-09-20')

            const todo = {
                _id: todoId,
                userId,
                title: 'Title',
                description: 'Description',
                priority: 5,
                dueDate,
                status: TodoStatus.PENDING,
                deletedAt: null
            }

            const todoData = {
                title: 'Title',
                description: 'Description',
                priority: 5,
                dueDate: new Date(dueDate)
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            const result = await todoService.changeTodo(
                userId,
                todoId,
                todoData as any
            )

            expect(result).toEqual({})

            expect(todoRepository.changeTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(null)

            await expect(
                todoService.changeTodo(
                    userId,
                    todoId,
                    {
                        title: 'New Title'
                    } as any
                )
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.changeTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw BadRequestError when todo is deleted', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                title: 'Deleted Todo',
                description: 'Description',
                priority: 5,
                dueDate: new Date('2026-09-20'),
                status: TodoStatus.PENDING,
                deletedAt: new Date('2026-09-10')
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            await expect(
                todoService.changeTodo(
                    userId,
                    todoId,
                    {
                        title: 'New Title'
                    } as any
                )
            ).rejects.toBeInstanceOf(BadRequestError)

            expect(todoRepository.changeTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when todo can not be changed', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                title: 'Old Title',
                description: 'Description',
                priority: 5,
                dueDate: null,
                status: TodoStatus.PENDING,
                deletedAt: null
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            vi.mocked(todoRepository.changeTodo)
                .mockResolvedValue(false)

            await expect(
                todoService.changeTodo(
                    userId,
                    todoId,
                    {
                        title: 'New Title'
                    } as any
                )
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('changeTodoStatus', () => {

        it('should change status successfully', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                status: TodoStatus.PENDING,
                deletedAt: null
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            vi.mocked(todoRepository.changeTodoStatus)
                .mockResolvedValue(true)

            const result = await todoService.changeTodoStatus(
                userId,
                todoId,
                TodoStatus.COMPLETED
            )

            expect(todoRepository.changeTodoStatus)
                .toHaveBeenCalledWith(
                    todoId,
                    userId,
                    TodoStatus.PENDING,
                    TodoStatus.COMPLETED
                )

            expect(result).toBe(TodoStatus.COMPLETED)
        })


        it('should not call repository when status is already the same', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                status: TodoStatus.PENDING,
                deletedAt: null
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            const result = await todoService.changeTodoStatus(
                userId,
                todoId,
                TodoStatus.PENDING
            )

            expect(result).toBe(TodoStatus.PENDING)

            expect(todoRepository.changeTodoStatus)
                .not.toHaveBeenCalled()
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(null)

            await expect(
                todoService.changeTodoStatus(
                    userId,
                    todoId,
                    TodoStatus.COMPLETED
                )
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.changeTodoStatus)
                .not.toHaveBeenCalled()
        })


        it('should throw BadRequestError when todo is deleted', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                status: TodoStatus.PENDING,
                deletedAt: new Date('2026-09-10')
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            await expect(
                todoService.changeTodoStatus(
                    userId,
                    todoId,
                    TodoStatus.COMPLETED
                )
            ).rejects.toBeInstanceOf(BadRequestError)

            expect(todoRepository.changeTodoStatus)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when status can not be changed', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                status: TodoStatus.PENDING,
                deletedAt: null
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            vi.mocked(todoRepository.changeTodoStatus)
                .mockResolvedValue(false)

            await expect(
                todoService.changeTodoStatus(
                    userId,
                    todoId,
                    TodoStatus.COMPLETED
                )
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('deleteTodo', () => {

        it('should delete todo successfully', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                title: 'Todo',
                status: TodoStatus.PENDING,
                deletedAt: null
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            vi.mocked(todoRepository.deleteTodo)
                .mockResolvedValue(true)

            await expect(
                todoService.deleteTodo(
                    userId,
                    todoId
                )
            ).resolves.toBeUndefined()

            expect(todoRepository.getUserTodo)
                .toHaveBeenCalledWith(
                    userId,
                    todoId
                )

            expect(todoRepository.deleteTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    userId
                )
        })


        it('should throw NotFoundError when todo does not exist', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(null)

            await expect(
                todoService.deleteTodo(
                    userId,
                    todoId
                )
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(todoRepository.deleteTodo)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when todo can not be deleted', async () => {

            const userId = new Types.ObjectId()
            const todoId = new Types.ObjectId()

            const todo = {
                _id: todoId,
                userId,
                title: 'Todo',
                status: TodoStatus.PENDING,
                deletedAt: null
            }

            vi.mocked(todoRepository.getUserTodo)
                .mockResolvedValue(todo as any)

            vi.mocked(todoRepository.deleteTodo)
                .mockResolvedValue(false)

            await expect(
                todoService.deleteTodo(
                    userId,
                    todoId
                )
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('clearUserTodos', () => {

        it('should clear user todos successfully', async () => {

            const userId = new Types.ObjectId()

            vi.mocked(todoRepository.clearUserTodos)
                .mockResolvedValue(true)

            await expect(
                todoService.clearUserTodos(userId)
            ).resolves.toBeUndefined()

            expect(todoRepository.clearUserTodos)
                .toHaveBeenCalledWith(userId)
        })


        it('should throw ConflictError when user todos can not be deleted', async () => {

            const userId = new Types.ObjectId()

            vi.mocked(todoRepository.clearUserTodos)
                .mockResolvedValue(false)

            await expect(
                todoService.clearUserTodos(userId)
            ).rejects.toBeInstanceOf(ConflictError)

            expect(todoRepository.clearUserTodos)
                .toHaveBeenCalledWith(userId)
        })
    })
})