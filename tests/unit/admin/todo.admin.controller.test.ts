import { describe, it, expect, vi, afterEach } from 'vitest'
import { Request, Response, NextFunction } from 'express'
import { Types } from 'mongoose'

import todoAdminController from '../../../src/controllers/admin/todo.admin.controller.js'
import todoAdminService from '../../../src/services/admin/todo.admin.service.js'
import { TodoStatus } from '../../../src/types/todo.enum.js'


describe('TodoAdminController', () => {

    afterEach(() => {
        vi.restoreAllMocks()
    })

    const mockResponse = () => {
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        } as unknown as Response

        return res
    }

    const mockNext = () => vi.fn() as unknown as NextFunction

    const todoId = new Types.ObjectId()

    const todo = {
        _id: todoId,
        title: 'Test Todo',
        description: 'Test Description',
        userId: new Types.ObjectId(),
        status: TodoStatus.PENDING,
        priority: 1,
        dueDate: new Date('2030-01-01'),
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null
    }

    describe('getAllTodos', () => {

        it('should return all todos successfully', async () => {

            const req = {
                validated: {
                    query: {
                        page: 1,
                        limit: 30
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            const data = [todo]

            vi.spyOn(todoAdminService, 'getAllTodos')
                .mockResolvedValue(data as any)

            await todoAdminController.getAllTodos(req, res, next)

            expect(todoAdminService.getAllTodos)
                .toHaveBeenCalledWith(req.validated.query)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'All Todos Successfully Found',
                    data
                })

            expect(next)
                .not.toHaveBeenCalled()
        })


        it('should pass service error to next', async () => {

            const req = {
                validated: {
                    query: {}
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            const error = new Error('Database Error')

            vi.spyOn(todoAdminService, 'getAllTodos')
                .mockRejectedValue(error)

            await todoAdminController.getAllTodos(req, res, next)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not.toHaveBeenCalled()
        })
    })

    describe('getTodo', () => {

        it('should return todo successfully', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            const data = {
                todo,
                user: {
                    _id: todo.userId,
                    username: 'testuser',
                    fullname: 'Test User',
                    role: 'User',
                    active: true,
                    deletedAt: null
                }
            }

            vi.spyOn(todoAdminService, 'getTodo')
                .mockResolvedValue(data as any)

            await todoAdminController.getTodo(req, res, next)

            expect(todoAdminService.getTodo)
                .toHaveBeenCalledWith(todoId)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Todo Successfully Found',
                    data
                })

            expect(next)
                .not.toHaveBeenCalled()
        })


        it('should pass service error to next', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            const error = new Error('Todo Not Found')

            vi.spyOn(todoAdminService, 'getTodo')
                .mockRejectedValue(error)

            await todoAdminController.getTodo(req, res, next)

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })

    describe('restoreTodo', () => {

        it('should restore todo successfully', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            const restoredTodo = {
                ...todo,
                deletedAt: null
            }

            vi.spyOn(todoAdminService, 'restoreTodo')
                .mockResolvedValue(restoredTodo as any)

            await todoAdminController.restoreTodo(req, res, next)

            expect(todoAdminService.restoreTodo)
                .toHaveBeenCalledWith(todoId)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Todo Successfully Restored',
                    data: restoredTodo
                })

            expect(next)
                .not.toHaveBeenCalled()
        })


        it('should pass service error to next', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            const error = new Error('Restore Error')

            vi.spyOn(todoAdminService, 'restoreTodo')
                .mockRejectedValue(error)

            await todoAdminController.restoreTodo(req, res, next)

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })


    // ==================================================
    // changeTodo
    // ==================================================

    describe('changeTodo', () => {

        it('should change todo successfully', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    },
                    body: {
                        title: 'Updated Todo',
                        priority: 5
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            const data = {
                title: 'Updated Todo',
                priority: 5
            }

            vi.spyOn(todoAdminService, 'changeTodo')
                .mockResolvedValue(data)

            await todoAdminController.changeTodo(req, res, next)

            expect(todoAdminService.changeTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    req.validated.body
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Todo Successfully Changed',
                    data
                })

            expect(next)
                .not.toHaveBeenCalled()
        })


        it('should pass service error to next', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    },
                    body: {
                        title: 'Updated Todo'
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            const error = new Error('Change Error')

            vi.spyOn(todoAdminService, 'changeTodo')
                .mockRejectedValue(error)

            await todoAdminController.changeTodo(req, res, next)

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })


    // ==================================================
    // changeTodoStatus
    // ==================================================

    describe('changeTodoStatus', () => {

        it('should change todo status successfully', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    },
                    body: {
                        status: TodoStatus.COMPLETED
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            vi.spyOn(todoAdminService, 'changeTodoStatus')
                .mockResolvedValue(TodoStatus.COMPLETED)

            await todoAdminController.changeTodoStatus(req, res, next)

            expect(todoAdminService.changeTodoStatus)
                .toHaveBeenCalledWith(
                    todoId,
                    TodoStatus.COMPLETED
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Todo Status Successfully Changed',
                    data: TodoStatus.COMPLETED
                })

            expect(next)
                .not.toHaveBeenCalled()
        })


        it('should pass service error to next', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    },
                    body: {
                        status: TodoStatus.COMPLETED
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            const error = new Error('Status Error')

            vi.spyOn(todoAdminService, 'changeTodoStatus')
                .mockRejectedValue(error)

            await todoAdminController.changeTodoStatus(req, res, next)

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })


    // ==================================================
    // deleteSoftTodo
    // ==================================================

    describe('deleteSoftTodo', () => {

        it('should soft delete todo successfully', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            vi.spyOn(todoAdminService, 'deleteSoftTodo')
                .mockResolvedValue(undefined)

            await todoAdminController.deleteSoftTodo(req, res, next)

            expect(todoAdminService.deleteSoftTodo)
                .toHaveBeenCalledWith(todoId)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Todo Successfully Deleted (Soft)',
                    data: null
                })

            expect(next)
                .not.toHaveBeenCalled()
        })


        it('should pass service error to next', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            const error = new Error('Delete Error')

            vi.spyOn(todoAdminService, 'deleteSoftTodo')
                .mockRejectedValue(error)

            await todoAdminController.deleteSoftTodo(req, res, next)

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })


    // ==================================================
    // deleteHardTodo
    // ==================================================

    describe('deleteHardTodo', () => {

        it('should hard delete todo successfully', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            vi.spyOn(todoAdminService, 'deleteHardTodo')
                .mockResolvedValue(undefined)

            await todoAdminController.deleteHardTodo(req, res, next)

            expect(todoAdminService.deleteHardTodo)
                .toHaveBeenCalledWith(todoId)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Todo Successfully Deleted (Hard)',
                    data: null
                })

            expect(next)
                .not.toHaveBeenCalled()
        })


        it('should pass service error to next', async () => {

            const req = {
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = mockResponse()
            const next = mockNext()

            const error = new Error('Hard Delete Error')

            vi.spyOn(todoAdminService, 'deleteHardTodo')
                .mockRejectedValue(error)

            await todoAdminController.deleteHardTodo(req, res, next)

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })
})