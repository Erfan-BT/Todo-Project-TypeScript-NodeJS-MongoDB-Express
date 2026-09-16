import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../src/services/token.service.js', () => ({
    default: {
        verifyAccessToken: vi.fn(),
    },
}))

vi.mock('../../../src/repository/auth.repository.js', () => ({
    default: {
        getUserById: vi.fn(),
    },
}))

vi.mock('../../../src/repository/session.repository.js', () => ({
    default: {
        getSession: vi.fn(),
    },
}))

import { authMiddleware } from '../../../src/middleware/auth.middleware.js'
import tokenService from '../../../src/services/token.service.js'
import authRepository from '../../../src/repository/auth.repository.js'
import sessionRepository from '../../../src/repository/session.repository.js'
import { ForbiddenError, UnauthorizedError } from '../../../src/utils/appError.js'
import { Types } from 'mongoose'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('authMiddleware', () => {

    test('should return UnauthorizedError if authorization header is missing', async () => {

        const req = {
            headers: {},
            logger: {
                error: vi.fn(),
            },
        } as any

        const res = {} as any

        const next = vi.fn()

        await authMiddleware(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

        expect(next).toHaveBeenCalledWith(
            expect.any(UnauthorizedError)
        )

        expect(tokenService.verifyAccessToken)
            .not.toHaveBeenCalled()

        expect(authRepository.getUserById)
            .not.toHaveBeenCalled()

        expect(sessionRepository.getSession)
            .not.toHaveBeenCalled()
    })

    test('should return UnauthorizedError if authorization header is invalid', async () => {

        const req = {
            headers: {
                authorization: 'Token access-token',
            },
            logger: {
                error: vi.fn(),
            },
        } as any

        const res = {} as any

        const next = vi.fn()

        await authMiddleware(req, res, next)

        expect(next).toHaveBeenCalledTimes(1)

        expect(next).toHaveBeenCalledWith(
            expect.any(UnauthorizedError)
        )

        expect(tokenService.verifyAccessToken)
            .not.toHaveBeenCalled()

        expect(authRepository.getUserById)
            .not.toHaveBeenCalled()

        expect(sessionRepository.getSession)
            .not.toHaveBeenCalled()
    })

    test('should return UnauthorizedError if user does not exist', async () => {

        const userId = new Types.ObjectId()
        const jti = 'session-jti'

        const req = {
            headers: {
                authorization: 'Bearer access-token',
            },
            logger: {
                error: vi.fn(),
            },
        } as any

        const res = {} as any
        const next = vi.fn()

        vi.mocked(tokenService.verifyAccessToken)
            .mockReturnValue({
                userId,
                jti,
            } as any)

        vi.mocked(authRepository.getUserById)
            .mockResolvedValue(null)

        await authMiddleware(req, res, next)

        expect(tokenService.verifyAccessToken)
            .toHaveBeenCalledWith('access-token')

        expect(authRepository.getUserById)
            .toHaveBeenCalledWith(userId)

        expect(next)
            .toHaveBeenCalledTimes(1)

        expect(next)
            .toHaveBeenCalledWith(
                expect.any(UnauthorizedError)
            )

        expect(sessionRepository.getSession)
            .not.toHaveBeenCalled()

        expect(req.user)
            .toBeUndefined()
    })

    test('should return ForbiddenError if user is deactivated', async () => {

        const userId = new Types.ObjectId()
        const jti = 'session-jti'

        const req = {
            headers: {
                authorization: 'Bearer access-token',
            },
            logger: {
                error: vi.fn(),
            },
        } as any

        const res = {} as any
        const next = vi.fn()

        vi.mocked(tokenService.verifyAccessToken)
            .mockReturnValue({
                userId,
                jti,
            } as any)

        vi.mocked(authRepository.getUserById)
            .mockResolvedValue({
                username: 'erfankal',
                role: 'User',
                active: false,
            } as any)

        await authMiddleware(req, res, next)

        expect(tokenService.verifyAccessToken)
            .toHaveBeenCalledWith('access-token')

        expect(authRepository.getUserById)
            .toHaveBeenCalledWith(userId)

        expect(next)
            .toHaveBeenCalledTimes(1)

        expect(next)
            .toHaveBeenCalledWith(
                expect.any(ForbiddenError)
            )

        expect(sessionRepository.getSession)
            .not.toHaveBeenCalled()

        expect(req.user)
            .toBeUndefined()
    })

    test('should return UnauthorizedError if session does not exist', async () => {
        const userId = new Types.ObjectId()
        const jti = 'session-jti'

        const req = {
            headers: {
                authorization: 'Bearer access-token',
            },
            logger: {
                error: vi.fn(),
            },
        } as any

        const res = {} as any
        const next = vi.fn()

        vi.mocked(tokenService.verifyAccessToken)
            .mockReturnValue({
                userId,
                jti,
            } as any)

        vi.mocked(authRepository.getUserById)
            .mockResolvedValue({
                username: 'erfankal',
                role: 'User',
                active: true,
            } as any)

        vi.mocked(sessionRepository.getSession)
            .mockResolvedValue(null)

        await authMiddleware(req, res, next)

        expect(sessionRepository.getSession)
            .toHaveBeenCalledWith(userId, jti)

        expect(next)
            .toHaveBeenCalledTimes(1)

        expect(next)
            .toHaveBeenCalledWith(
                expect.any(UnauthorizedError)
            )

        expect(req.user)
            .toBeUndefined()
    })

    test('should return UnauthorizedError if token verification throws an unknown error', async () => {
        const req = {
            headers: {
                authorization: 'Bearer access-token',
            },
            logger: {
                error: vi.fn(),
            },
        } as any

        const res = {} as any
        const next = vi.fn()

        vi.mocked(tokenService.verifyAccessToken)
            .mockImplementation(() => {
                throw new Error('JWT library error')
            })

        await authMiddleware(req, res, next)

        expect(tokenService.verifyAccessToken)
            .toHaveBeenCalledWith('access-token')

        expect(req.logger.error)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(Error),
                }),
                'Auth Middleware Error'
            )

        expect(next)
            .toHaveBeenCalledTimes(1)

        expect(next)
            .toHaveBeenCalledWith(
                expect.any(UnauthorizedError)
            )

        expect(authRepository.getUserById)
            .not.toHaveBeenCalled()

        expect(sessionRepository.getSession)
            .not.toHaveBeenCalled()

        expect(req.user)
            .toBeUndefined()
    })

    test('should authenticate user successfully', async () => {

        const userId = new Types.ObjectId()
        const jti = 'session-jti'

        const req = {
            headers: {
                authorization: 'Bearer access-token',
            },
            logger: {
                error: vi.fn(),
            },
        } as any

        const res = {} as any

        const next = vi.fn()

        vi.mocked(tokenService.verifyAccessToken)
            .mockReturnValue({
                userId,
                jti,
            } as any)

        vi.mocked(authRepository.getUserById)
            .mockResolvedValue({
                username: 'erfankal',
                role: 'User',
                active: true,
            } as any)

        vi.mocked(sessionRepository.getSession)
            .mockResolvedValue({
                userId,
                jti,
            } as any)

        await authMiddleware(req, res, next)

        expect(tokenService.verifyAccessToken)
            .toHaveBeenCalledWith('access-token')

        expect(authRepository.getUserById)
            .toHaveBeenCalledWith(userId)

        expect(sessionRepository.getSession)
            .toHaveBeenCalledWith(userId, jti)

        expect(req.user)
            .toEqual({
                userId,
                jti,
                username: 'erfankal',
                role: 'User',
            })

        expect(next)
            .toHaveBeenCalledTimes(1)

        expect(next)
            .toHaveBeenCalledWith()
    })
})