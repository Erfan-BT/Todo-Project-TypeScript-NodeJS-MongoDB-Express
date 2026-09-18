import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Types } from 'mongoose'

import userAdminService from '../../../src/services/admin/user.admin.service.js'
import authRepository from '../../../src/repository/auth.repository.js'
import { UserQuaryBuilder } from '../../../src/builders/user.quary.builder.js'
import argon2 from 'argon2'

import {
    ConflictError,
    ForbiddenError,
    NotFoundError
} from '../../../src/utils/appError.js'


vi.mock('../../../src/repository/auth.repository.js', () => ({
    default: {
        getAllUsers: vi.fn(),
        getAdminUserById: vi.fn(),
        changeUser: vi.fn(),
        changePassword: vi.fn(),
        changeUserStatus: vi.fn(),
        deleteUser: vi.fn(),
        restoreUser: vi.fn()
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

    beforeEach(() => {
        vi.clearAllMocks()
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

            const result = await userAdminService.getUser(userId)

            expect(authRepository.getAdminUserById)
                .toHaveBeenCalledOnce()

            expect(authRepository.getAdminUserById)
                .toHaveBeenCalledWith(userId)

            expect(result)
                .toEqual(activeUser)
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)

            await expect(
                userAdminService.getUser(userId)
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(authRepository.getAdminUserById)
                .toHaveBeenCalledWith(userId)
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

        it('should change fullname and username', async () => {

            const userData = {
                fullname: 'New Name',
                username: 'new_username'
            }

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUser)
                .mockResolvedValue(true)

            const result = await userAdminService.changeUser(
                userId,
                userData
            )

            expect(authRepository.getAdminUserById)
                .toHaveBeenCalledWith(userId)

            expect(authRepository.changeUser)
                .toHaveBeenCalledWith(
                    userId,
                    userData
                )

            expect(result)
                .toEqual(userData)
        })


        it('should change only fullname when username is unchanged', async () => {

            const userData = {
                fullname: 'New Name',
                username: activeUser.username
            }

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUser)
                .mockResolvedValue(true)

            const result = await userAdminService.changeUser(
                userId,
                userData
            )

            expect(authRepository.changeUser)
                .toHaveBeenCalledWith(
                    userId,
                    {
                        fullname: 'New Name'
                    }
                )

            expect(result)
                .toEqual({
                    fullname: 'New Name'
                })
        })


        it('should change only username when fullname is unchanged', async () => {

            const userData = {
                fullname: activeUser.fullname,
                username: 'new_username'
            }

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUser)
                .mockResolvedValue(true)

            const result = await userAdminService.changeUser(
                userId,
                userData
            )

            expect(authRepository.changeUser)
                .toHaveBeenCalledWith(
                    userId,
                    {
                        username: 'new_username'
                    }
                )

            expect(result)
                .toEqual({
                    username: 'new_username'
                })
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
                userData
            )

            expect(authRepository.changeUser)
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

            const result = await userAdminService.changeUser(
                userId,
                userData as any
            )

            expect(authRepository.changeUser)
                .toHaveBeenCalledWith(
                    userId,
                    {
                        username: 'new_username'
                    }
                )

            expect(result)
                .toEqual({
                    username: 'new_username'
                })
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)

            await expect(
                userAdminService.changeUser(
                    userId,
                    {
                        fullname: 'New Name'
                    } as any
                )
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(authRepository.changeUser)
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
                    } as any
                )
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('changeUserPassword', () => {

        it('should change user password successfully', async () => {

            const newPassword = 'NewPassword123!'
            const hashedPassword = 'new-hashed-password'

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(argon2.hash)
                .mockResolvedValue(hashedPassword as never)

            vi.mocked(authRepository.changePassword)
                .mockResolvedValue(true)

            await userAdminService.changeUserPassword(
                userId,
                newPassword
            )

            expect(argon2.hash)
                .toHaveBeenCalledOnce()

            expect(argon2.hash)
                .toHaveBeenCalledWith(newPassword)

            expect(authRepository.changePassword)
                .toHaveBeenCalledWith(
                    userId,
                    hashedPassword
                )
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)

            await expect(
                userAdminService.changeUserPassword(
                    userId,
                    'NewPassword123!'
                )
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(argon2.hash)
                .not.toHaveBeenCalled()

            expect(authRepository.changePassword)
                .not.toHaveBeenCalled()
        })


        it('should throw ForbiddenError for deleted user', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(deletedUser as any)

            await expect(
                userAdminService.changeUserPassword(
                    userId,
                    'NewPassword123!'
                )
            ).rejects.toBeInstanceOf(ForbiddenError)

            expect(argon2.hash)
                .not.toHaveBeenCalled()

            expect(authRepository.changePassword)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when password update fails', async () => {

            const newPassword = 'NewPassword123!'
            const hashedPassword = 'new-hashed-password'

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(argon2.hash)
                .mockResolvedValue(hashedPassword as never)

            vi.mocked(authRepository.changePassword)
                .mockResolvedValue(false)

            await expect(
                userAdminService.changeUserPassword(
                    userId,
                    newPassword
                )
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('changeUserStatus', () => {

        it('should activate inactive user', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(inactiveUser as any)

            vi.mocked(authRepository.changeUserStatus)
                .mockResolvedValue(true)

            const result = await userAdminService.changeUserStatus(userId)

            expect(authRepository.changeUserStatus)
                .toHaveBeenCalledWith(
                    userId,
                    false
                )

            expect(result)
                .toBe(true)
        })


        it('should deactivate active user', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUserStatus)
                .mockResolvedValue(true)

            const result = await userAdminService.changeUserStatus(userId)

            expect(authRepository.changeUserStatus)
                .toHaveBeenCalledWith(
                    userId,
                    true
                )

            expect(result)
                .toBe(false)
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)

            await expect(
                userAdminService.changeUserStatus(userId)
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(authRepository.changeUserStatus)
                .not.toHaveBeenCalled()
        })


        it('should throw ForbiddenError for deleted user', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(deletedUser as any)

            await expect(
                userAdminService.changeUserStatus(userId)
            ).rejects.toBeInstanceOf(ForbiddenError)

            expect(authRepository.changeUserStatus)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when status update fails', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.changeUserStatus)
                .mockResolvedValue(false)

            await expect(
                userAdminService.changeUserStatus(userId)
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('deleteUser', () => {

        it('should delete active user successfully', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.deleteUser)
                .mockResolvedValue(true)

            await userAdminService.deleteUser(userId)

            expect(authRepository.deleteUser)
                .toHaveBeenCalledWith(userId)
        })


        it('should do nothing when user is already deleted', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(deletedUser as any)

            await userAdminService.deleteUser(userId)

            expect(authRepository.deleteUser)
                .not.toHaveBeenCalled()
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)

            await expect(
                userAdminService.deleteUser(userId)
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(authRepository.deleteUser)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when delete fails', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            vi.mocked(authRepository.deleteUser)
                .mockResolvedValue(false)

            await expect(
                userAdminService.deleteUser(userId)
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })

    describe('restoreUser', () => {

        it('should restore deleted user successfully', async () => {

            const deletedAt = deletedUser.deletedAt

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue({
                    ...deletedUser,
                    deletedAt
                } as any)

            vi.mocked(authRepository.restoreUser)
                .mockResolvedValue(true)

            const result = await userAdminService.restoreUser(userId)

            expect(authRepository.restoreUser)
                .toHaveBeenCalledWith(userId)

            expect(result.deletedAt)
                .toBeNull()

            expect(result.active)
                .toBe(true)
        })


        it('should return user without repository update when already active', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(activeUser as any)

            const result = await userAdminService.restoreUser(userId)

            expect(authRepository.restoreUser)
                .not.toHaveBeenCalled()

            expect(result)
                .toEqual(activeUser)
        })


        it('should throw NotFoundError when user does not exist', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(null)

            await expect(
                userAdminService.restoreUser(userId)
            ).rejects.toBeInstanceOf(NotFoundError)

            expect(authRepository.restoreUser)
                .not.toHaveBeenCalled()
        })


        it('should throw ConflictError when restore fails', async () => {

            vi.mocked(authRepository.getAdminUserById)
                .mockResolvedValue(deletedUser as any)

            vi.mocked(authRepository.restoreUser)
                .mockResolvedValue(false)

            await expect(
                userAdminService.restoreUser(userId)
            ).rejects.toBeInstanceOf(ConflictError)
        })
    })
})