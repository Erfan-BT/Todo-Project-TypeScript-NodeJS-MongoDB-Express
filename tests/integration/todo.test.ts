import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { randomUUID } from 'crypto'
import { Types } from 'mongoose'
import argon2 from 'argon2'

import app from '../../src/app.js'
import { Todo, User } from '../../src/models/index.js'
import tokenService from '../../src/services/token.service.js'
import sessionRepository from '../../src/repository/session.repository.js'
import { TodoStatus } from '../../src/types/todo.enum.js'


const createTestUser = async () => {
    return await User.create({
        fullname: 'Integration Test User',
        username: `test_${randomUUID().replaceAll('-', '').slice(0, 15)}`,
        password: 'hashed-password'
    })
}


const createAuthenticatedUser = async () => {
    const user = await createTestUser()

    const jti = randomUUID()

    const refreshTokenHash = await argon2.hash(
        'test-refresh-token'
    )

    await sessionRepository.createSession(
        user._id,
        jti,
        refreshTokenHash,
        '1d',
        'test-device'
    )

    const accessToken = tokenService.generateAccessToken(
        user._id,
        jti
    )

    return {
        user,
        accessToken,
        jti
    }
}


const createTodo = async (
    userId: Types.ObjectId,
    data: Partial<{
        title: string
        description: string
        status: TodoStatus
        priority: number
        dueDate: Date
        deletedAt: Date | null
    }> = {}
) => {
    return await Todo.create({
        userId,
        title: data.title ?? 'Test Todo',
        description: data.description ?? 'Test Todo Description',
        status: data.status ?? TodoStatus.PENDING,
        priority: data.priority ?? 5,
        dueDate: data.dueDate ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
        deletedAt: data.deletedAt ?? null
    })
}


const createInvalidAccessToken = () => {
    return 'invalid.access.token'
}


const createTamperedAccessToken = (token: string) => {
    return `${token}tampered`
}

describe('POST /api/v1/todos', () => {

    it('should create todo successfully', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const dueDate = new Date(
            Date.now() + 24 * 60 * 60 * 1000
        )

        const response = await request(app)
            .post('/api/v1/todos')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Learn MongoDB',
                description: 'Study Mongoose and MongoDB',
                priority: 5,
                dueDate: dueDate.toISOString()
            })

        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)

        expect(response.body.data).toMatchObject({
            title: 'Learn MongoDB',
            description: 'Study Mongoose and MongoDB',
            priority: 5,
            status: TodoStatus.PENDING,
            userId: user._id.toString()
        })
    })


    it('should create todo with provided status', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .post('/api/v1/todos')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Completed Todo',
                description: 'Completed Todo Description',
                priority: 7,
                status: TodoStatus.COMPLETED,
                dueDate: new Date(
                    Date.now() + 24 * 60 * 60 * 1000
                ).toISOString()
            })

        expect(response.status).toBe(200)

        expect(response.body.data.status)
            .toBe(TodoStatus.COMPLETED)
    })


    it('should reject request without access token', async () => {
        const response = await request(app)
            .post('/api/v1/todos')
            .send({
                title: 'Test Todo',
                description: 'Test Description',
                priority: 5,
                dueDate: new Date().toISOString()
            })

        expect(response.status).toBe(401)
    })


    it('should reject invalid access token', async () => {
        const response = await request(app)
            .post('/api/v1/todos')
            .set(
                'Authorization',
                `Bearer ${createInvalidAccessToken()}`
            )
            .send({
                title: 'Test Todo',
                description: 'Test Description',
                priority: 5,
                dueDate: new Date().toISOString()
            })

        expect(response.status).toBe(401)
    })


    it('should reject tampered access token', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .post('/api/v1/todos')
            .set(
                'Authorization',
                `Bearer ${createTamperedAccessToken(accessToken)}`
            )
            .send({
                title: 'Test Todo',
                description: 'Test Description',
                priority: 5,
                dueDate: new Date().toISOString()
            })

        expect(response.status).toBe(401)
    })


    it('should reject empty title', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .post('/api/v1/todos')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: '',
                description: 'Test Description',
                priority: 5,
                dueDate: new Date().toISOString()
            })

        expect(response.status).toBe(400)
    })


    it('should reject title longer than 100 characters', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .post('/api/v1/todos')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'a'.repeat(101),
                description: 'Test Description',
                priority: 5,
                dueDate: new Date().toISOString()
            })

        expect(response.status).toBe(400)
    })


    it('should reject empty description', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .post('/api/v1/todos')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Test Todo',
                description: '',
                priority: 5,
                dueDate: new Date().toISOString()
            })

        expect(response.status).toBe(400)
    })


    it('should reject description longer than 255 characters', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .post('/api/v1/todos')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Test Todo',
                description: 'a'.repeat(256),
                priority: 5,
                dueDate: new Date().toISOString()
            })

        expect(response.status).toBe(400)
    })


    it('should reject priority less than 1', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .post('/api/v1/todos')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Test Todo',
                description: 'Test Description',
                priority: 0,
                dueDate: new Date().toISOString()
            })

        expect(response.status).toBe(400)
    })


    it('should reject priority greater than 10', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .post('/api/v1/todos')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Test Todo',
                description: 'Test Description',
                priority: 11,
                dueDate: new Date().toISOString()
            })

        expect(response.status).toBe(400)
    })


    it('should reject invalid dueDate', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .post('/api/v1/todos')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Test Todo',
                description: 'Test Description',
                priority: 5,
                dueDate: 'invalid-date'
            })

        expect(response.status).toBe(400)
    })
})

describe('GET /api/v1/todos/:todoId', () => {

    it('should get user todo successfully', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id)

        const response = await request(app)
            .get(`/api/v1/todos/${todo._id}`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)

        expect(response.body.data._id)
            .toBe(todo._id.toString())
    })


    it('should return 404 when todo belongs to another user', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const anotherUser = await createTestUser()

        const todo = await createTodo(anotherUser._id)

        const response = await request(app)
            .get(`/api/v1/todos/${todo._id}`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(404)
    })


    it('should return 404 when todo does not exist', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const todoId = new Types.ObjectId()

        const response = await request(app)
            .get(`/api/v1/todos/${todoId}`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(404)
    })


    it('should reject invalid todo id', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .get('/api/v1/todos/invalid-id')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(400)
    })


    it('should reject request without access token', async () => {
        const todoId = new Types.ObjectId()

        const response = await request(app)
            .get(`/api/v1/todos/${todoId}`)

        expect(response.status).toBe(401)
    })
})

describe('PATCH /api/v1/todos/:todoId', () => {

    it('should update todo successfully', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id)

        const response = await request(app)
            .patch(`/api/v1/todos/${todo._id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Updated Todo',
                description: 'Updated Description',
                priority: 8
            })

        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)

        expect(response.body.data).toMatchObject({
            title: 'Updated Todo',
            description: 'Updated Description',
            priority: 8
        })
    })


    it('should update only provided fields', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id, {
            title: 'Original Title',
            description: 'Original Description',
            priority: 5
        })

        const response = await request(app)
            .patch(`/api/v1/todos/${todo._id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'New Title'
            })

        expect(response.status).toBe(200)

        expect(response.body.data).toEqual({
            title: 'New Title'
        })
    })


    it('should reject empty update body', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id)

        const response = await request(app)
            .patch(`/api/v1/todos/${todo._id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({})

        expect(response.status).toBe(400)
    })


    it('should not update another user todo', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const anotherUser = await createTestUser()

        const todo = await createTodo(anotherUser._id)

        const response = await request(app)
            .patch(`/api/v1/todos/${todo._id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Hacked Todo'
            })

        expect(response.status).toBe(404)
    })


    it('should not update deleted todo', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id, {
            deletedAt: new Date()
        })

        const response = await request(app)
            .patch(`/api/v1/todos/${todo._id}`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Updated Todo'
            })

        expect(response.status).toBe(400)
    })


    it('should reject invalid todo id', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .patch('/api/v1/todos/invalid-id')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                title: 'Updated Todo'
            })

        expect(response.status).toBe(400)
    })
})

describe('PATCH /api/v1/todos/:todoId/status', () => {

    it('should change todo status successfully', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id, {
            status: TodoStatus.PENDING
        })

        const response = await request(app)
            .patch(`/api/v1/todos/${todo._id}/status`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                status: TodoStatus.COMPLETED
            })

        expect(response.status).toBe(200)

        expect(response.body.data)
            .toBe(TodoStatus.COMPLETED)
    })


    it('should change status to canceled successfully', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id)

        const response = await request(app)
            .patch(`/api/v1/todos/${todo._id}/status`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                status: TodoStatus.CANCELED
            })

        expect(response.status).toBe(200)

        expect(response.body.data)
            .toBe(TodoStatus.CANCELED)
    })


    it('should not change another user todo status', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const anotherUser = await createTestUser()

        const todo = await createTodo(anotherUser._id)

        const response = await request(app)
            .patch(`/api/v1/todos/${todo._id}/status`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                status: TodoStatus.COMPLETED
            })

        expect(response.status).toBe(404)
    })


    it('should not change deleted todo status', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id, {
            deletedAt: new Date()
        })

        const response = await request(app)
            .patch(`/api/v1/todos/${todo._id}/status`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                status: TodoStatus.COMPLETED
            })

        expect(response.status).toBe(400)
    })


    it('should reject invalid status', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id)

        const response = await request(app)
            .patch(`/api/v1/todos/${todo._id}/status`)
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                status: 'INVALID_STATUS'
            })

        expect(response.status).toBe(400)
    })


    it('should reject invalid todo id', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .patch('/api/v1/todos/invalid-id/status')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                status: TodoStatus.COMPLETED
            })

        expect(response.status).toBe(400)
    })
})

describe('DELETE /api/v1/todos/:todoId', () => {

    it('should soft delete todo successfully', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id)

        const response = await request(app)
            .delete(`/api/v1/todos/${todo._id}`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)

        const deletedTodo = await Todo.findById(todo._id)

        expect(deletedTodo?.deletedAt).not.toBeNull()
    })


    it('should not delete another user todo', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const anotherUser = await createTestUser()

        const todo = await createTodo(anotherUser._id)

        const response = await request(app)
            .delete(`/api/v1/todos/${todo._id}`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(404)
    })


    it('should return 404 when todo does not exist', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const todoId = new Types.ObjectId()

        const response = await request(app)
            .delete(`/api/v1/todos/${todoId}`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(404)
    })


    it('should reject invalid todo id', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .delete('/api/v1/todos/invalid-id')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(400)
    })
})

describe('POST /api/v1/todos/:todoId/restore', () => {

    it('should restore deleted todo successfully', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id, {
            deletedAt: new Date()
        })

        const response = await request(app)
            .post(`/api/v1/todos/${todo._id}/restore`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)

        expect(response.body.data.deletedAt)
            .toBeNull()
    })


    it('should return active todo when restoring non-deleted todo', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo = await createTodo(user._id)

        const response = await request(app)
            .post(`/api/v1/todos/${todo._id}/restore`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)

        expect(response.body.data._id)
            .toBe(todo._id.toString())

        expect(response.body.data.deletedAt)
            .toBeNull()
    })


    it('should not restore another user todo', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const anotherUser = await createTestUser()

        const todo = await createTodo(anotherUser._id, {
            deletedAt: new Date()
        })

        const response = await request(app)
            .post(`/api/v1/todos/${todo._id}/restore`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(404)
    })


    it('should return 404 when todo does not exist', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const todoId = new Types.ObjectId()

        const response = await request(app)
            .post(`/api/v1/todos/${todoId}/restore`)
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(404)
    })
})



// DELETE /api/v1/todos/clear


describe('DELETE /api/v1/todos/clear', () => {

    it('should soft delete all active user todos', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo1 = await createTodo(user._id)
        const todo2 = await createTodo(user._id)
        const deletedTodo = await createTodo(user._id, {
            deletedAt: new Date()
        })

        const response = await request(app)
            .delete('/api/v1/todos/clear')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)

        const todos = await Todo.find({
            userId: user._id
        })

        const activeTodo1 = todos.find(
            todo => todo._id.equals(todo1._id)
        )

        const activeTodo2 = todos.find(
            todo => todo._id.equals(todo2._id)
        )

        const alreadyDeletedTodo = todos.find(
            todo => todo._id.equals(deletedTodo._id)
        )

        expect(activeTodo1?.deletedAt).not.toBeNull()
        expect(activeTodo2?.deletedAt).not.toBeNull()
        expect(alreadyDeletedTodo?.deletedAt).not.toBeNull()
    })


    it('should not affect another user todos', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const anotherUser = await createTestUser()

        await createTodo(user._id)

        const anotherUserTodo = await createTodo(
            anotherUser._id
        )

        const response = await request(app)
            .delete('/api/v1/todos/clear')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        const todo = await Todo.findById(
            anotherUserTodo._id
        )

        expect(todo?.deletedAt).toBeNull()
    })


    it('should return conflict when user has no active todos', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .delete('/api/v1/todos/clear')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(409)
    })


    it('should reject request without access token', async () => {
        const response = await request(app)
            .delete('/api/v1/todos/clear')

        expect(response.status).toBe(401)
    })
})



// GET /api/v1/todos


describe('GET /api/v1/todos', () => {

    it('should get only active user todos by default', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        await createTodo(user._id)

        await createTodo(user._id, {
            deletedAt: new Date()
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)

        expect(response.body.data).toHaveLength(1)

        expect(response.body.data[0].deletedAt)
            .toBeNull()
    })


    it('should return all active todos when showDeleted is No', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        await createTodo(user._id)
        await createTodo(user._id)
        await createTodo(user._id, {
            deletedAt: new Date()
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                showDeleted: 'No'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.data).toHaveLength(2)

        expect(
            response.body.data.every(
                (todo: any) => todo.deletedAt === null
            )
        ).toBe(true)
    })


    it('should return only deleted todos when showDeleted is Yes', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        await createTodo(user._id)
        await createTodo(user._id, {
            deletedAt: new Date()
        })
        await createTodo(user._id, {
            deletedAt: new Date()
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                showDeleted: 'Yes'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.data).toHaveLength(2)

        expect(
            response.body.data.every(
                (todo: any) => todo.deletedAt !== null
            )
        ).toBe(true)
    })


    it('should return active and deleted todos when showDeleted is All', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        await createTodo(user._id)
        await createTodo(user._id)
        await createTodo(user._id, {
            deletedAt: new Date()
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                showDeleted: 'All'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.data).toHaveLength(3)
    })


    it('should filter todos by priority', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        await createTodo(user._id, {
            priority: 3
        })

        await createTodo(user._id, {
            priority: 5
        })

        await createTodo(user._id, {
            priority: 3
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                priority: 3
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.data).toHaveLength(2)

        expect(
            response.body.data.every(
                (todo: any) => todo.priority === 3
            )
        ).toBe(true)
    })


    it('should filter todos by status', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        await createTodo(user._id, {
            status: TodoStatus.PENDING
        })

        await createTodo(user._id, {
            status: TodoStatus.COMPLETED
        })

        await createTodo(user._id, {
            status: TodoStatus.COMPLETED
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                status: TodoStatus.COMPLETED
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.data).toHaveLength(2)

        expect(
            response.body.data.every(
                (todo: any) => todo.status === TodoStatus.COMPLETED
            )
        ).toBe(true)
    })


    it('should search title and description with q', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        await createTodo(user._id, {
            title: 'Learn MongoDB',
            description: 'Database practice'
        })

        await createTodo(user._id, {
            title: 'Learn Express',
            description: 'MongoDB project'
        })

        await createTodo(user._id, {
            title: 'Learn TypeScript',
            description: 'TypeScript practice'
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                q: 'MongoDB'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.data).toHaveLength(2)
    })


    it('should search q case-insensitively', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        await createTodo(user._id, {
            title: 'Learn MongoDB'
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                q: 'mongodb'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.data).toHaveLength(1)
    })


    it('should paginate todos correctly', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        for (let i = 1; i <= 5; i++) {
            await createTodo(user._id, {
                title: `Todo ${i}`
            })
        }

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                page: 2,
                limit: 2
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.data).toHaveLength(2)
    })


    it('should sort by priority ascending', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        await createTodo(user._id, {
            priority: 8
        })

        await createTodo(user._id, {
            priority: 2
        })

        await createTodo(user._id, {
            priority: 5
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                sort: 'PRIORITY',
                sortType: 'ASC'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        const priorities = response.body.data.map(
            (todo: any) => todo.priority
        )

        expect(priorities).toEqual([2, 5, 8])
    })


    it('should sort by priority descending', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        await createTodo(user._id, {
            priority: 8
        })

        await createTodo(user._id, {
            priority: 2
        })

        await createTodo(user._id, {
            priority: 5
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                sort: 'PRIORITY',
                sortType: 'DESC'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        const priorities = response.body.data.map(
            (todo: any) => todo.priority
        )

        expect(priorities).toEqual([8, 5, 2])
    })


    it('should sort by dueDate ascending', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const date1 = new Date('2026-01-01')
        const date2 = new Date('2026-02-01')
        const date3 = new Date('2026-03-01')

        await createTodo(user._id, {
            dueDate: date2
        })

        await createTodo(user._id, {
            dueDate: date3
        })

        await createTodo(user._id, {
            dueDate: date1
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                sort: 'DUEDATE',
                sortType: 'ASC'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        const dates = response.body.data.map(
            (todo: any) => new Date(todo.dueDate).getTime()
        )

        expect(dates).toEqual([
            date1.getTime(),
            date2.getTime(),
            date3.getTime()
        ])
    })


    it('should sort by createdAt ascending', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const todo1 = await createTodo(user._id)
        await new Promise(resolve => setTimeout(resolve, 10))
        const todo2 = await createTodo(user._id)
        await new Promise(resolve => setTimeout(resolve, 10))
        const todo3 = await createTodo(user._id)

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                sort: 'CREATEDAT',
                sortType: 'ASC'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        const ids = response.body.data.map(
            (todo: any) => todo._id
        )

        expect(ids).toEqual([
            todo1._id.toString(),
            todo2._id.toString(),
            todo3._id.toString()
        ])
    })


    it('should filter by createdAt range', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                from: '2026-01-01',
                to: '2026-12-31'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)
    })


    it('should filter by dueDate range', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        await createTodo(user._id, {
            dueDate: new Date('2026-06-15')
        })

        await createTodo(user._id, {
            dueDate: new Date('2027-06-15')
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                dueFrom: '2026-01-01',
                dueTo: '2026-12-31'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.data).toHaveLength(1)
    })


    it('should reject when from is greater than to', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                from: '2026-12-31',
                to: '2026-01-01'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(400)
    })


    it('should reject when dueFrom is greater than dueTo', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                dueFrom: '2026-12-31',
                dueTo: '2026-01-01'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(400)
    })


    it('should reject limit greater than 30', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                limit: 31
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(400)
    })


    it('should reject invalid page', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                page: 0
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(400)
    })


    it('should reject invalid priority', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                priority: 11
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(400)
    })


    it('should reject invalid status', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                status: 'INVALID_STATUS'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(400)
    })


    it('should reject invalid showDeleted value', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                showDeleted: 'INVALID'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(400)
    })


    it('should reject invalid sort', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                sort: 'INVALID_SORT'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(400)
    })


    it('should reject invalid sortType', async () => {
        const { accessToken } = await createAuthenticatedUser()

        const response = await request(app)
            .get('/api/v1/todos')
            .query({
                sortType: 'INVALID_SORT_TYPE'
            })
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(400)
    })


    it('should reject request without access token', async () => {
        const response = await request(app)
            .get('/api/v1/todos')

        expect(response.status).toBe(401)
    })


    it('should reject invalid access token', async () => {
        const response = await request(app)
            .get('/api/v1/todos')
            .set(
                'Authorization',
                `Bearer ${createInvalidAccessToken()}`
            )

        expect(response.status).toBe(401)
    })


    it('should never return another user todos', async () => {
        const { user, accessToken } = await createAuthenticatedUser()

        const anotherUser = await createTestUser()

        await createTodo(user._id, {
            title: 'My Todo'
        })

        await createTodo(anotherUser._id, {
            title: 'Another User Todo'
        })

        const response = await request(app)
            .get('/api/v1/todos')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.data).toHaveLength(1)

        expect(response.body.data[0].title)
            .toBe('My Todo')
    })
})