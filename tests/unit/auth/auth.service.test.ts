import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../../../src/repository/auth.repository.js', () => ({
    default: {
        getUserById : vi.fn(),
        getUserByUsername: vi.fn(),
        getUserPassword : vi.fn(),
        createUser: vi.fn(),
        changePassword : vi.fn()
    }
}))

vi.mock('../../../src/services/token.service.js', () => ({
    default: {
        generateTokens: vi.fn(),
        verifyRefreshToken: vi.fn(),
        refreshTokens: vi.fn(),
        revokeRefreshTokenSession: vi.fn(),
    }
}))

vi.mock('argon2', () => ({
    default: {
        hash: vi.fn(),
        verify : vi.fn()
    }
}))

vi.mock('../../../src/repository/session.repository.js', () => ({
    default: {
        deleteSessions: vi.fn(),
        getSession: vi.fn(),
    }
}))

import authService from '../../../src/services/auth.service.js'
import { Types } from 'mongoose'
import authRepository from '../../../src/repository/auth.repository.js'
import argon2 from 'argon2'
import tokenService from '../../../src/services/token.service.js'
import { BadRequestError, ConflictError, ForbiddenError } from '../../../src/utils/appError.js'
import sessionRepository from '../../../src/repository/session.repository.js'
import { ChangePasswordDto } from '../../../src/validations/auth.validation.js'

beforeEach(() => {
    vi.clearAllMocks()
})

describe('AuthService.register', () => {

    test('should register a new user successfully', async () => {

        const registerData = {
            fullname: 'Erfan Kalantar',
            username: 'erfankal',
            password: '12345678',
        }

        const userId = new Types.ObjectId()

        const tokens = {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
        }

        vi.mocked(authRepository.getUserByUsername)
            .mockResolvedValue(null)

        vi.mocked(argon2.hash)
            .mockResolvedValue('hashed-password')

        vi.mocked(authRepository.createUser)
            .mockResolvedValue({
                _id: userId,
            } as any)

        vi.mocked(tokenService.generateTokens)
            .mockResolvedValue(tokens)

        const result = await authService.register(
            registerData,
            'Mozilla/5.0'
        )

        expect(authRepository.getUserByUsername)
            .toHaveBeenCalledWith('erfankal')

        expect(argon2.hash)
            .toHaveBeenCalledWith('12345678')

        expect(authRepository.createUser)
            .toHaveBeenCalledWith({
                fullname: 'Erfan Kalantar',
                username: 'erfankal',
                password: 'hashed-password',
            })

        expect(tokenService.generateTokens)
            .toHaveBeenCalledWith(
                userId,
                'unknown'
            )

        expect(result).toEqual({
            userId,
            tokens,
        })
    })

    test('should throw ConflictError if username already exists', async () => {
        const registerData = {
            fullname: 'Erfan Kalantar',
            username: 'erfankal',
            password: '12345678',
        }

        const existingUser = {
            _id: new Types.ObjectId(),
            username: 'erfankal',
        }

        vi.mocked(authRepository.getUserByUsername)
            .mockResolvedValue(existingUser as any)

        await expect(
            authService.register(
                registerData,
                'Mozilla/5.0'
            )
        ).rejects.toBeInstanceOf(ConflictError)

        expect(authRepository.getUserByUsername)
            .toHaveBeenCalledWith('erfankal')

        expect(argon2.hash)
            .not.toHaveBeenCalled()

        expect(authRepository.createUser)
            .not.toHaveBeenCalled()

        expect(tokenService.generateTokens)
            .not.toHaveBeenCalled()
    })
})

describe('AuthService.login', () => {

    test('should throw BadRequestError if username does not exist', async () => {
        const loginData = {
            username: 'erfankal',
            password: '12345678',
        }

        vi.mocked(authRepository.getUserByUsername)
            .mockResolvedValue(null)

        await expect(
            authService.login(
                loginData,
                'Mozilla/5.0'
            )
        ).rejects.toBeInstanceOf(BadRequestError)

        expect(authRepository.getUserByUsername)
            .toHaveBeenCalledWith('erfankal')

        expect(argon2.verify)
            .not.toHaveBeenCalled()

        expect(sessionRepository.deleteSessions)
            .not.toHaveBeenCalled()

        expect(tokenService.generateTokens)
            .not.toHaveBeenCalled()
    })

    test('should throw ForbiddenError if user is deactivated', async () => {
        const loginData = {
            username: 'erfankal',
            password: '12345678',
        }

        const user = {
            _id: new Types.ObjectId(),
            username: 'erfankal',
            password: 'hashed-password',
            active: false,
        }

        vi.mocked(authRepository.getUserByUsername)
            .mockResolvedValue(user as any)

        await expect(
            authService.login(
                loginData,
                'Mozilla/5.0'
            )
        ).rejects.toBeInstanceOf(ForbiddenError)

        expect(authRepository.getUserByUsername)
            .toHaveBeenCalledWith('erfankal')

        expect(argon2.verify)
            .not.toHaveBeenCalled()

        expect(sessionRepository.deleteSessions)
            .not.toHaveBeenCalled()

        expect(tokenService.generateTokens)
            .not.toHaveBeenCalled()
    })

    test('should throw BadRequestError if password is incorrect', async () => {
        const loginData = {
            username: 'erfankal',
            password: 'wrong-password',
        }

        const user = {
            _id: new Types.ObjectId(),
            username: 'erfankal',
            active: true,
        }

        vi.mocked(authRepository.getUserByUsername)
            .mockResolvedValue(user as any)

        vi.mocked(authRepository.getUserPassword)
            .mockResolvedValue('hashed-password' as any)

        vi.mocked(argon2.verify)
            .mockResolvedValue(false)

        await expect(
            authService.login(
                loginData,
                'Mozilla/5.0'
            )
        ).rejects.toBeInstanceOf(BadRequestError)

        expect(authRepository.getUserByUsername)
            .toHaveBeenCalledWith('erfankal')

        expect(argon2.verify)
            .toHaveBeenCalledWith(
                'hashed-password',
                'wrong-password'
            )

        expect(sessionRepository.deleteSessions)
            .not.toHaveBeenCalled()

        expect(tokenService.generateTokens)
            .not.toHaveBeenCalled()
    })

    test('should login successfully', async () => {
        const loginData = {
            username: 'erfankal',
            password: '12345678',
        }

        const userId = new Types.ObjectId()

        const user = {
            _id: userId,
            username: 'erfankal',
            active: true,
        }

        const tokens = {
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
        }

        vi.mocked(authRepository.getUserByUsername)
            .mockResolvedValue(user as any)

        vi.mocked(authRepository.getUserPassword)
            .mockResolvedValue('hashed-password')

        vi.mocked(argon2.verify)
            .mockResolvedValue(true)

        vi.mocked(sessionRepository.deleteSessions)
            .mockResolvedValue(true)

        vi.mocked(tokenService.generateTokens)
            .mockResolvedValue(tokens)

        const result = await authService.login(
            loginData,
            'Mozilla/5.0'
        )

        expect(authRepository.getUserByUsername)
            .toHaveBeenCalledWith('erfankal')

        expect(argon2.verify)
            .toHaveBeenCalledWith(
                'hashed-password',
                '12345678'
            )

        expect(sessionRepository.deleteSessions)
            .toHaveBeenCalledWith(
                userId,
                'unknown'
            )

        expect(tokenService.generateTokens)
            .toHaveBeenCalledWith(
                userId,
                'unknown'
            )

        expect(result).toEqual({
            userId,
            tokens,
        })
    })
})

describe('AuthService.refresh', () => {

    test('should throw BadRequestError if session does not exist', async () => {

        const refreshToken = 'refresh-token'

        const userId = new Types.ObjectId()
        const jti = 'test-jti'

        vi.mocked(tokenService.verifyRefreshToken)
            .mockReturnValue({
                userId,
                jti,
            } as any)

        vi.mocked(sessionRepository.getSession)
            .mockResolvedValue(null)

        await expect(
            authService.refresh(
                refreshToken,
                'Mozilla/5.0'
            )
        ).rejects.toBeInstanceOf(BadRequestError)

        expect(tokenService.verifyRefreshToken)
            .toHaveBeenCalledWith(refreshToken)

        expect(sessionRepository.getSession)
            .toHaveBeenCalledWith(
                userId,
                jti
            )

        expect(argon2.verify)
            .not.toHaveBeenCalled()

        expect(tokenService.refreshTokens)
            .not.toHaveBeenCalled()
    })

    test('should throw BadRequestError if refresh token is invalid', async () => {
        const refreshToken = 'invalid-refresh-token'

        const userId = new Types.ObjectId()
        const jti = 'test-jti'

        const session = {
            userId,
            jti,
            refreshTokenHash: 'hashed-refresh-token',
        }

        vi.mocked(tokenService.verifyRefreshToken)
            .mockReturnValue({
                userId,
                jti,
            } as any)

        vi.mocked(sessionRepository.getSession)
            .mockResolvedValue(session as any)

        vi.mocked(argon2.verify)
            .mockResolvedValue(false)

        await expect(
            authService.refresh(
                refreshToken,
                'Mozilla/5.0'
            )
        ).rejects.toBeInstanceOf(BadRequestError)

        expect(tokenService.verifyRefreshToken)
            .toHaveBeenCalledWith(refreshToken)

        expect(sessionRepository.getSession)
            .toHaveBeenCalledWith(
                userId,
                jti
            )

        expect(argon2.verify)
            .toHaveBeenCalledWith(
                'hashed-refresh-token',
                refreshToken
            )

        expect(tokenService.refreshTokens)
            .not.toHaveBeenCalled()
    })

    test('should refresh tokens successfully', async () => {
        const refreshToken = 'refresh-token'

        const userId = new Types.ObjectId()
        const jti = 'test-jti'

        const session = {
            userId,
            jti,
            refreshTokenHash: 'hashed-refresh-token',
        }

        const tokens = {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
        }

        vi.mocked(tokenService.verifyRefreshToken)
            .mockReturnValue({
                userId,
                jti,
            } as any)

        vi.mocked(sessionRepository.getSession)
            .mockResolvedValue(session as any)

        vi.mocked(argon2.verify)
            .mockResolvedValue(true)

        vi.mocked(tokenService.refreshTokens)
            .mockResolvedValue(tokens)

        const result = await authService.refresh(
            refreshToken,
            'Mozilla/5.0'
        )

        expect(tokenService.verifyRefreshToken)
            .toHaveBeenCalledWith(refreshToken)

        expect(sessionRepository.getSession)
            .toHaveBeenCalledWith(
                userId,
                jti
            )

        expect(argon2.verify)
            .toHaveBeenCalledWith(
                'hashed-refresh-token',
                refreshToken
            )

        expect(tokenService.refreshTokens)
            .toHaveBeenCalledWith(
                userId,
                'unknown',
                jti
            )

        expect(result).toEqual({
            userId,
            tokens,
        })
    })
})

describe('AuthService.changePassword', () => {

    test('should throw BadRequestError because the passwords are the same', async () => {
        const userId = new Types.ObjectId()

        const changePasswordData = {
            oldPassword : 'old-password',
            newPassword : 'old-password'
        } as ChangePasswordDto

        await expect(authService.changePassword(userId, changePasswordData))
            .rejects.toBeInstanceOf(BadRequestError)

        expect(authRepository.getUserById)
            .not.toHaveBeenCalled()

        expect(argon2.verify)
            .not.toHaveBeenCalled()

        expect(argon2.hash)
            .not.toHaveBeenCalled()

        expect(authRepository.changePassword)
            .not.toHaveBeenCalled()
    })

    test('should throw BadRequestError because the old-password is incorrect', async () => {
        const userId = new Types.ObjectId()

        const changePasswordData = {
            oldPassword : 'wrong-old-password',
            newPassword : 'new-password'
        } as ChangePasswordDto

        vi.mocked(authRepository.getUserById)
            .mockResolvedValue({} as any)

        vi.mocked(authRepository.getUserPassword)
            .mockResolvedValue('hashed-old-password')

        vi.mocked(argon2.verify)
            .mockResolvedValue(false)

        await expect(authService.changePassword(userId, changePasswordData))
            .rejects.toBeInstanceOf(BadRequestError)

        expect(authRepository.getUserById)
            .toHaveBeenCalledWith(userId)

        expect(argon2.verify)
            .toHaveBeenCalledWith(
                'hashed-old-password',
                'wrong-old-password'
            )

        expect(argon2.hash)
            .not.toHaveBeenCalled()

        expect(authRepository.changePassword)
            .not.toHaveBeenCalled()
    })

    test('should throw BadRequestError because authRepository.changePassword return false', async () => {
        const userId = new Types.ObjectId()

        const changePasswordData = {
            oldPassword : 'old-password',
            newPassword : 'new-password'
        } as ChangePasswordDto

        vi.mocked(authRepository.getUserById)
            .mockResolvedValue({} as any)

        vi.mocked(authRepository.getUserPassword)
            .mockResolvedValue('hashed-old-password')

        vi.mocked(argon2.verify)
            .mockResolvedValue(true)

        vi.mocked(argon2.hash)
            .mockResolvedValue('hashed-new-password')

        vi.mocked(authRepository.changePassword)
            .mockResolvedValue(false)

        await expect(authService.changePassword(userId, changePasswordData))
            .rejects.toBeInstanceOf(BadRequestError)

        expect(authRepository.getUserById)
            .toHaveBeenCalledWith(userId)

        expect(argon2.verify)
            .toHaveBeenCalledWith(
                'hashed-old-password',
                'old-password'
            )

        expect(argon2.hash)
            .toHaveBeenCalledWith('new-password')

        expect(authRepository.changePassword)
            .toHaveBeenCalledWith(
                userId,
                'hashed-new-password'
            )
    })

    test('should change password successfully', async () => {
        const userId = new Types.ObjectId()

        const changePasswordData = {
            oldPassword : 'old-password',
            newPassword : 'new-password'
        } as ChangePasswordDto

        vi.mocked(authRepository.getUserById)
            .mockResolvedValue({} as any)

        vi.mocked(authRepository.getUserPassword)
            .mockResolvedValue('hashed-old-password')

        vi.mocked(argon2.verify)
            .mockResolvedValue(true)

        vi.mocked(argon2.hash)
            .mockResolvedValue('hashed-new-password')

        vi.mocked(authRepository.changePassword)
            .mockResolvedValue(true)

        const result = await authService.changePassword(userId, changePasswordData)

        expect(authRepository.getUserById)
            .toHaveBeenCalledWith(userId)

        expect(argon2.verify)
            .toHaveBeenCalledWith(
                'hashed-old-password',
                'old-password'
            )

        expect(argon2.hash)
            .toHaveBeenCalledWith('new-password')

        expect(authRepository.changePassword)
            .toHaveBeenCalledWith(
                userId,
                'hashed-new-password'
            )

        expect(result).toBe(undefined)
    })
})

describe('AuthService.logout', () => {

    test('should logout successfully', async () => {
        const userId = new Types.ObjectId()
        const jti = 'test-jti'

        vi.mocked(tokenService.revokeRefreshTokenSession)
            .mockResolvedValue()

        await authService.logout(
            userId,
            jti
        )

        expect(tokenService.revokeRefreshTokenSession)
            .toHaveBeenCalledWith(
                userId,
                jti
            )
    })
})

describe('AuthService.logoutAll', () => {

    test('should logout from all sessions successfully', async () => {
        const userId = new Types.ObjectId()

        vi.mocked(sessionRepository.deleteSessions)
            .mockResolvedValue(true)

        await authService.logoutAll(userId)

        expect(sessionRepository.deleteSessions)
            .toHaveBeenCalledWith(userId)
    })
})