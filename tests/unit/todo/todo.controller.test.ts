import { describe, it, expect, vi, beforeEach } from 'vitest'
import todoController from '../../../src/controllers/todo.controller.js'
import todoService from '../../../src/services/todo.service.js'
import { TodoStatus } from '../../../src/types/todo.enum.js'

vi.mock('../../../src/services/todo.service.js', () => ({
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


describe('TodoController', () => {

    const userId = 'user-id' as any
    const todoId = 'todo-id' as any

    const createMockResponse = () => {
        const res = {
            status: vi.fn(),
            json: vi.fn()
        }

        res.status.mockReturnValue(res)

        return res
    }

    const createMockNext = () => vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getUserTodos', () => {

        it('should get user todos successfully', async () => {

            const req = {
                user: {
                    userId
                },
                validated: {
                    query: {
                        page: 1,
                        limit: 15
                    }
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            const data = [
                {
                    _id: todoId,
                    title: 'Todo 1'
                },
                {
                    _id: 'todo-2',
                    title: 'Todo 2'
                }
            ]

            vi.mocked(todoService.getUserTodos).mockResolvedValue(data as any)

            await todoController.getUserTodos(req, res as any, next)

            expect(todoService.getUserTodos)
                .toHaveBeenCalledWith(
                    req.validated.query,
                    userId
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'All User Todos Successfully Found',
                    data
                })

            expect(next)
                .not
                .toHaveBeenCalled()
        })


        it('should call next when service throws an error', async () => {

            const error = new Error('Database Error')

            const req = {
                user: {
                    userId
                },
                validated: {
                    query: {}
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            vi.mocked(todoService.getUserTodos)
                .mockRejectedValue(error)

            await todoController.getUserTodos(req, res as any, next)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not
                .toHaveBeenCalled()

            expect(res.json)
                .not
                .toHaveBeenCalled()
        })
    })

    describe('getUserTodo', () => {

        it('should get user todo successfully', async () => {

            const req = {
                user: {
                    userId
                },
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            const data = {
                _id: todoId,
                title: 'Learn TypeScript'
            }

            vi.mocked(todoService.getUserTodo)
                .mockResolvedValue(data as any)

            await todoController.getUserTodo(req, res as any, next)

            expect(todoService.getUserTodo)
                .toHaveBeenCalledWith(
                    todoId,
                    userId
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'User Todo Successfully Found',
                    data
                })

            expect(next)
                .not
                .toHaveBeenCalled()
        })


        it('should call next when service throws an error', async () => {

            const error = new Error('Todo Not Found')

            const req = {
                user: {
                    userId
                },
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            vi.mocked(todoService.getUserTodo)
                .mockRejectedValue(error)

            await todoController.getUserTodo(req, res as any, next)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not
                .toHaveBeenCalled()
        })
    })

    describe('createTodo', () => {

        it('should create todo successfully', async () => {

            const todoData = {
                title: 'Learn Mongoose',
                description: 'Learn Mongoose with TypeScript',
                status: TodoStatus.PENDING,
                priority: 5,
                dueDate: new Date('2026-09-30')
            }

            const req = {
                user: {
                    userId
                },
                validated: {
                    body: todoData
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            const data = {
                _id: todoId,
                userId,
                ...todoData
            }

            vi.mocked(todoService.createTodo)
                .mockResolvedValue(data as any)

            await todoController.createTodo(req, res as any, next)

            expect(todoService.createTodo)
                .toHaveBeenCalledWith(
                    userId,
                    todoData
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Todo Successfully Created',
                    data
                })

            expect(next)
                .not
                .toHaveBeenCalled()
        })


        it('should call next when service throws an error', async () => {

            const error = new Error('Create Todo Failed')

            const req = {
                user: {
                    userId
                },
                validated: {
                    body: {}
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            vi.mocked(todoService.createTodo)
                .mockRejectedValue(error)

            await todoController.createTodo(req, res as any, next)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not
                .toHaveBeenCalled()
        })
    })

    describe('restoreTodo', () => {

        it('should restore todo successfully', async () => {

            const req = {
                user: {
                    userId
                },
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            const data = {
                _id: todoId,
                userId,
                title: 'Restored Todo',
                deletedAt: null
            }

            vi.mocked(todoService.restoreTodo)
                .mockResolvedValue(data as any)

            await todoController.restoreTodo(req, res as any, next)

            expect(todoService.restoreTodo)
                .toHaveBeenCalledWith(
                    userId,
                    todoId
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Todo Successfully Restored',
                    data
                })

            expect(next)
                .not
                .toHaveBeenCalled()
        })


        it('should call next when service throws an error', async () => {

            const error = new Error('Restore Failed')

            const req = {
                user: {
                    userId
                },
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            vi.mocked(todoService.restoreTodo)
                .mockRejectedValue(error)

            await todoController.restoreTodo(req, res as any, next)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not
                .toHaveBeenCalled()
        })
    })

    describe('changeTodo', () => {

        it('should change todo successfully', async () => {

            const todoData = {
                title: 'Updated Todo',
                priority: 8
            }

            const req = {
                user: {
                    userId
                },
                validated: {
                    params: {
                        todoId
                    },
                    body: todoData
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            const data = {
                title: 'Updated Todo',
                priority: 8
            }

            vi.mocked(todoService.changeTodo)
                .mockResolvedValue(data as any)

            await todoController.changeTodo(req, res as any, next)

            expect(todoService.changeTodo)
                .toHaveBeenCalledWith(
                    userId,
                    todoId,
                    todoData
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
                .not
                .toHaveBeenCalled()
        })


        it('should call next when service throws an error', async () => {

            const error = new Error('Change Todo Failed')

            const req = {
                user: {
                    userId
                },
                validated: {
                    params: {
                        todoId
                    },
                    body: {
                        title: 'Updated'
                    }
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            vi.mocked(todoService.changeTodo)
                .mockRejectedValue(error)

            await todoController.changeTodo(req, res as any, next)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not
                .toHaveBeenCalled()
        })
    })

    describe('changeTodoStatus', () => {

        it('should change todo status successfully', async () => {

            const req = {
                user: {
                    userId
                },
                validated: {
                    params: {
                        todoId
                    },
                    body: {
                        status: TodoStatus.COMPLETED
                    }
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            vi.mocked(todoService.changeTodoStatus)
                .mockResolvedValue(TodoStatus.COMPLETED)

            await todoController.changeTodoStatus(req, res as any, next)

            expect(todoService.changeTodoStatus)
                .toHaveBeenCalledWith(
                    userId,
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
                .not
                .toHaveBeenCalled()
        })


        it('should call next when service throws an error', async () => {

            const error = new Error('Status Change Failed')

            const req = {
                user: {
                    userId
                },
                validated: {
                    params: {
                        todoId
                    },
                    body: {
                        status: TodoStatus.COMPLETED
                    }
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            vi.mocked(todoService.changeTodoStatus)
                .mockRejectedValue(error)

            await todoController.changeTodoStatus(req, res as any, next)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not
                .toHaveBeenCalled()
        })
    })

    describe('deleteTodo', () => {

        it('should delete todo successfully', async () => {

            const req = {
                user: {
                    userId
                },
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            vi.mocked(todoService.deleteTodo)
                .mockResolvedValue(undefined)

            await todoController.deleteTodo(req, res as any, next)

            expect(todoService.deleteTodo)
                .toHaveBeenCalledWith(
                    userId,
                    todoId
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Todo Successfully Deleted',
                    data: null
                })

            expect(next)
                .not
                .toHaveBeenCalled()
        })


        it('should call next when service throws an error', async () => {

            const error = new Error('Delete Failed')

            const req = {
                user: {
                    userId
                },
                validated: {
                    params: {
                        todoId
                    }
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            vi.mocked(todoService.deleteTodo)
                .mockRejectedValue(error)

            await todoController.deleteTodo(req, res as any, next)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not
                .toHaveBeenCalled()
        })
    })

    describe('clearUserTodos', () => {

        it('should clear all user todos successfully', async () => {

            const req = {
                user: {
                    userId
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            vi.mocked(todoService.clearUserTodos)
                .mockResolvedValue(undefined)

            await todoController.clearUserTodos(req, res as any, next)

            expect(todoService.clearUserTodos)
                .toHaveBeenCalledWith(userId)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'User Todos Successfully Deleted',
                    data: null
                })

            expect(next)
                .not
                .toHaveBeenCalled()
        })


        it('should call next when service throws an error', async () => {

            const error = new Error('Clear Todos Failed')

            const req = {
                user: {
                    userId
                }
            } as any

            const res = createMockResponse()
            const next = createMockNext()

            vi.mocked(todoService.clearUserTodos)
                .mockRejectedValue(error)

            await todoController.clearUserTodos(req, res as any, next)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not
                .toHaveBeenCalled()
        })
    })
})