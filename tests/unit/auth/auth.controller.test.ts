import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../src/services/auth.service.js', () => ({
    default: {
        register: vi.fn(),
        login: vi.fn(),
        refresh: vi.fn(),
        logout: vi.fn(),
        logoutAll: vi.fn(),
    },
}))

import authController from '../../../src/controllers/auth.controller.js'
import authService from '../../../src/services/auth.service.js'
import { AuthRequest } from '../../../src/middleware/auth.middleware.js'
import { Types } from 'mongoose'

describe('AuthController', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('register', () => {

        test('should register user successfully', async () => {
            const registerData = {
                username: 'erfankal',
                password: '12345678',
            }

            const userAgent = 'Mozilla/5.0'

            const data = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            }

            const req = {
                validated: {
                    body: registerData,
                },
                headers: {
                    'user-agent': userAgent,
                },
            } as any

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any

            const next = vi.fn()

            vi.mocked(authService.register)
                .mockResolvedValue(data as any)

            await authController.register(req, res, next)

            expect(authService.register)
                .toHaveBeenCalledWith(
                    registerData,
                    userAgent
                )

            expect(res.status)
                .toHaveBeenCalledWith(201)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Registration Successful',
                    data,
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        test('should pass error to next if register fails', async () => {
            const error = new Error('Register failed')

            const req = {
                validated: {
                    body: {
                        username: 'erfankal',
                        password: '12345678',
                    },
                },
                headers: {
                    'user-agent': 'Mozilla/5.0',
                },
            } as any

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any

            const next = vi.fn()

            vi.mocked(authService.register)
                .mockRejectedValue(error)

            await authController.register(req, res, next)

            expect(next)
                .toHaveBeenCalledTimes(1)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not.toHaveBeenCalled()

            expect(res.json)
                .not.toHaveBeenCalled()
        })
    })

    describe('login', () => {

        test('should login user successfully', async () => {
            const loginData = {
                username: 'erfankal',
                password: '12345678',
            }

            const userAgent = 'Mozilla/5.0'

            const data = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
            }

            const req = {
                validated: {
                    body: loginData,
                },
                headers: {
                    'user-agent': userAgent,
                },
            } as any

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any

            const next = vi.fn()

            vi.mocked(authService.login)
                .mockResolvedValue(data as any)

            await authController.login(req, res, next)

            expect(authService.login)
                .toHaveBeenCalledWith(
                    loginData,
                    userAgent
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Login Successful',
                    data,
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        test('should pass error to next if login fails', async () => {
            const error = new Error('Login failed')

            const req = {
                validated: {
                    body: {
                        username: 'erfankal',
                        password: '12345678',
                    },
                },
                headers: {
                    'user-agent': 'Mozilla/5.0',
                },
            } as any

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any

            const next = vi.fn()

            vi.mocked(authService.login)
                .mockRejectedValue(error)

            await authController.login(req, res, next)

            expect(next)
                .toHaveBeenCalledTimes(1)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not.toHaveBeenCalled()

            expect(res.json)
                .not.toHaveBeenCalled()
        })
    })

    describe('refresh', () => {

        test('should refresh tokens successfully', async () => {
            const refreshToken = 'refresh-token'
            const userAgent = 'Mozilla/5.0'

            const data = {
                userId : new Types.ObjectId(),
                tokens : {
                    accessToken: 'new-access-token',
                    refreshToken: 'new-refresh-token',
                }
                
            }

            const req = {
                validated : {
                    body: {
                        refreshToken,
                    },
                },
                headers: {
                    'user-agent': userAgent,
                },
            } as any

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any

            const next = vi.fn()

            vi.mocked(authService.refresh)
                .mockResolvedValue(data as any)

            await authController.refresh(req, res, next)

            expect(authService.refresh)
                .toHaveBeenCalledWith(
                    refreshToken,
                    userAgent
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'New Tokens Created',
                    data,
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        test('should pass error to next if refresh fails', async () => {
            const error = new Error('Refresh failed')

            const req = {
                validated : {
                    body : {
                        refreshToken: 'refresh-token',
                    }
                },
                headers: {
                    'user-agent': 'Mozilla/5.0',
                },
            } as any

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any

            const next = vi.fn()

            vi.mocked(authService.refresh)
                .mockRejectedValue(error)

            await authController.refresh(req, res, next)

            expect(next)
                .toHaveBeenCalledTimes(1)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not.toHaveBeenCalled()

            expect(res.json)
                .not.toHaveBeenCalled()
        })
    })

    describe('logout', () => {

        test('should logout user successfully', async () => {
            const userId = new (await import('mongoose')).Types.ObjectId()
            const jti = 'session-jti'

            const req = {
                user: {
                    userId,
                    jti,
                    username: 'erfankal',
                    role: 'User',
                },
            } as AuthRequest

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any

            const next = vi.fn()

            vi.mocked(authService.logout)
                .mockResolvedValue(undefined)

            await authController.logout(req, res, next)

            expect(authService.logout)
                .toHaveBeenCalledWith(
                    userId,
                    jti
                )

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Logout Successful',
                    data: null,
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        test('should pass error to next if logout fails', async () => {
            const userId = new (await import('mongoose')).Types.ObjectId()
            const jti = 'session-jti'

            const error = new Error('Logout failed')

            const req = {
                user: {
                    userId,
                    jti,
                    username: 'erfankal',
                    role: 'User',
                },
            } as AuthRequest

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any

            const next = vi.fn()

            vi.mocked(authService.logout)
                .mockRejectedValue(error)

            await authController.logout(req, res, next)

            expect(next)
                .toHaveBeenCalledTimes(1)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not.toHaveBeenCalled()

            expect(res.json)
                .not.toHaveBeenCalled()
        })
    })

    describe('logoutAll', () => {

        test('should logout all sessions successfully', async () => {
            const userId = new (await import('mongoose')).Types.ObjectId()

            const req = {
                user: {
                    userId,
                    jti: 'session-jti',
                    username: 'erfankal',
                    role: 'User',
                },
            } as AuthRequest

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any

            const next = vi.fn()

            vi.mocked(authService.logoutAll)
                .mockResolvedValue(undefined)

            await authController.logoutAll(req, res, next)

            expect(authService.logoutAll)
                .toHaveBeenCalledWith(userId)

            expect(res.status)
                .toHaveBeenCalledWith(200)

            expect(res.json)
                .toHaveBeenCalledWith({
                    success: true,
                    msg: 'Logout From All Devices Successful',
                    data: null,
                })

            expect(next)
                .not.toHaveBeenCalled()
        })

        test('should pass error to next if logoutAll fails', async () => {
            const userId = new (await import('mongoose')).Types.ObjectId()

            const error = new Error('Logout all failed')

            const req = {
                user: {
                    userId,
                    jti: 'session-jti',
                    username: 'erfankal',
                    role: 'User',
                },
            } as AuthRequest

            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn(),
            } as any

            const next = vi.fn()

            vi.mocked(authService.logoutAll)
                .mockRejectedValue(error)

            await authController.logoutAll(req, res, next)

            expect(next)
                .toHaveBeenCalledTimes(1)

            expect(next)
                .toHaveBeenCalledWith(error)

            expect(res.status)
                .not.toHaveBeenCalled()

            expect(res.json)
                .not.toHaveBeenCalled()
        })
    })
})