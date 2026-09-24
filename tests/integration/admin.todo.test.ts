import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { Types } from 'mongoose'
import argon2 from 'argon2'
import { randomUUID } from 'crypto'

import app from '../../src/app.js'

import { User, Todo, Audit } from '../../src/models/index.js'

import sessionRepository from '../../src/repository/session.repository.js'
import tokenService from '../../src/services/token.service.js'

import { TodoStatus } from '../../src/types/todo.enum.js'
import { AuditAction, AuditEntityType } from '../../src/types/audit.enum.js'

const createTestUser = async (
    overrides: Partial<{
        username: string
        fullname: string
        role: 'Admin' | 'User'
        active: boolean
        deletedAt: Date | null
    }> = {}
) => {

    const username =
        overrides.username ??
        `user_${randomUUID().slice(0, 8)}`

    const passwordHash = await argon2.hash('Test1234!')

    const user = await User.create({
        username,
        fullname: overrides.fullname ?? 'Test User',
        password: passwordHash,
        role: overrides.role ?? 'User',
        active: overrides.active ?? true,
        deletedAt: overrides.deletedAt ?? null
    })

    return user
}


const createAuthenticatedUser = async (
    role: 'Admin' | 'User' = 'User'
) => {

    const user = await createTestUser({ role })

    const jti = randomUUID()

    const refreshTokenHash =
        await argon2.hash('test-refresh-token')

    await sessionRepository.createSession(
        user._id,
        jti,
        refreshTokenHash,
        '1d',
        'test-device'
    )

    const accessToken =
        tokenService.generateAccessToken(user._id, jti)

    return {
        user,
        accessToken,
        jti
    }
}


const createTestTodo = async (
    userId: Types.ObjectId,
    overrides: Partial<{
        title: string
        description: string
        status: TodoStatus
        priority: number
        dueDate: Date
        deletedAt: Date | null
    }> = {}
) => {

    const todo = await Todo.create({
        userId,

        title:
            overrides.title ??
            `Todo ${randomUUID().slice(0, 8)}`,

        description:
            overrides.description ??
            'Test todo description',

        status:
            overrides.status ??
            TodoStatus.PENDING,

        priority:
            overrides.priority ??
            5,

        dueDate:
            overrides.dueDate ??
            new Date(Date.now() + 24 * 60 * 60 * 1000),

        deletedAt:
            overrides.deletedAt ??
            null
    })

    return todo
}


const createAdmin = async () => {
    return await createAuthenticatedUser('Admin')
}


const createNormalUser = async () => {
    return await createAuthenticatedUser('User')
}

describe('Admin Todo Routes', () => {

    describe('GET /api/v1/admin/todos', () => {

        it('should get all todos as admin', async () => {

            const { accessToken, user } =
                await createAdmin()

            await createTestTodo(user._id)
            await createTestTodo(user._id)

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(200)

            expect(response.body).toBeDefined()
        })


        it('should return todos from multiple users', async () => {

            const admin =
                await createAdmin()

            const user1 =
                await createTestUser({
                    username: `user1_${randomUUID().slice(0, 8)}`
                })

            const user2 =
                await createTestUser({
                    username: `user2_${randomUUID().slice(0, 8)}`
                })

            await createTestTodo(user1._id)
            await createTestTodo(user2._id)

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(200)

            expect(response.body).toBeDefined()
        })


        it('should filter todos by username', async () => {

            const admin =
                await createAdmin()

            const user1 =
                await createTestUser({
                    username: `target_${randomUUID().slice(0, 8)}`
                })

            const user2 =
                await createTestUser({
                    username: `other_${randomUUID().slice(0, 8)}`
                })

            await createTestTodo(user1._id, {
                title: 'Target Todo'
            })

            await createTestTodo(user2._id, {
                title: 'Other Todo'
            })

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        username: user1.username
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(200)

            const todos =
                response.body.data ??
                response.body.todos ??
                response.body

            expect(JSON.stringify(todos))
                .toContain('Target Todo')

            expect(JSON.stringify(todos))
                .not
                .toContain('Other Todo')
        })


        it('should return 404 when username does not exist', async () => {

            const admin =
                await createAdmin()

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        username: 'user_that_does_not_exist'
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(404)
        })


        it('should search todos by q', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            await createTestTodo(user._id, {
                title: 'Learn MongoDB'
            })

            await createTestTodo(user._id, {
                title: 'Learn Express'
            })

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        q: 'MongoDB'
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(200)

            expect(
                JSON.stringify(response.body)
            ).toContain('Learn MongoDB')
        })


        it('should filter by priority', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            await createTestTodo(user._id, {
                priority: 10
            })

            await createTestTodo(user._id, {
                priority: 2
            })

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        priority: 10
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(200)

            expect(response.body).toBeDefined()
        })


        it('should filter by status', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            await createTestTodo(user._id, {
                status: TodoStatus.PENDING
            })

            await createTestTodo(user._id, {
                status: TodoStatus.COMPLETED
            })

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        status: TodoStatus.COMPLETED
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(200)

            expect(response.body).toBeDefined()
        })


        it('should return only deleted todos with showDeleted=Yes', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            await createTestTodo(user._id, {
                title: 'Deleted Todo',
                deletedAt: new Date()
            })

            await createTestTodo(user._id, {
                title: 'Active Todo'
            })

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        showDeleted: 'Yes'
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(200)

            expect(
                JSON.stringify(response.body)
            ).toContain('Deleted Todo')
        })


        it('should return both deleted and active todos with showDeleted=All', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            await createTestTodo(user._id, {
                title: 'Deleted Todo',
                deletedAt: new Date()
            })

            await createTestTodo(user._id, {
                title: 'Active Todo'
            })

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        showDeleted: 'All'
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(200)

            expect(response.body).toBeDefined()
        })


        it('should apply pagination', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            for (let i = 0; i < 5; i++) {
                await createTestTodo(user._id)
            }

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        page: 1,
                        limit: 2
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(200)

            expect(response.body).toBeDefined()
        })


        it('should apply sorting', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            await createTestTodo(user._id, {
                priority: 2
            })

            await createTestTodo(user._id, {
                priority: 10
            })

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        sort: 'PRIORITY',
                        sortType: 'ASC'
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(200)

            expect(response.body).toBeDefined()
        })


        it('should reject invalid limit', async () => {

            const admin =
                await createAdmin()

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        limit: 31
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(400)
        })


        it('should reject invalid priority', async () => {

            const admin =
                await createAdmin()

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        priority: 11
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(400)
        })


        it('should reject invalid showDeleted value', async () => {

            const admin =
                await createAdmin()

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        showDeleted: 'Invalid'
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(400)
        })


        it('should reject invalid date range', async () => {

            const admin =
                await createAdmin()

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .query({
                        from: '2026-10-10',
                        to: '2026-10-01'
                    })
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(400)
        })


        it('should reject request without authentication', async () => {

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')

            expect(response.status).toBe(401)
        })


        it('should reject normal user', async () => {

            const { accessToken } =
                await createNormalUser()

            const response =
                await request(app)
                    .get('/api/v1/admin/todos')
                    .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(403)
        })
    })

    describe('GET /api/v1/admin/todos/:todoId', () => {

        it('should get a todo as admin', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .get(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(200)

            expect(
                JSON.stringify(response.body)
            ).toContain(todo.title)
        })


        it('should get a deleted todo as admin', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id, {
                    deletedAt: new Date()
                })

            const response =
                await request(app)
                    .get(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(200)
        })


        it('should return 404 for nonexistent todo', async () => {

            const admin =
                await createAdmin()

            const todoId =
                new Types.ObjectId()

            const response =
                await request(app)
                    .get(`/api/v1/admin/todos/${todoId}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(404)
        })


        it('should reject invalid todo id', async () => {

            const admin =
                await createAdmin()

            const response =
                await request(app)
                    .get('/api/v1/admin/todos/not-an-object-id')
                    .set('Authorization', `Bearer ${admin.accessToken}`)

            expect(response.status).toBe(400)
        })


        it('should reject normal user', async () => {

            const { accessToken } =
                await createNormalUser()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .get(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(403)
        })
    })

    describe('PATCH /api/v1/admin/todos/:todoId', () => {

        it('should change todo title and description', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .patch(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        title: 'Updated Title',
                        description: 'Updated Description',
                        reason: 'Update todo'
                    })

            expect(response.status).toBe(200)

            const updated =
                await Todo.findById(todo._id).lean()

            expect(updated?.title)
                .toBe('Updated Title')

            expect(updated?.description)
                .toBe('Updated Description')
        })


        it('should change todo priority', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id, {
                    priority: 2
                })

            const response =
                await request(app)
                    .patch(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        priority: 9,
                        reason: 'Priority changed'
                    })

            expect(response.status).toBe(200)

            const updated =
                await Todo.findById(todo._id)

            expect(updated?.priority)
                .toBe(9)
        })


        it('should change todo due date', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const newDueDate =
                new Date('2030-01-01T00:00:00.000Z')

            const response =
                await request(app)
                    .patch(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        dueDate: newDueDate.toISOString(),
                        reason: 'Due date changed'
                    })

            expect(response.status).toBe(200)

            const updated =
                await Todo.findById(todo._id)

            expect(updated?.dueDate.getTime())
                .toBe(newDueDate.getTime())
        })


        it('should reject empty update body', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .patch(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        reason: 'No actual change'
                    })

            expect(response.status).toBe(400)
        })


        it('should return 404 when todo does not exist', async () => {

            const admin =
                await createAdmin()

            const response =
                await request(app)
                    .patch(`/api/v1/admin/todos/${new Types.ObjectId()}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        title: 'Updated',
                        reason: 'Update nonexistent todo'
                    })

            expect(response.status).toBe(404)
        })


        it('should reject normal user', async () => {

            const { accessToken } =
                await createNormalUser()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .patch(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({
                        title: 'Updated',
                        reason: 'Trying to update'
                    })

            expect(response.status).toBe(403)
        })
    })

    describe('PATCH /api/v1/admin/todos/:todoId/status', () => {

        it('should change todo status', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id, {
                    status: TodoStatus.PENDING
                })

            const response =
                await request(app)
                    .patch(`/api/v1/admin/todos/${todo._id}/status`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        status: TodoStatus.COMPLETED,
                        reason: 'Completed by admin'
                    })

            expect(response.status).toBe(200)

            const updated =
                await Todo.findById(todo._id)

            expect(updated?.status)
                .toBe(TodoStatus.COMPLETED)
        })


        it('should reject invalid status', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .patch(`/api/v1/admin/todos/${todo._id}/status`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        status: 'INVALID_STATUS',
                        reason: 'Invalid status'
                    })

            expect(response.status).toBe(400)
        })


        it('should return 404 for nonexistent todo', async () => {

            const admin =
                await createAdmin()

            const response =
                await request(app)
                    .patch(`/api/v1/admin/todos/${new Types.ObjectId()}/status`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        status: TodoStatus.COMPLETED,
                        reason: 'Status change'
                    })

            expect(response.status).toBe(404)
        })


        it('should reject status change for deleted todo', async () => {
            const admin = await createAdmin()
            const user = await createTestUser()

            const todo = await createTestTodo(user._id, {
                deletedAt: new Date()
            })

            const response = await request(app)
                .patch(`/api/v1/admin/todos/${todo._id}/status`)
                .set('Authorization', `Bearer ${admin.accessToken}`)
                .send({
                    status: TodoStatus.COMPLETED
                })

            expect(response.status).toBe(400)
        })


        it('should reject normal user', async () => {

            const { accessToken } =
                await createNormalUser()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .patch(`/api/v1/admin/todos/${todo._id}/status`)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({
                        status: TodoStatus.COMPLETED,
                        reason: 'Status change'
                    })

            expect(response.status).toBe(403)
        })
    })

    describe('DELETE /api/v1/admin/todos/:todoId', () => {

        it('should soft delete todo', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .delete(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        reason: 'Todo is no longer needed'
                    })

            expect(response.status).toBe(200)

            const deleted =
                await Todo.findById(todo._id)

            expect(deleted?.deletedAt)
                .not
                .toBeNull()
        })


        it('should reject soft delete without reason', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .delete(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({})

            expect(response.status).toBe(400)
        })


        it('should return 404 when todo does not exist', async () => {

            const admin =
                await createAdmin()

            const response =
                await request(app)
                    .delete(`/api/v1/admin/todos/${new Types.ObjectId()}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        reason: 'Delete nonexistent todo'
                    })

            expect(response.status).toBe(404)
        })


        it('should be idempotent when todo is already deleted', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id, {
                    deletedAt: new Date()
                })

            const response =
                await request(app)
                    .delete(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        reason: 'Delete already deleted todo'
                    })

            expect(response.status).toBe(200)
        })


        it('should reject normal user', async () => {

            const { accessToken } =
                await createNormalUser()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .delete(`/api/v1/admin/todos/${todo._id}`)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({
                        reason: 'Delete todo'
                    })

            expect(response.status).toBe(403)
        })
    })

    describe('POST /api/v1/admin/todos/:todoId/restore', () => {

        it('should restore deleted todo', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id, {
                    deletedAt: new Date()
                })

            const response =
                await request(app)
                    .post(`/api/v1/admin/todos/${todo._id}/restore`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        reason: 'Todo should be restored'
                    })

            expect(response.status).toBe(200)

            const restored =
                await Todo.findById(todo._id)

            expect(restored?.deletedAt)
                .toBeNull()
        })


        it('should be idempotent when todo is already active', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .post(`/api/v1/admin/todos/${todo._id}/restore`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        reason: 'Restore active todo'
                    })

            expect(response.status).toBe(200)
        })


        it('should return 404 for nonexistent todo', async () => {

            const admin =
                await createAdmin()

            const response =
                await request(app)
                    .post(`/api/v1/admin/todos/${new Types.ObjectId()}/restore`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({
                        reason: 'Restore nonexistent todo'
                    })

            expect(response.status).toBe(404)
        })


        it('should reject missing reason', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id, {
                    deletedAt: new Date()
                })

            const response =
                await request(app)
                    .post(`/api/v1/admin/todos/${todo._id}/restore`)
                    .set('Authorization', `Bearer ${admin.accessToken}`)
                    .send({})

            expect(response.status).toBe(400)
        })


        it('should reject normal user', async () => {

            const { accessToken } =
                await createNormalUser()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id, {
                    deletedAt: new Date()
                })

            const response =
                await request(app)
                    .post(`/api/v1/admin/todos/${todo._id}/restore`)
                    .set('Authorization', `Bearer ${accessToken}`)
                    .send({
                        reason: 'Restore todo'
                    })

            expect(response.status).toBe(403)
        })
    })

    describe('DELETE /api/v1/admin/todos/:todoId/hard-delete', () => {

        it('should permanently delete todo', async () => {
            const admin = await createAdmin()
            const user = await createTestUser()

            const todo = await createTestTodo(user._id, {
                deletedAt: new Date()
            })

            const response = await request(app)
                .delete(`/api/v1/admin/todos/${todo._id}/hard-delete`)
                .set('Authorization', `Bearer ${admin.accessToken}`)
                .send({
                    reason: 'Permanent removal'
                })

            expect(response.status).toBe(200)

            const deletedTodo = await Todo.findById(todo._id)

            expect(deletedTodo).toBeNull()
        })


        it('should permanently delete an already soft-deleted todo', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id, {
                    deletedAt: new Date()
                })

            const response =
                await request(app)
                    .delete(
                        `/api/v1/admin/todos/${todo._id}/hard-delete`
                    )
                    .set(
                        'Authorization',
                        `Bearer ${admin.accessToken}`
                    )
                    .send({
                        reason: 'Permanent removal'
                    })

            expect(response.status).toBe(200)

            const deleted =
                await Todo.findById(todo._id)

            expect(deleted)
                .toBeNull()
        })


        it('should return 404 for nonexistent todo', async () => {

            const admin =
                await createAdmin()

            const response =
                await request(app)
                    .delete(
                        `/api/v1/admin/todos/${new Types.ObjectId()}/hard-delete`
                    )
                    .set(
                        'Authorization',
                        `Bearer ${admin.accessToken}`
                    )
                    .send({
                        reason: 'Permanent removal'
                    })

            expect(response.status).toBe(404)
        })


        it('should reject missing reason', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .delete(
                        `/api/v1/admin/todos/${todo._id}/hard-delete`
                    )
                    .set(
                        'Authorization',
                        `Bearer ${admin.accessToken}`
                    )
                    .send({})

            expect(response.status).toBe(400)
        })


        it('should reject normal user', async () => {

            const { accessToken } =
                await createNormalUser()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            const response =
                await request(app)
                    .delete(
                        `/api/v1/admin/todos/${todo._id}/hard-delete`
                    )
                    .set(
                        'Authorization',
                        `Bearer ${accessToken}`
                    )
                    .send({
                        reason: 'Permanent removal'
                    })

            expect(response.status).toBe(403)
        })
    })

    describe('Admin Todo Audit', () => {

        it('should create CHANGE audit when todo is changed', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            await request(app)
                .patch(`/api/v1/admin/todos/${todo._id}`)
                .set(
                    'Authorization',
                    `Bearer ${admin.accessToken}`
                )
                .send({
                    title: 'Updated Todo',
                    reason: 'Change todo'
                })

            const audit =
                await Audit.findOne({
                    entityType: AuditEntityType.TODO,
                    entityId: todo._id,
                    action: AuditAction.CHANGE
                })

            expect(audit)
                .not
                .toBeNull()
        })


        it('should create DELETE audit when todo is soft deleted', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id)

            await request(app)
                .delete(`/api/v1/admin/todos/${todo._id}`)
                .set(
                    'Authorization',
                    `Bearer ${admin.accessToken}`
                )
                .send({
                    reason: 'Delete todo'
                })

            const audit =
                await Audit.findOne({
                    entityType: AuditEntityType.TODO,
                    entityId: todo._id,
                    action: AuditAction.DELETE
                })

            expect(audit)
                .not
                .toBeNull()
        })


        it('should create RESTORE audit when todo is restored', async () => {

            const admin =
                await createAdmin()

            const user =
                await createTestUser()

            const todo =
                await createTestTodo(user._id, {
                    deletedAt: new Date()
                })

            await request(app)
                .post(`/api/v1/admin/todos/${todo._id}/restore`)
                .set(
                    'Authorization',
                    `Bearer ${admin.accessToken}`
                )
                .send({
                    reason: 'Restore todo'
                })

            const audit =
                await Audit.findOne({
                    entityType: AuditEntityType.TODO,
                    entityId: todo._id,
                    action: AuditAction.RESTORE
                })

            expect(audit)
                .not
                .toBeNull()
        })


        it('should create DELETE_HARD audit when todo is permanently deleted', async () => {
            const admin = await createAdmin()
            const user = await createTestUser()

            const todo = await createTestTodo(user._id, {
                deletedAt: new Date()
            })

            const response = await request(app)
                .delete(`/api/v1/admin/todos/${todo._id}/hard-delete`)
                .set('Authorization', `Bearer ${admin.accessToken}`)
                .send({
                    reason: 'Permanent removal'
                })

            expect(response.status).toBe(200)

            const audit = await Audit.findOne({
                entityType: AuditEntityType.TODO,
                entityId: todo._id,
                action: AuditAction.DELETE_HARD
            })

            expect(audit).not.toBeNull()

            expect(audit?.adminId.toString()).toBe(admin.user._id.toString())
            expect(audit?.reason).toBe('Permanent removal')
        })
    })
})