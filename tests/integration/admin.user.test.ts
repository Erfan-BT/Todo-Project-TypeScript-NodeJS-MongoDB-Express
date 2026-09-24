import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'
import argon2 from 'argon2'
import { randomUUID } from 'crypto'
import { Types } from 'mongoose'

import app from '../../src/app.js'
import { User, Audit } from '../../src/models/index.js'

import sessionRepository from '../../src/repository/session.repository.js'
import tokenService from '../../src/services/token.service.js'


const createTestUser = async (data: Record<string, unknown> = {}) => {
    const password = await argon2.hash('TestPassword123!')

    return await User.create({
        fullname: 'Test User',
        username: `user_${randomUUID().slice(0, 8)}`,
        password,
        role: 'User',
        active: true,
        deletedAt: null,
        ...data
    })
}


const createAuthenticatedUser = async (
    userData: Record<string, unknown> = {}
) => {
    const user = await createTestUser(userData)

    const jti = randomUUID()

    const refreshToken = 'test-refresh-token'

    const refreshTokenHash = await argon2.hash(refreshToken)

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


const createAdmin = async () => {
    return await createAuthenticatedUser({
        fullname: 'Admin User',
        username: `admin_${randomUUID().slice(0, 8)}`,
        role: 'Admin'
    })
}


const createNormalUser = async () => {
    return await createAuthenticatedUser({
        fullname: 'Normal User',
        username: `normal_${randomUUID().slice(0, 8)}`,
        role: 'User'
    })
}


const createUserForAdminTests = async (
    data: Record<string, unknown> = {}
) => {
    return await createTestUser({
        fullname: 'Target User',
        username: `target_${randomUUID().slice(0, 8)}`,
        ...data
    })
}


describe('Admin User Routes', () => {

    describe('Authorization', () => {

        it('should allow an admin to access admin user routes', async () => {
            const { accessToken } = await createAdmin()

            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(200)
        })


        it('should reject a normal user with 403', async () => {
            const { accessToken } = await createNormalUser()

            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(403)
        })


        it('should reject request without access token', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')

            expect(response.status).toBe(401)
        })


        it('should reject an invalid access token', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', 'Bearer invalid-token')

            expect(response.status).toBe(401)
        })


        it('should reject a valid token when its session does not exist', async () => {
            const user = await createTestUser({
                role: 'Admin'
            })

            const jti = randomUUID()

            const accessToken = tokenService.generateAccessToken(
                user._id,
                jti
            )

            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(401)
        })

    })


    describe('GET /api/v1/admin/users', () => {

        it('should return all users for admin', async () => {
            const { accessToken } = await createAdmin()

            await createUserForAdminTests()
            await createUserForAdminTests()

            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(200)

            expect(response.body.success).toBe(true)
            expect(response.body.data).toBeDefined()
        })


        it('should search users by username/fullname', async () => {
            const { accessToken } = await createAdmin()

            await createUserForAdminTests({
                fullname: 'John Doe',
                username: 'john_doe'
            })

            await createUserForAdminTests({
                fullname: 'Another User',
                username: 'another_user'
            })

            const response = await request(app)
                .get('/api/v1/admin/users')
                .query({
                    q: 'john'
                })
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(200)

            const users = response.body.data

            expect(users).toHaveLength(1)
            expect(users[0].username).toBe('john_doe')
        })


        it('should filter users by role', async () => {
            const { accessToken } = await createAdmin()

            await createUserForAdminTests({
                role: 'Admin',
                username: 'another_admin'
            })

            await createUserForAdminTests({
                role: 'User',
                username: 'another_user'
            })

            const response = await request(app)
                .get('/api/v1/admin/users')
                .query({
                    role: 'Admin'
                })
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(200)

            const users = response.body.data

            expect(
                users.every((user: any) => user.role === 'Admin')
            ).toBe(true)
        })


        it('should filter users by active status', async () => {
            const { accessToken } = await createAdmin()

            await createUserForAdminTests({
                username: 'active_user',
                active: true
            })

            await createUserForAdminTests({
                username: 'inactive_user',
                active: false
            })

            const response = await request(app)
                .get('/api/v1/admin/users')
                .query({
                    status: 'true'
                })
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(200)

            const users = response.body.data

            expect(
                users.every((user: any) => user.active === true)
            ).toBe(true)
        })


        it('should filter deleted users', async () => {
            const { accessToken } = await createAdmin()

            await createUserForAdminTests({
                username: 'deleted_user',
                deletedAt: new Date()
            })

            await createUserForAdminTests({
                username: 'active_user',
                deletedAt: null
            })

            const response = await request(app)
                .get('/api/v1/admin/users')
                .query({
                    showDeleted: 'true'
                })
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(200)

            const users = response.body.data

            expect(
                users.every(
                    (user: any) => user.deletedAt !== null
                )
            ).toBe(true)
        })


        it('should reject invalid pagination query', async () => {
            const { accessToken } = await createAdmin()

            const response = await request(app)
                .get('/api/v1/admin/users')
                .query({
                    page: 0
                })
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(400)
        })

    })


    describe('GET /api/v1/admin/users/:userId', () => {

        it('should return user account information', async () => {
            const { accessToken } = await createAdmin()

            const targetUser = await createUserForAdminTests()

            const response = await request(app)
                .get(`/api/v1/admin/users/${targetUser._id}`)
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(200)

            expect(response.body.success).toBe(true)
            expect(response.body.data.user._id).toBe(
                targetUser._id.toString()
            )

            expect(response.body.data.state).toBeDefined()
        })


        it('should return 404 when user does not exist', async () => {
            const { accessToken } = await createAdmin()

            const fakeUserId = new Types.ObjectId()

            const response = await request(app)
                .get(`/api/v1/admin/users/${fakeUserId}`)
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(404)
        })


        it('should reject invalid user id', async () => {
            const { accessToken } = await createAdmin()

            const response = await request(app)
                .get('/api/v1/admin/users/not-an-object-id')
                .set('Authorization', `Bearer ${accessToken}`)

            expect(response.status).toBe(400)
        })

    })


    describe('PATCH /api/v1/admin/users/:userId', () => {

        it('should change user fullname and username', async () => {
            const { accessToken, user: admin } = await createAdmin()

            const targetUser = await createUserForAdminTests({
                fullname: 'Old Name',
                username: 'old_username'
            })

            const response = await request(app)
                .patch(`/api/v1/admin/users/${targetUser._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    fullname: 'New Name',
                    username: 'new_username'
                })

            expect(response.status).toBe(200)

            const updatedUser = await User.findById(targetUser._id)

            expect(updatedUser).not.toBeNull()
            expect(updatedUser!.fullname).toBe('New Name')
            expect(updatedUser!.username).toBe('new_username')


            const audit = await Audit.findOne({
                adminId: admin._id,
                entityType: 'USER',
                entityId: targetUser._id,
                action: 'CHANGE'
            })

            expect(audit).not.toBeNull()

            expect(audit!.oldValue).toMatchObject({
                fullname: 'Old Name',
                username: 'old_username'
            })

            expect(audit!.newValue).toMatchObject({
                fullname: 'New Name',
                username: 'new_username'
            })
        })


        it('should change only fullname', async () => {
            const { accessToken } = await createAdmin()

            const targetUser = await createUserForAdminTests({
                fullname: 'Old Name',
                username: 'same_username'
            })

            const response = await request(app)
                .patch(`/api/v1/admin/users/${targetUser._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    fullname: 'New Name'
                })

            expect(response.status).toBe(200)

            const updatedUser = await User.findById(targetUser._id)

            expect(updatedUser!.fullname).toBe('New Name')
            expect(updatedUser!.username).toBe('same_username')
        })


        it('should reject empty update body', async () => {
            const { accessToken } = await createAdmin()

            const targetUser = await createUserForAdminTests({
                fullname: 'Same Name',
                username: 'same_username'
            })

            const response = await request(app)
                .patch(`/api/v1/admin/users/${targetUser._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({})

            expect(response.status).toBe(400)

            const auditCount = await Audit.countDocuments({
                entityType: 'USER',
                entityId: targetUser._id,
                action: 'CHANGE'
            })

            expect(auditCount).toBe(0)
        })


        it('should return 404 when target user does not exist', async () => {
            const { accessToken } = await createAdmin()

            const fakeUserId = new Types.ObjectId()

            const response = await request(app)
                .patch(`/api/v1/admin/users/${fakeUserId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    fullname: 'New Name'
                })

            expect(response.status).toBe(404)
        })


        it('should reject invalid body', async () => {
            const { accessToken } = await createAdmin()

            const targetUser = await createUserForAdminTests()

            const response = await request(app)
                .patch(`/api/v1/admin/users/${targetUser._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    fullname: ''
                })

            expect(response.status).toBe(400)
        })

    })


    describe('PATCH /api/v1/admin/users/:userId/password', () => {

        it('should change user password', async () => {
            const { accessToken, user: admin } = await createAdmin()

            const oldPassword = 'OldPassword123!'
            const newPassword = 'NewPassword123!'

            const targetUser = await createUserForAdminTests({
                password: await argon2.hash(oldPassword)
            })

            const response = await request(app)
                .patch(`/api/v1/admin/users/${targetUser._id}/password`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    newPassword,
                    reason: 'Password reset requested by user'
                })

            expect(response.status).toBe(200)

            const updatedUser = await User.findById(targetUser._id)

            expect(updatedUser).not.toBeNull()

            const passwordMatches = await argon2.verify(
                updatedUser!.password,
                newPassword
            )

            expect(passwordMatches).toBe(true)


            const oldPasswordMatches = await argon2.verify(
                updatedUser!.password,
                oldPassword
            )

            expect(oldPasswordMatches).toBe(false)


            const audit = await Audit.findOne({
                adminId: admin._id,
                entityType: 'USER',
                entityId: targetUser._id,
                action: 'CHANGE_PASSWORD'
            })

            expect(audit).not.toBeNull()
            expect(audit!.reason).toBe(
                'Password reset requested by user'
            )
        })


        it('should reject password change for deleted user', async () => {
            const { accessToken } = await createAdmin()

            const targetUser = await createUserForAdminTests({
                deletedAt: new Date()
            })

            const response = await request(app)
                .patch(`/api/v1/admin/users/${targetUser._id}/password`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    newPassword: 'NewPassword123!',
                    reason: 'Password reset'
                })

            expect(response.status).toBe(403)
        })


        it('should return 404 when target user does not exist', async () => {
            const { accessToken } = await createAdmin()

            const fakeUserId = new Types.ObjectId()

            const response = await request(app)
                .patch(`/api/v1/admin/users/${fakeUserId}/password`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    newPassword: 'NewPassword123!',
                    reason: 'Password reset'
                })

            expect(response.status).toBe(404)
        })


        it('should reject invalid reason', async () => {
            const { accessToken } = await createAdmin()

            const targetUser = await createUserForAdminTests()

            const response = await request(app)
                .patch(`/api/v1/admin/users/${targetUser._id}/password`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    newPassword: 'NewPassword123!',
                    reason: 'ab'
                })

            expect(response.status).toBe(400)
        })

    })


    describe('PATCH /api/v1/admin/users/:userId/status', () => {

        it('should deactivate an active user', async () => {
            const { accessToken, user: admin } = await createAdmin()

            const targetUser = await createUserForAdminTests({
                active: true
            })

            const response = await request(app)
                .patch(`/api/v1/admin/users/${targetUser._id}/status`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: 'Temporary account deactivation'
                })

            expect(response.status).toBe(200)

            const updatedUser = await User.findById(targetUser._id)

            expect(updatedUser!.active).toBe(false)


            const audit = await Audit.findOne({
                adminId: admin._id,
                entityType: 'USER',
                entityId: targetUser._id,
                action: 'DEACTIVE'
            })

            expect(audit).not.toBeNull()
            expect(audit!.reason).toBe(
                'Temporary account deactivation'
            )
        })


        it('should activate an inactive user', async () => {
            const { accessToken, user: admin } = await createAdmin()

            const targetUser = await createUserForAdminTests({
                active: false
            })

            const response = await request(app)
                .patch(`/api/v1/admin/users/${targetUser._id}/status`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: 'Account reactivation'
                })

            expect(response.status).toBe(200)

            const updatedUser = await User.findById(targetUser._id)

            expect(updatedUser!.active).toBe(true)


            const audit = await Audit.findOne({
                adminId: admin._id,
                entityType: 'USER',
                entityId: targetUser._id,
                action: 'ACTIVE'
            })

            expect(audit).not.toBeNull()
            expect(audit!.reason).toBe(
                'Account reactivation'
            )
        })


        it('should reject status change for deleted user', async () => {
            const { accessToken } = await createAdmin()

            const targetUser = await createUserForAdminTests({
                deletedAt: new Date(),
                active: true
            })

            const response = await request(app)
                .patch(`/api/v1/admin/users/${targetUser._id}/status`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: 'Status change'
                })

            expect(response.status).toBe(403)
        })


        it('should return 404 when target user does not exist', async () => {
            const { accessToken } = await createAdmin()

            const fakeUserId = new Types.ObjectId()

            const response = await request(app)
                .patch(`/api/v1/admin/users/${fakeUserId}/status`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: 'Status change'
                })

            expect(response.status).toBe(404)
        })

    })


    describe('DELETE /api/v1/admin/users/:userId', () => {

        it('should soft delete a user', async () => {
            const { accessToken, user: admin } = await createAdmin()

            const targetUser = await createUserForAdminTests({
                deletedAt: null
            })

            const response = await request(app)
                .delete(`/api/v1/admin/users/${targetUser._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: 'User requested account deletion'
                })

            expect(response.status).toBe(200)

            const deletedUser = await User.findById(targetUser._id)

            expect(deletedUser).not.toBeNull()
            expect(deletedUser!.deletedAt).not.toBeNull()


            const audit = await Audit.findOne({
                adminId: admin._id,
                entityType: 'USER',
                entityId: targetUser._id,
                action: 'DELETE'
            })

            expect(audit).not.toBeNull()
            expect(audit!.reason).toBe(
                'User requested account deletion'
            )
        })


        it('should be idempotent when deleting an already deleted user', async () => {
            const { accessToken } = await createAdmin()

            const deletedAt = new Date()

            const targetUser = await createUserForAdminTests({
                deletedAt
            })

            const response = await request(app)
                .delete(`/api/v1/admin/users/${targetUser._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: 'Delete again'
                })

            expect(response.status).toBe(200)

            const updatedUser = await User.findById(targetUser._id)

            expect(updatedUser!.deletedAt).not.toBeNull()

            const auditCount = await Audit.countDocuments({
                entityType: 'USER',
                entityId: targetUser._id,
                action: 'DELETE'
            })

            expect(auditCount).toBe(0)
        })


        it('should return 404 when target user does not exist', async () => {
            const { accessToken } = await createAdmin()

            const fakeUserId = new Types.ObjectId()

            const response = await request(app)
                .delete(`/api/v1/admin/users/${fakeUserId}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: 'Delete user'
                })

            expect(response.status).toBe(404)
        })


        it('should reject invalid reason', async () => {
            const { accessToken } = await createAdmin()

            const targetUser = await createUserForAdminTests()

            const response = await request(app)
                .delete(`/api/v1/admin/users/${targetUser._id}`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: 'a'
                })

            expect(response.status).toBe(400)
        })

    })


    describe('POST /api/v1/admin/users/:userId/restore', () => {

        it('should restore a deleted user', async () => {
            const { accessToken, user: admin } = await createAdmin()

            const targetUser = await createUserForAdminTests({
                deletedAt: new Date(),
                active: false
            })

            const response = await request(app)
                .post(`/api/v1/admin/users/${targetUser._id}/restore`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: 'User account restored'
                })

            expect(response.status).toBe(200)

            const restoredUser = await User.findById(targetUser._id)

            expect(restoredUser).not.toBeNull()
            expect(restoredUser!.deletedAt).toBeNull()
            expect(restoredUser!.active).toBe(true)


            const audit = await Audit.findOne({
                adminId: admin._id,
                entityType: 'USER',
                entityId: targetUser._id,
                action: 'RESTORE'
            })

            expect(audit).not.toBeNull()
            expect(audit!.reason).toBe(
                'User account restored'
            )
        })


        it('should be idempotent when restoring an active user', async () => {
            const { accessToken } = await createAdmin()

            const targetUser = await createUserForAdminTests({
                deletedAt: null,
                active: true
            })

            const response = await request(app)
                .post(`/api/v1/admin/users/${targetUser._id}/restore`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: 'Restore user'
                })

            expect(response.status).toBe(200)

            const auditCount = await Audit.countDocuments({
                entityType: 'USER',
                entityId: targetUser._id,
                action: 'RESTORE'
            })

            expect(auditCount).toBe(0)
        })


        it('should return 404 when target user does not exist', async () => {
            const { accessToken } = await createAdmin()

            const fakeUserId = new Types.ObjectId()

            const response = await request(app)
                .post(`/api/v1/admin/users/${fakeUserId}/restore`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: 'Restore user'
                })

            expect(response.status).toBe(404)
        })


        it('should reject invalid reason', async () => {
            const { accessToken } = await createAdmin()

            const targetUser = await createUserForAdminTests({
                deletedAt: new Date()
            })

            const response = await request(app)
                .post(`/api/v1/admin/users/${targetUser._id}/restore`)
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    reason: ''
                })

            expect(response.status).toBe(400)
        })

    })

})