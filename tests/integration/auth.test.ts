import { describe, it, expect } from 'vitest'
import request from 'supertest'
import argon2 from 'argon2'

import app from '../../src/app.js'
import { Session, User } from '../../src/models/index.js'
import tokenService from '../../src/services/token.service.js'


describe('POST /api/v1/auth/login', () => {

    it('should login successfully with valid credentials', async () => {

        const password = 'Password123'

        const hashedPassword = await argon2.hash(password)

        await User.create({
            fullname: 'Test User',
            username: 'testuser123',
            password: hashedPassword
        })

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'testuser123',
                password
            })

        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)

        expect(response.body.msg).toBe('Login Successful')

        expect(response.body.data).toHaveProperty('userId')

        expect(response.body.data).toHaveProperty('tokens')

        expect(response.body.data.tokens).toHaveProperty('accessToken')

        expect(response.body.data.tokens).toHaveProperty('refreshToken')
    })

    it('should reject login with incorrect username', async () => {

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'unknownuser',
                password: 'Password123'
            })

        expect(response.status).toBe(400)

        expect(response.body.success).toBe(false)
        expect(response.body.msg).toBe('Username Or Password Is Incorrect')
    })

    it('should reject login with incorrect password', async () => {

        await User.create({
            fullname: 'Test User',
            username: 'testuser123',
            password: await argon2.hash('CorrectPassword123')
        })

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'testuser123',
                password: 'WrongPassword123'
            })

        expect(response.status).toBe(400)

        expect(response.body.success).toBe(false)
        expect(response.body.msg).toBe('Username Or Password Is Incorrect')
    })

    it('should reject login for deactivated user', async () => {

        await User.create({
            fullname: 'Test User',
            username: 'testuser123',
            password: await argon2.hash('Password123'),
            active: false
        })

        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'testuser123',
                password: 'Password123'
            })

        expect(response.status).toBe(403)

        expect(response.body.success).toBe(false)
        expect(response.body.msg).toBe('This Account Has Been Deactivated')
    })

    it('should create a session when login is successful', async () => {

        const password = 'Password123'

        const user = await User.create({
            fullname: 'Test User',
            username: 'testuser123',
            password: await argon2.hash(password)
        })


        const response = await request(app)
            .post('/api/v1/auth/login')
            .set('User-Agent', 'Test Browser')
            .send({
                username: 'testuser123',
                password
            })


        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)

        const { accessToken, refreshToken } = response.body.data.tokens

        expect(accessToken).toBeTypeOf('string')
        expect(refreshToken).toBeTypeOf('string')


        // Get created session
        const sessions = await Session.find({
            userId: user._id
        }).lean()


        expect(sessions).toHaveLength(1)

        const session = sessions[0]

        expect(session.userId.toString()).toBe(user._id.toString())

        expect(session.device).toBe('unknown')

        expect(session.jti).toBeTypeOf('string')

        expect(session.refreshTokenHash).toBeTypeOf('string')

        expect(session.refreshTokenHash).not.toBe(refreshToken)
    })

    it('should store a valid hash of the refresh token', async () => {

        const password = 'Password123'

        const user = await User.create({
            fullname: 'Test User',
            username: 'testuser123',
            password: await argon2.hash(password)
        })


        const response = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'testuser123',
                password
            })


        const { refreshToken } = response.body.data.tokens


        const session = await Session.findOne({
            userId: user._id
        }).lean()


        expect(session).not.toBeNull()

        const isValidHash = await argon2.verify(
            session!.refreshTokenHash,
            refreshToken
        )

        expect(isValidHash).toBe(true)
    })

})

describe('POST /api/v1/auth/register', () => {

    it('should register successfully with valid data', async () => {

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullname: 'Test User',
                username: 'testuser123',
                password: 'Password123'
            })


        expect(response.status).toBe(201)

        expect(response.body).toMatchObject({
            success: true,
            msg: 'Registration Successful'
        })

        expect(response.body.data).toHaveProperty('userId')
        expect(response.body.data).toHaveProperty('tokens')

        expect(response.body.data.tokens).toHaveProperty('accessToken')
        expect(response.body.data.tokens).toHaveProperty('refreshToken')


        // Database
        const user = await User.findOne({
            username: 'testuser123'
        }).select('+password').lean()

        expect(user).not.toBeNull()

        expect(user?.fullname).toBe('Test User')
        expect(user?.username).toBe('testuser123')
        expect(user?.role).toBe('User')
        expect(user?.active).toBe(true)
        expect(user?.deletedAt).toBeNull()


        // Password must be hashed
        expect(user?.password).not.toBe('Password123')
    })

    it('should reject duplicate username', async () => {

        await User.create({
            fullname: 'Existing User',
            username: 'testuser123',
            password: 'hashed-password'
        })

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullname: 'Another User',
                username: 'testuser123',
                password: 'Password123'
            })


        expect(response.status).toBe(409)

        expect(response.body.success).toBe(false)

        expect(response.body.msg).toBe('This Username Already Exists')
    })

    it('should reject fullname shorter than 4 characters', async () => {

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullname: 'Ali',
                username: 'testuser123',
                password: 'Password123'
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })


    it('should reject fullname longer than 50 characters', async () => {

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullname: 'A'.repeat(51),
                username: 'testuser123',
                password: 'Password123'
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })


    it('should reject username shorter than 6 characters', async () => {

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullname: 'Test User',
                username: 'user1',
                password: 'Password123'
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })


    it('should reject username longer than 50 characters', async () => {

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullname: 'Test User',
                username: 'u'.repeat(51),
                password: 'Password123'
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })


    it('should reject password shorter than 8 characters', async () => {

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullname: 'Test User',
                username: 'testuser123',
                password: 'Pass123'
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })


    it('should reject password longer than 100 characters', async () => {

        const response = await request(app)
            .post('/api/v1/auth/register')
            .send({
                fullname: 'Test User',
                username: 'testuser123',
                password: 'P'.repeat(101)
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })

})

describe('POST /api/v1/auth/refresh', () => {

    it('should refresh tokens successfully', async () => {

        const password = 'Password123'

        const user = await User.create({
            fullname: 'Test User',
            username: 'testuser123',
            password: await argon2.hash(password)
        })


        // Login
        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'testuser123',
                password
            })


        expect(loginResponse.status).toBe(200)

        const oldRefreshToken =
            loginResponse.body.data.tokens.refreshToken

        expect(oldRefreshToken).toBeTypeOf('string')
        expect(oldRefreshToken.length).toBeGreaterThan(0)

        // Get old session
        const oldSession = await Session.findOne({
            userId: user._id
        }).lean()

        expect(oldSession).not.toBeNull()


        // Refresh
        const response = await request(app)
            .post('/api/v1/auth/refresh')
            .send({
                refreshToken: oldRefreshToken
            })

        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)
        expect(response.body.msg).toBe('New Tokens Created')

        expect(response.body.data).toHaveProperty('userId')
        expect(response.body.data).toHaveProperty('tokens')

        const newRefreshToken =
            response.body.data.tokens.refreshToken

        expect(newRefreshToken).toBeTypeOf('string')
        expect(newRefreshToken).not.toBe(oldRefreshToken)


        // Old session must be deleted
        const deletedOldSession = await Session.findOne({
            _id: oldSession!._id
        })

        expect(deletedOldSession).toBeNull()


        // New session must exist
        const newSession = await Session.findOne({
            userId: user._id
        }).lean()

        expect(newSession).not.toBeNull()

        expect(newSession!.jti).not.toBe(oldSession!.jti)

        expect(
            await argon2.verify(
                newSession!.refreshTokenHash,
                newRefreshToken
            )
        ).toBe(true)
    })

    it('should reject reuse of old refresh token', async () => {
        const user = await User.create({
            fullname: 'Refresh Test User',
            username: 'refreshuser',
            password: await argon2.hash('Password123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'refreshuser',
                password: 'Password123'
            })

        expect(loginResponse.status).toBe(200)

        const oldRefreshToken =
            loginResponse.body.data.tokens.refreshToken

        const refreshResponse = await request(app)
            .post('/api/v1/auth/refresh')
            .send({
                refreshToken: oldRefreshToken
            })

        expect(refreshResponse.status).toBe(200)

        // Try to reuse the old refresh token
        const reuseResponse = await request(app)
            .post('/api/v1/auth/refresh')
            .send({
                refreshToken: oldRefreshToken
            })

        expect(reuseResponse.status).toBe(400)
        expect(reuseResponse.body.success).toBe(false)
    })

    it('should reject refresh with invalid refresh token', async () => {

        const response = await request(app)
            .post('/api/v1/auth/refresh')
            .send({
                refreshToken: 'invalid-refresh-token'
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })

    it('should reject tampered refresh token', async () => {

        await User.create({
            fullname: 'Tampered Token User',
            username: 'tamperedtoken',
            password: await argon2.hash('Password123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'tamperedtoken',
                password: 'Password123'
            })

        expect(loginResponse.status).toBe(200)

        const refreshToken =
            loginResponse.body.data.tokens.refreshToken

        const tamperedToken =
            refreshToken.slice(0, -1) +
            (refreshToken.at(-1) === 'a' ? 'b' : 'a')

        const response = await request(app)
            .post('/api/v1/auth/refresh')
            .send({
                refreshToken: tamperedToken
            })

        expect(response.status).toBe(400)
        expect(response.body.success).toBe(false)
    })

    it('should reject refresh when session does not exist', async () => {

        const user = await User.create({
            fullname: 'Missing Session User',
            username: 'missingsession',
            password: await argon2.hash('Password123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'missingsession',
                password: 'Password123'
            })

        expect(loginResponse.status).toBe(200)

        const refreshToken =
            loginResponse.body.data.tokens.refreshToken

        const decoded =
            tokenService.verifyRefreshToken(refreshToken)

        await Session.deleteOne({
            userId: user._id,
            jti: decoded.jti
        })

        const response = await request(app)
            .post('/api/v1/auth/refresh')
            .send({
                refreshToken
            })

        expect(response.status).toBe(400)

        expect(response.body).toMatchObject({
            success: false,
            msg: 'Session Not Found',
            data: null
        })
    })
})

describe('POST /api/v1/auth/logout', () => {

    it('should logout successfully', async () => {
        const user = await User.create({
            fullname: 'Logout Test User',
            username: 'logoutuser',
            password: await argon2.hash('Password123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'logoutuser',
                password: 'Password123'
            })

        expect(loginResponse.status).toBe(200)

        const accessToken =
            loginResponse.body.data.tokens.accessToken

        const refreshToken =
            loginResponse.body.data.tokens.refreshToken

        const decoded = tokenService.verifyRefreshToken(refreshToken)

        const sessionBeforeLogout = await Session.findOne({
            userId: user._id,
            jti: decoded.jti
        })

        expect(sessionBeforeLogout).not.toBeNull()

        const response = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body).toMatchObject({
            success: true,
            msg: 'Logout Successful',
            data: null
        })

        const sessionAfterLogout = await Session.findOne({
            userId: user._id,
            jti: decoded.jti
        })

        expect(sessionAfterLogout).toBeNull()
    })

    it('should reject logout without access token', async () => {

        const response = await request(app)
            .post('/api/v1/auth/logout')

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)

    })

    it('should reject logout without access token', async () => {

        const response = await request(app)
            .post('/api/v1/auth/logout')

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject logout with invalid access token', async () => {

        const response = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', 'Bearer invalid-access-token')

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject logout with tampered access token', async () => {

        const user = await User.create({
            fullname: 'Logout Tampered User',
            username: 'logouttampered',
            password: await argon2.hash('Password123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'logouttampered',
                password: 'Password123'
            })

        expect(loginResponse.status).toBe(200)

        const accessToken =
            loginResponse.body.data.tokens.accessToken

        const tamperedToken =
            accessToken.slice(0, -1) +
            (accessToken.at(-1) === 'a' ? 'b' : 'a')

        const response = await request(app)
            .post('/api/v1/auth/logout')
            .set('Authorization', `Bearer ${tamperedToken}`)

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

})

describe('POST /api/v1/auth/logout-all', () => {

    it('should logout from all devices successfully', async () => {

        const user = await User.create({
            fullname: 'Logout All User',
            username: 'logoutalluser',
            password: await argon2.hash('Password123')
        })

        const login1 = await request(app)
            .post('/api/v1/auth/login')
            .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1')
            .send({
                username: 'logoutalluser',
                password: 'Password123'
            })

        expect(login1.status).toBe(200)

        const login2 = await request(app)
            .post('/api/v1/auth/login')
            .set('User-Agent', 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36')
            .send({
                username: 'logoutalluser',
                password: 'Password123'
            })

        expect(login2.status).toBe(200)

        const sessionsBeforeLogout =
            await Session.find({
                userId: user._id
            })

        expect(sessionsBeforeLogout).toHaveLength(2)

        const accessToken =
            login1.body.data.tokens.accessToken

        const response = await request(app)
            .post('/api/v1/auth/logout-all')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body).toMatchObject({
            success: true,
            msg: 'Logout From All Devices Successful',
            data: null
        })

        const sessionsAfterLogout =
            await Session.find({
                userId: user._id
            })

        expect(sessionsAfterLogout).toHaveLength(0)
    })

    it('should reject logout-all without access token', async () => {

        const response = await request(app)
            .post('/api/v1/auth/logout-all')

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject logout-all with invalid access token', async () => {

        const response = await request(app)
            .post('/api/v1/auth/logout-all')
            .set('Authorization', 'Bearer invalid-access-token')

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject logout-all with tampered access token', async () => {

        const user = await User.create({
            fullname: 'Logout All Tampered User',
            username: 'logoutalltampered',
            password: await argon2.hash('Password123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'logoutalltampered',
                password: 'Password123'
            })

        expect(loginResponse.status).toBe(200)

        const accessToken =
            loginResponse.body.data.tokens.accessToken

        const tamperedToken =
            accessToken.slice(0, -1) +
            (accessToken.at(-1) === 'a' ? 'b' : 'a')

        const response = await request(app)
            .post('/api/v1/auth/logout-all')
            .set('Authorization', `Bearer ${tamperedToken}`)

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

})

describe('PATCH /api/v1/auth/change-password', () => {

    it('should change password successfully', async () => {

        const user = await User.create({
            fullname: 'Change Password User',
            username: 'changepassworduser',
            password: await argon2.hash('OldPassword123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'changepassworduser',
                password: 'OldPassword123'
            })

        expect(loginResponse.status).toBe(200)

        const accessToken =
            loginResponse.body.data.tokens.accessToken

        const response = await request(app)
            .patch('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                oldPassword: 'OldPassword123',
                newPassword: 'NewPassword123'
            })

        expect(response.status).toBe(200)

        expect(response.body).toMatchObject({
            success: true,
            msg: 'Password Changed Successfully',
            data: null
        })

        const updatedUser = await User.findById(user._id)
            .select('+password')

        expect(updatedUser).not.toBeNull()

        const oldPasswordValid =
            await argon2.verify(
                updatedUser!.password,
                'OldPassword123'
            )

        const newPasswordValid =
            await argon2.verify(
                updatedUser!.password,
                'NewPassword123'
            )

        expect(oldPasswordValid).toBe(false)
        expect(newPasswordValid).toBe(true)
    })

    it('should reject change password when old password is incorrect', async () => {

        const user = await User.create({
            fullname: 'Wrong Old Password',
            username: 'wrongoldpassword',
            password: await argon2.hash('OldPassword123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'wrongoldpassword',
                password: 'OldPassword123'
            })

        const accessToken =
            loginResponse.body.data.tokens.accessToken

        const response = await request(app)
            .patch('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                oldPassword: 'WrongPassword123',
                newPassword: 'NewPassword123'
            })

        expect(response.status).toBe(400)

        expect(response.body).toMatchObject({
            success: false,
            msg: 'The Old Password Is InCorrect',
            data: null
        })
    })

    it('should reject when old and new passwords are the same', async () => {

        const user = await User.create({
            fullname: 'Same Password User',
            username: 'samepassworduser',
            password: await argon2.hash('Password123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'samepassworduser',
                password: 'Password123'
            })

        const accessToken =
            loginResponse.body.data.tokens.accessToken

        const response = await request(app)
            .patch('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
                oldPassword: 'Password123',
                newPassword: 'Password123'
            })

        expect(response.status).toBe(400)

        expect(response.body).toMatchObject({
            success: false,
            msg: 'The Old Password And The New Password Can Not Be The Same',
            data: null
        })
    })

    it('should reject change password without access token', async () => {

        const response = await request(app)
            .patch('/api/v1/auth/change-password')
            .send({
                oldPassword: 'OldPassword123',
                newPassword: 'NewPassword123'
            })

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject change password with invalid access token', async () => {

        const response = await request(app)
            .patch('/api/v1/auth/change-password')
            .set('Authorization', 'Bearer invalid-access-token')
            .send({
                oldPassword: 'OldPassword123',
                newPassword: 'NewPassword123'
            })

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject change password with tampered access token', async () => {

        const user = await User.create({
            fullname: 'Change Password Tampered',
            username: 'changepasswordtampered',
            password: await argon2.hash('OldPassword123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'changepasswordtampered',
                password: 'OldPassword123'
            })

        expect(loginResponse.status).toBe(200)

        const accessToken =
            loginResponse.body.data.tokens.accessToken

        const tamperedToken =
            accessToken.slice(0, -1) +
            (accessToken.at(-1) === 'a' ? 'b' : 'a')

        const response = await request(app)
            .patch('/api/v1/auth/change-password')
            .set('Authorization', `Bearer ${tamperedToken}`)
            .send({
                oldPassword: 'OldPassword123',
                newPassword: 'NewPassword123'
            })

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

})

describe('GET /api/v1/auth/me', () => {

    it('should get user account successfully', async () => {

        const user = await User.create({
            fullname: 'Account Test User',
            username: 'accountuser',
            password: await argon2.hash('Password123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'accountuser',
                password: 'Password123'
            })

        expect(loginResponse.status).toBe(200)

        const accessToken =
            loginResponse.body.data.tokens.accessToken

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(200)

        expect(response.body.success).toBe(true)
        expect(response.body.msg)
            .toBe('User Account Successfully Found')

        expect(response.body.data).toHaveProperty('user')
        expect(response.body.data).toHaveProperty('state')

        expect(response.body.data.user).toMatchObject({
            _id: user._id.toString(),
            fullname: 'Account Test User',
            username: 'accountuser',
            role: 'User',
            active: true,
            deletedAt: null
        })

        // Password must not be returned
        expect(response.body.data.user)
            .not.toHaveProperty('password')
    })

    it('should reject getting account without access token', async () => {

        const response = await request(app)
            .get('/api/v1/auth/me')

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject getting account with invalid access token', async () => {

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer invalid-access-token')

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject account request when user no longer exists', async () => {

        const user = await User.create({
            fullname: 'Deleted Account User',
            username: 'deletedaccount',
            password: await argon2.hash('Password123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'deletedaccount',
                password: 'Password123'
            })

        expect(loginResponse.status).toBe(200)

        const accessToken =
            loginResponse.body.data.tokens.accessToken

        await User.deleteOne({
            _id: user._id
        })

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${accessToken}`)

        expect(response.status).toBe(401)

        expect(response.body).toMatchObject({
            success: false,
            data: null
        })
    })

    it('should reject getting account with tampered access token', async () => {

        const user = await User.create({
            fullname: 'Tampered Access User',
            username: 'tamperedaccess',
            password: await argon2.hash('Password123')
        })

        const loginResponse = await request(app)
            .post('/api/v1/auth/login')
            .send({
                username: 'tamperedaccess',
                password: 'Password123'
            })

        expect(loginResponse.status).toBe(200)

        const accessToken =
            loginResponse.body.data.tokens.accessToken

        const tamperedToken =
            accessToken.slice(0, -1) +
            (accessToken.at(-1) === 'a' ? 'b' : 'a')

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${tamperedToken}`)

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
        expect(response.body.data).toBeNull()
    })

    it('should reject authorization header without Bearer scheme', async () => {

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'invalid-access-token')

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject empty Bearer token', async () => {

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer')

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })

    it('should reject empty authorization header', async () => {

        const response = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', '')

        expect(response.status).toBe(401)
        expect(response.body.success).toBe(false)
    })
    
})