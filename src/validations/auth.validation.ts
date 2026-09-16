import z from "zod";

export const registerSchema = z.object({
    fullname : z.string().trim().min(4, 'At Least 4 Characters Are Required').max(50, 'Max Characters : 50'),
    username : z.string().trim().min(6, 'At Least 6 Characters Are Required').max(50, 'Max Characters : 50'),
    password : z.string().trim().min(8, 'At Least 8 Characters Are Required').max(100, 'Max Characters : 100')
})

export const loginSchema = z.object({
    username : z.string().trim().min(6, 'At Least 6 Characters Are Required').max(50, 'Max Characters : 50'),
    password : z.string().trim().min(8, 'At Least 8 Characters Are Required').max(100, 'Max Characters : 100')
})

export const refreshTokenSchema = z.object({
    refreshToken : z.string().trim()
})

export const changePasswordSchema = z.object({
    oldPassword : z.string().trim().min(8, 'At Least 8 Characters Are Required').max(100, 'Max Characters : 100'),
    newPassword : z.string().trim().min(8, 'At Least 8 Characters Are Required').max(100, 'Max Characters : 100')
})

export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>