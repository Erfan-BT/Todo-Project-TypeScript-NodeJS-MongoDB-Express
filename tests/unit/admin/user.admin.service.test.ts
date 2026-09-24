import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from 'vitest'

import mongoose, { Types } from 'mongoose'

import userAdminService from '../../../src/services/admin/user.admin.service.js'
import authRepository from '../../../src/repository/auth.repository.js'
import auditRepository from '../../../src/repository/audit.repository.js'
import { UserQuaryBuilder } from '../../../src/builders/user.quary.builder.js'
import argon2 from 'argon2'

import {
    ConflictError,
    ForbiddenError,
    NotFoundError
} from '../../../src/utils/appError.js'

import {
    AuditAction,
    AuditEntityType
} from '../../../src/types/audit.enum.js'
import todoRepository from '../../../src/repository/todo.repository.js'
import { UserTodosState } from '../../../src/types/todo.type.js'
import sessionRepository from '../../../src/repository/session.repository.js'


vi.mock('../../../src/repository/auth.repository.js', () => ({
    default: {
        getAllUsers: vi.fn(),
        getAdminUserById: vi.fn(),
        changeUser: vi.fn(),
        changeAdminPassword: vi.fn(),
        changeUserStatus: vi.fn(),
        deleteUser: vi.fn(),
        restoreUser: vi.fn()
    }
}))


vi.mock('../../../src/repository/audit.repository.js', () => ({
    default: {
        createAudit: vi.fn()
    }
}))

vi.mock('../../../src/repository/todo.repository.js', () => ({
    default: {
        userTodosState: vi.fn()
    }
}))

vi.mock('../../../src/repository/session.repository.js', () => ({
    default: {
        deleteSessions: vi.fn()
    }
}))


vi.mock('../../../src/builders/user.quary.builder.js', () => ({
    UserQuaryBuilder: {
        build: vi.fn()
    }
}))


vi.mock('argon2', () => ({
    default: {
        hash: vi.fn()
    }
}))


describe('UserAdminService', () => {

    const userId = new Types.ObjectId()
    const adminId = new Types.ObjectId()

    const ipAddress = '127.0.0.1'

    const activeUser = {
        _id: userId,
        fullname: 'Erfan Kalantar',
        username: 'erfan',
        password: 'hashed-password',
        role: 'User',
        active: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: null
    }

    const inactiveUser = {
        ...activeUser,
        active: false
    }

    const deletedUser = {
        ...activeUser,
        active: false,
        deletedAt: new Date()
    }

    const state : UserTodosState = {
        active : 1,
        deleted : 3,
        canceled : 1,
        completed : 3,
        overdue : 3,
        pending : 3,
        today : 3,
        upcoming : 3
    }


    const session = {
        withTransaction: vi.fn(),
        endSession: vi.fn()
    }


    beforeEach(() => {

        vi.clearAllMocks()

        session.withTransaction.mockImplementation(
            async (callback: () => Promise<void>) => {
                await callback()
            }
        )

        vi.spyOn(mongoose, 'startSession')
            .mockResolvedValue(session as any)

        vi.mocked(auditRepository.createAudit)
            .mockResolvedValue({} as any)
    })


    afterEach(() => {
        vi.restoreAllMocks()
    })


    describe('getAllUsers', () => {

        it('should return all users', async () => {

            const qs = {
                page: 1,
                limit: 10,
                sort: 'CREATEDAT',
                sortType: 'DESC'
            } as any

            const options = {
                limit: 10,
                skip: 0,
                where: {},
                sort: {
                    createdAt: -1,
                    _id: -1
                }
            }

            const users = [
                activeUser,
                inactiveUser
            ]

            vi.mocked(UserQuaryBuilder.build)
                .mockReturnValue(options as any)

            vi.mocked(authRepository.getAllUsers)
                .mockResolvedValue(users as any)


            const result = await userAdminService.getAllUsers(qs)


            expect(UserQuaryBuilder.build)
                .toHaveBeenCalledOnce()

            expect(UserQuaryBuilder.build)
                .toHaveBeenCalledWith(qs)

            expect(authRepository.getAllUsers)
                .toHaveBeenCalledOnce()

            expect(authRepository.getAllUsers)
                .toHaveBeenCalledWith(
                    options.limit,
                    options.skip,
                    options.where,
                    options.sort
                )

            expect(result)
                .toEqual(users)
        })


        it('should propagate repository error', async () => {

            const qs = {
                page: 1,
                limit: 10,
                sort: 'CREATEDAT',
                sortType: 'DESC'
            } as any

            const options = {
                limit: 10,
                skip: 0,
                where: {},
                sort: {}
            }

            const error = new Error('Database Error')


            vi.mocked(UserQuaryBuilder.build)
                .mockReturnValue(options as any)

            vi.mocked(authRepository.getAllUsers)
                .mockRejectedValue(error)


            await expect(
                userAdminService.getAllUsers(qs)
            ).rejects.toBe(error)
        })
    })


    describe('getUser', () => {

        it('should return user successfully', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(todoRepository.userTodosState)
                .mockResolvedValue(state)


            const result = await userAdminService.getUser(userId)


            expect(authRepository.getAdminUserById)
                .toHaveBeenCalledOnce()

            expect(authRepository.getAdminUserById)
                .toHaveBeenCalledWith(userId)

            expect(todoRepository.userTodosState)
                .toHaveBeenCalledOnce()

            expect(todoRepository.userTodosState)
                .toHaveBeenCalledWith(userId)

            expect(result)
                .toEqual({user : activeUser, state})
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)


            await expect(
                userAdminService.getUser(userId)
            ).rejects.toBeInstanceOf(NotFoundError)


            expect(authRepository.getAdminUserById)
                .toHaveBeenCalledWith(userId)

            expect(todoRepository.userTodosState)
                .not.toHaveBeenCalledWith(userId)
        })


        it('should propagate repository error', async () => {

            const error = new Error('Database Error')

            vi.mocked(authRepository.getAdminUserById)
                .mockRejectedValue(error)


            await expect(
                userAdminService.getUser(userId)
            ).rejects.toBe(error)
        })
    })


    describe('changeUser', () => {

        it('should change fullname and username successfully', async () => {

            const userData = {
                fullname: 'New Name',
                username: 'new_username'
            }


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUser)
                .mockResolvedValue(true)

            vi.mocked(sessionRepository.deleteSessions)
                .mockResolvedValue(true)


            const result = await userAdminService.changeUser(
                userId,
                userData,
                adminId,
                ipAddress
            )


            expect(mongoose.startSession)
                .toHaveBeenCalledOnce()

            expect(session.withTransaction)
                .toHaveBeenCalledOnce()

            expect(authRepository.getAdminUserById)
                .toHaveBeenCalledWith(userId)

            expect(authRepository.changeUser)
                .toHaveBeenCalledWith(
                    userId,
                    userData,
                    session
                )

            expect(sessionRepository.deleteSessions)
                .toHaveBeenCalledWith(
                    userId
                )


            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    {
                        adminId,
                        action: AuditAction.CHANGE,
                        entityType: AuditEntityType.USER,
                        entityId: userId,
                        oldValue: {
                            fullname: activeUser.fullname,
                            username: activeUser.username
                        },
                        newValue: userData,
                        ipAddress
                    },
                    session
                )


            expect(session.endSession)
                .toHaveBeenCalledOnce()


            expect(result)
                .toEqual(userData)
        })


        it('should change only fullname when username is unchanged', async () => {

            const userData = {
                fullname: 'New Name',
                username: activeUser.username
            }

            const expectedData = {
                fullname: 'New Name'
            }


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUser)
                .mockResolvedValue(true)

            vi.mocked(sessionRepository.deleteSessions)
                .mockResolvedValue(true)


            const result = await userAdminService.changeUser(
                userId,
                userData,
                adminId,
                ipAddress
            )


            expect(authRepository.changeUser)
                .toHaveBeenCalledWith(
                    userId,
                    expectedData,
                    session
                )

            expect(sessionRepository.deleteSessions)
                .toHaveBeenCalledWith(
                    userId
                )


            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        adminId,
                        action: AuditAction.CHANGE,
                        entityType: AuditEntityType.USER,
                        entityId: userId,
                        oldValue: {
                            fullname: activeUser.fullname,
                            username: activeUser.username
                        },
                        newValue: expectedData,
                        ipAddress
                    }),
                    session
                )


            expect(result)
                .toEqual(expectedData)
        })


        it('should change only username when fullname is unchanged', async () => {

            const userData = {
                fullname: activeUser.fullname,
                username: 'new_username'
            }

            const expectedData = {
                username: 'new_username'
            }


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUser)
                .mockResolvedValue(true)

            vi.mocked(sessionRepository.deleteSessions)
                .mockResolvedValue(true)


            const result = await userAdminService.changeUser(
                userId,
                userData,
                adminId,
                ipAddress
            )


            expect(authRepository.changeUser)
                .toHaveBeenCalledWith(
                    userId,
                    expectedData,
                    session
                )

            expect(sessionRepository.deleteSessions)
                .toHaveBeenCalledWith(
                    userId
                )


            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        newValue: expectedData
                    }),
                    session
                )


            expect(result)
                .toEqual(expectedData)
        })


        it('should not update repository when nothing changed', async () => {

            const userData = {
                fullname: activeUser.fullname,
                username: activeUser.username
            }


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)


            const result = await userAdminService.changeUser(
                userId,
                userData,
                adminId,
                ipAddress
            )


            expect(authRepository.changeUser)
                .not.toHaveBeenCalled()

            expect(sessionRepository.deleteSessions)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
                .not.toHaveBeenCalled()

            expect(result)
                .toEqual({})
        })


        it('should allow changing deleted user information', async () => {

            const userData = {
                username: 'new_username'
            }


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(deletedUser as any)

            vi.mocked(authRepository.changeUser)
                .mockResolvedValue(true)

            vi.mocked(sessionRepository.deleteSessions)
                .mockResolvedValue(true)


            const result = await userAdminService.changeUser(
                userId,
                userData as any,
                adminId,
                ipAddress
            )


            expect(authRepository.changeUser)
                .toHaveBeenCalledWith(
                    userId,
                    userData,
                    session
                )

            expect(sessionRepository.deleteSessions)
                .toHaveBeenCalledWith(
                    userId
                )


            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    expect.objectContaining({
                        entityId: userId,
                        newValue: userData
                    }),
                    session
                )


            expect(result)
                .toEqual(userData)
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)


            await expect(
                userAdminService.changeUser(
                    userId,
                    {
                        fullname: 'New Name'
                    } as any,
                    adminId,
                    ipAddress
                )
            ).rejects.toBeInstanceOf(NotFoundError)


            expect(authRepository.changeUser)
                .not.toHaveBeenCalled()

            expect(sessionRepository.deleteSessions)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when repository update fails', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUser)
                .mockResolvedValue(false)


            await expect(
                userAdminService.changeUser(
                    userId,
                    {
                        fullname: 'New Name'
                    } as any,
                    adminId,
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ConflictError)

            expect(sessionRepository.deleteSessions)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should propagate audit error and end session', async () => {

            const auditError = new Error('Audit Error')


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUser)
                .mockResolvedValue(true)

            vi.mocked(sessionRepository.deleteSessions)
                .mockResolvedValue(true)

            vi.mocked(auditRepository.createAudit)
                .mockRejectedValue(auditError)


            await expect(
                userAdminService.changeUser(
                    userId,
                    {
                        fullname: 'New Name'
                    } as any,
                    adminId,
                    ipAddress
                )
            ).rejects.toBe(auditError)


            expect(authRepository.changeUser)
                .toHaveBeenCalledWith(
                    userId,
                    {
                        fullname: 'New Name'
                    },
                    session
                )

            expect(sessionRepository.deleteSessions)
                .toHaveBeenCalledWith(
                    userId
                )

            expect(auditRepository.createAudit)
                .toHaveBeenCalledOnce()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })
    })


    describe('changeUserPassword', () => {

        it('should change user password successfully', async () => {

            const newPassword = 'NewPassword123!'
            const hashedPassword = 'new-hashed-password'
            const reason = 'Password reset by admin'


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(argon2.hash)
                .mockResolvedValue(hashedPassword as never)

            vi.mocked(authRepository.changeAdminPassword)
                .mockResolvedValue(true)


            await userAdminService.changeUserPassword(
                userId,
                newPassword,
                adminId,
                reason,
                ipAddress
            )


            expect(argon2.hash)
                .toHaveBeenCalledOnce()

            expect(argon2.hash)
                .toHaveBeenCalledWith(newPassword)


            expect(authRepository.changeAdminPassword)
                .toHaveBeenCalledWith(
                    userId,
                    hashedPassword,
                    session
                )


            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    {
                        adminId,
                        action: AuditAction.CHANGE_PASSWORD,
                        entityType: AuditEntityType.USER,
                        entityId: userId,
                        reason,
                        ipAddress
                    },
                    session
                )


            expect(session.withTransaction)
                .toHaveBeenCalledOnce()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)


            await expect(
                userAdminService.changeUserPassword(
                    userId,
                    'NewPassword123!',
                    adminId,
                    'Admin reset',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(NotFoundError)


            expect(argon2.hash)
                .not.toHaveBeenCalled()

            expect(authRepository.changeAdminPassword)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
                .not.toHaveBeenCalled()
        })


        it('should throw ForbiddenError for deleted user', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(deletedUser as any)


            await expect(
                userAdminService.changeUserPassword(
                    userId,
                    'NewPassword123!',
                    adminId,
                    'Admin reset',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ForbiddenError)


            expect(argon2.hash)
                .not.toHaveBeenCalled()

            expect(authRepository.changeAdminPassword)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when password update fails', async () => {

            const newPassword = 'NewPassword123!'
            const hashedPassword = 'new-hashed-password'


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(argon2.hash)
                .mockResolvedValue(hashedPassword as never)

            vi.mocked(authRepository.changeAdminPassword)
                .mockResolvedValue(false)


            await expect(
                userAdminService.changeUserPassword(
                    userId,
                    newPassword,
                    adminId,
                    'Admin reset',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ConflictError)


            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should propagate audit error', async () => {

            const auditError = new Error('Audit Error')


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(argon2.hash)
                .mockResolvedValue('new-hashed-password' as never)

            vi.mocked(authRepository.changeAdminPassword)
                .mockResolvedValue(true)

            vi.mocked(auditRepository.createAudit)
                .mockRejectedValue(auditError)


            await expect(
                userAdminService.changeUserPassword(
                    userId,
                    'NewPassword123!',
                    adminId,
                    'Admin reset',
                    ipAddress
                )
            ).rejects.toBe(auditError)


            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })
    })


    describe('changeUserStatus', () => {

        it('should activate inactive user', async () => {

            const reason = 'User requested activation'


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(inactiveUser as any)

            vi.mocked(authRepository.changeUserStatus)
                .mockResolvedValue(true)


            const result = await userAdminService.changeUserStatus(
                userId,
                adminId,
                reason,
                ipAddress
            )


            expect(authRepository.changeUserStatus)
                .toHaveBeenCalledWith(
                    userId,
                    false,
                    session
                )


            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    {
                        adminId,
                        action: AuditAction.ACTIVE,
                        entityType: AuditEntityType.USER,
                        entityId: userId,
                        reason,
                        ipAddress
                    },
                    session
                )


            expect(result)
                .toBe(true)

            expect(session.withTransaction)
                .toHaveBeenCalledOnce()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should deactivate active user', async () => {

            const reason = 'Administrative action'


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUserStatus)
                .mockResolvedValue(true)


            const result = await userAdminService.changeUserStatus(
                userId,
                adminId,
                reason,
                ipAddress
            )


            expect(authRepository.changeUserStatus)
                .toHaveBeenCalledWith(
                    userId,
                    true,
                    session
                )


            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    {
                        adminId,
                        action: AuditAction.DEACTIVE,
                        entityType: AuditEntityType.USER,
                        entityId: userId,
                        reason,
                        ipAddress
                    },
                    session
                )


            expect(result)
                .toBe(false)

            expect(session.withTransaction)
                .toHaveBeenCalledOnce()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)


            await expect(
                userAdminService.changeUserStatus(
                    userId,
                    adminId,
                    'Admin action',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(NotFoundError)


            expect(authRepository.changeUserStatus)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()
        })


        it('should throw ForbiddenError for deleted user', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(deletedUser as any)


            await expect(
                userAdminService.changeUserStatus(
                    userId,
                    adminId,
                    'Admin action',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ForbiddenError)


            expect(authRepository.changeUserStatus)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when status update fails', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUserStatus)
                .mockResolvedValue(false)


            await expect(
                userAdminService.changeUserStatus(
                    userId,
                    adminId,
                    'Admin action',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ConflictError)


            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should propagate audit error', async () => {

            const auditError = new Error('Audit Error')


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUserStatus)
                .mockResolvedValue(true)

            vi.mocked(auditRepository.createAudit)
                .mockRejectedValue(auditError)


            await expect(
                userAdminService.changeUserStatus(
                    userId,
                    adminId,
                    'Admin action',
                    ipAddress
                )
            ).rejects.toBe(auditError)


            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })
    })


    describe('deleteUser', () => {

        it('should delete active user successfully', async () => {

            const reason = 'User violation'


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.deleteUser)
                .mockResolvedValue(true)


            await userAdminService.deleteUser(
                userId,
                adminId,
                reason,
                ipAddress
            )


            expect(authRepository.deleteUser)
                .toHaveBeenCalledWith(
                    userId,
                    session
                )


            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    {
                        adminId,
                        action: AuditAction.DELETE,
                        entityType: AuditEntityType.USER,
                        entityId: userId,
                        reason,
                        ipAddress
                    },
                    session
                )


            expect(session.withTransaction)
                .toHaveBeenCalledOnce()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should do nothing when user is already deleted', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(deletedUser as any)


            await userAdminService.deleteUser(
                userId,
                adminId,
                'Delete request',
                ipAddress
            )


            expect(authRepository.deleteUser)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
                .not.toHaveBeenCalled()
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)


            await expect(
                userAdminService.deleteUser(
                    userId,
                    adminId,
                    'Delete request',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(NotFoundError)


            expect(authRepository.deleteUser)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when delete fails', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.deleteUser)
                .mockResolvedValue(false)


            await expect(
                userAdminService.deleteUser(
                    userId,
                    adminId,
                    'Delete request',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ConflictError)


            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should propagate audit error', async () => {

            const auditError = new Error('Audit Error')


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.deleteUser)
                .mockResolvedValue(true)

            vi.mocked(auditRepository.createAudit)
                .mockRejectedValue(auditError)


            await expect(
                userAdminService.deleteUser(
                    userId,
                    adminId,
                    'Delete request',
                    ipAddress
                )
            ).rejects.toBe(auditError)


            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })
    })


    describe('restoreUser', () => {

        it('should restore deleted user successfully', async () => {

            const deletedAt = deletedUser.deletedAt
            const reason = 'User requested restore'


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue({
                    ...deletedUser,
                    deletedAt
                } as any)

            vi.mocked(authRepository.restoreUser)
                .mockResolvedValue(true)


            const result = await userAdminService.restoreUser(
                userId,
                adminId,
                reason,
                ipAddress
            )


            expect(authRepository.restoreUser)
                .toHaveBeenCalledWith(
                    userId,
                    session
                )


            expect(auditRepository.createAudit)
                .toHaveBeenCalledWith(
                    {
                        adminId,
                        action: AuditAction.RESTORE,
                        entityType: AuditEntityType.USER,
                        entityId: userId,
                        reason,
                        ipAddress
                    },
                    session
                )


            expect(result.deletedAt)
                .toBeNull()

            expect(result.active)
                .toBe(true)

            expect(session.withTransaction)
                .toHaveBeenCalledOnce()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should return user without repository update when already active', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)


            const result = await userAdminService.restoreUser(
                userId,
                adminId,
                'Restore request',
                ipAddress
            )


            expect(authRepository.restoreUser)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(mongoose.startSession)
                .not.toHaveBeenCalled()

            expect(result)
                .toEqual(activeUser)
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)


            await expect(
                userAdminService.restoreUser(
                    userId,
                    adminId,
                    'Restore request',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(NotFoundError)


            expect(authRepository.restoreUser)
                .not.toHaveBeenCalled()

            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when restore fails', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(deletedUser as any)

            vi.mocked(authRepository.restoreUser)
                .mockResolvedValue(false)


            await expect(
                userAdminService.restoreUser(
                    userId,
                    adminId,
                    'Restore request',
                    ipAddress
                )
            ).rejects.toBeInstanceOf(ConflictError)


            expect(auditRepository.createAudit)
                .not.toHaveBeenCalled()

            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })


        it('should propagate audit error', async () => {

            const auditError = new Error('Audit Error')


            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(deletedUser as any)

            vi.mocked(authRepository.restoreUser)
                .mockResolvedValue(true)

            vi.mocked(auditRepository.createAudit)
                .mockRejectedValue(auditError)


            await expect(
                userAdminService.restoreUser(
                    userId,
                    adminId,
                    'Restore request',
                    ipAddress
                )
            ).rejects.toBe(auditError)


            expect(session.endSession)
                .toHaveBeenCalledOnce()
        })
    })
})