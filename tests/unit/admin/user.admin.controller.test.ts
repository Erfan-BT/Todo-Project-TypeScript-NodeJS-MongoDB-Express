import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Response, NextFunction } from 'express'

import userAdminController from '../../../src/controllers/admin/user.admin.controller.js'
import userAdminService from '../../../src/services/admin/user.admin.service.js'

vi.mock('../../../src/services/admin/user.admin.service.js', () => ({
    default: {
        getAllUsers: vi.fn(),
        getUser: vi.fn(),
        changeUser: vi.fn(),
        changeUserPassword: vi.fn(),
        changeUserStatus: vi.fn(),
        deleteUser: vi.fn(),
        restoreUser: vi.fn()
    }
}))

describe('UserAdminController', () => {

    let req: any
    let res: Response
    let next: NextFunction

    beforeEach(() => {
        vi.clearAllMocks()

        req = {
            validated: {
                params: {},
                query: {},
                body: {}
            }
        }

        res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis()
        } as unknown as Response

        next = vi.fn()
    })

    describe('getAllUsers', () => {

        it('should return all users successfully', async () => {
            const query = {
                page: 1,
                limit: 10,
                sort: 'CREATEDAT',
                sortType: 'DESC'
            }

            const users = [
                {
                    _id: 'user-1',
                    username: 'erfan',
                    fullname: 'Erfan'
                },
                {
                    _id: 'user-2',
                    username: 'ali',
                    fullname: 'Ali'
                }
            ]

            req.validated.query = query

            vi.mocked(userAdminService.getAllUsers)
                .mockResolvedValue(users as any)

            await userAdminController.getAllUsers(
                req,
                res,
                next
            )

            expect(userAdminService.getAllUsers)
                .toHaveBeenCalledOnce()

            expect(userAdminService.getAllUsers)
                .toHaveBeenCalledWith(query)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'All Users Successfully Found',
                    data: users
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        it('should pass service error to next', async () => {
            const error = new Error('Database Error')

            req.validated.query = {
                page: 1,
                limit: 10
            }

            vi.mocked(userAdminService.getAllUsers)
                .mockRejectedValue(error)

            await userAdminController.getAllUsers(
                req,
                res,
                next
            )

            expect(next)
                .toHaveBeenCalledOnce()

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not.toHaveBeenCalled()

            expect(res.json)
                .not.toHaveBeenCalled()
        })
    })


    describe('getUser', () => {

        it('should return user successfully', async () => {
            const userId = '507f1f77bcf86cd799439011'

            const user = {
                _id: userId,
                username: 'erfan',
                fullname: 'Erfan',
                role: 'User',
                active: true,
                deletedAt: null
            }

            req.validated.params = {
                userId
            }

            vi.mocked(userAdminService.getUser)
                .mockResolvedValue(user as any)

            await userAdminController.getUser(
                req,
                res,
                next
            )

            expect(userAdminService.getUser)
                .toHaveBeenCalledOnce()

            expect(userAdminService.getUser)
                .toHaveBeenCalledWith(userId)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'User Successfully Found',
                    data: user
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        it('should pass service error to next', async () => {
            const error = new Error('User Not Found')

            const userId = '507f1f77bcf86cd799439011'

            req.validated.params = {
                userId
            }

            vi.mocked(userAdminService.getUser)
                .mockRejectedValue(error)

            await userAdminController.getUser(
                req,
                res,
                next
            )

            expect(next)
                .toHaveBeenCalledOnce()

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })


    describe('changeUser', () => {

        it('should change user successfully', async () => {
            const userId = '507f1f77bcf86cd799439011'

            const userData = {
                fullname: 'New Name',
                username: 'new_username'
            }

            const changedData = {
                fullname: 'New Name',
                username: 'new_username'
            }

            req.validated.params = {
                userId
            }

            req.validated.body = userData

            vi.mocked(userAdminService.changeUser)
                .mockResolvedValue(changedData)

            await userAdminController.changeUser(
                req,
                res,
                next
            )

            expect(userAdminService.changeUser)
                .toHaveBeenCalledOnce()

            expect(userAdminService.changeUser)
                .toHaveBeenCalledWith(
                    userId,
                    userData
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'User Successfully Changed',
                    data: changedData
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        it('should pass service error to next', async () => {
            const error = new Error('User Not Changed')

            const userId = '507f1f77bcf86cd799439011'

            req.validated.params = {
                userId
            }

            req.validated.body = {
                fullname: 'New Name'
            }

            vi.mocked(userAdminService.changeUser)
                .mockRejectedValue(error)

            await userAdminController.changeUser(
                req,
                res,
                next
            )

            expect(next)
                .toHaveBeenCalledOnce()

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })


    describe('changeUserPassword', () => {

        it('should change user password successfully', async () => {
            const userId = '507f1f77bcf86cd799439011'

            const newPassword = 'NewPassword123!'

            req.validated.params = {
                userId
            }

            req.validated.body = {
                newPassword
            }

            vi.mocked(userAdminService.changeUserPassword)
                .mockResolvedValue(undefined)

            await userAdminController.changeUserPassword(
                req,
                res,
                next
            )

            expect(userAdminService.changeUserPassword)
                .toHaveBeenCalledOnce()

            expect(userAdminService.changeUserPassword)
                .toHaveBeenCalledWith(
                    userId,
                    newPassword
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'User Password Successfully Changed',
                    data: null
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        it('should pass service error to next', async () => {
            const error = new Error('Can Not Change Password')

            const userId = '507f1f77bcf86cd799439011'

            req.validated.params = {
                userId
            }

            req.validated.body = {
                newPassword: 'NewPassword123!'
            }

            vi.mocked(userAdminService.changeUserPassword)
                .mockRejectedValue(error)

            await userAdminController.changeUserPassword(
                req,
                res,
                next
            )

            expect(next)
                .toHaveBeenCalledOnce()

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })


    describe('changeUserStatus', () => {

        it('should change user status successfully', async () => {
            const userId = '507f1f77bcf86cd799439011'

            req.validated.params = {
                userId
            }

            vi.mocked(userAdminService.changeUserStatus)
                .mockResolvedValue(false)

            await userAdminController.changeUserStatus(
                req,
                res,
                next
            )

            expect(userAdminService.changeUserStatus)
                .toHaveBeenCalledOnce()

            expect(userAdminService.changeUserStatus)
                .toHaveBeenCalledWith(userId)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'User Status Successfully Changed',
                    data: false
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        it('should pass service error to next', async () => {
            const error = new Error('User Status Not Changed')

            const userId = '507f1f77bcf86cd799439011'

            req.validated.params = {
                userId
            }

            vi.mocked(userAdminService.changeUserStatus)
                .mockRejectedValue(error)

            await userAdminController.changeUserStatus(
                req,
                res,
                next
            )

            expect(next)
                .toHaveBeenCalledOnce()

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })


    describe('deleteUser', () => {

        it('should delete user successfully', async () => {
            const userId = '507f1f77bcf86cd799439011'

            req.validated.params = {
                userId
            }

            vi.mocked(userAdminService.deleteUser)
                .mockResolvedValue(undefined)

            await userAdminController.deleteUser(
                req,
                res,
                next
            )

            expect(userAdminService.deleteUser)
                .toHaveBeenCalledOnce()

            expect(userAdminService.deleteUser)
                .toHaveBeenCalledWith(userId)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'User Successfully Deleted',
                    data: null
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        it('should pass service error to next', async () => {
            const error = new Error('User Not Deleted')

            const userId = '507f1f77bcf86cd799439011'

            req.validated.params = {
                userId
            }

            vi.mocked(userAdminService.deleteUser)
                .mockRejectedValue(error)

            await userAdminController.deleteUser(
                req,
                res,
                next
            )

            expect(next)
                .toHaveBeenCalledOnce()

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })


    describe('restoreUser', () => {

        it('should restore user successfully', async () => {
            const userId = '507f1f77bcf86cd799439011'

            const restoredUser = {
                _id: userId,
                username: 'erfan',
                fullname: 'Erfan',
                active: true,
                deletedAt: null
            }

            req.validated.params = {
                userId
            }

            vi.mocked(userAdminService.restoreUser)
                .mockResolvedValue(restoredUser as any)

            await userAdminController.restoreUser(
                req,
                res,
                next
            )

            expect(userAdminService.restoreUser)
                .toHaveBeenCalledOnce()

            expect(userAdminService.restoreUser)
                .toHaveBeenCalledWith(userId)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'User Successfully Restored',
                    data: restoredUser
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        it('should pass service error to next', async () => {
            const error = new Error('User Not Restored')

            const userId = '507f1f77bcf86cd799439011'

            req.validated.params = {
                userId
            }

            vi.mocked(userAdminService.restoreUser)
                .mockRejectedValue(error)

            await userAdminController.restoreUser(
                req,
                res,
                next
            )

            expect(next)
                .toHaveBeenCalledOnce()

            expect(next)
                .toHaveBeenCalledWith(error)
        })
    })
})