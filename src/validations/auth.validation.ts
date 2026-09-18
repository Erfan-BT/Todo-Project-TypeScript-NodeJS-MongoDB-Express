import z from "zod";
import { UserSort, UserSortType } from "../types/user.enum.js";
import { Types } from "mongoose";

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

export const userQS = z.object({
    page : z.coerce.number().int().positive().default(1),
    limit : z.coerce.number().int().positive().max(50).default(30),

    sort : z.enum(UserSort).default(UserSort.CREATEDAT),
    sortType : z.enum(UserSortType).default(UserSortType.DESC),

    q : z.string().trim().max(50, 'Max Characters : 50').optional(),

    status : z.coerce.boolean().optional(),
    role : z.enum(['Admin', 'User']).optional(),
    showDeleted : z.coerce.boolean().optional(),

    from : z.coerce.date().optional(),
    to : z.coerce.date().optional(),
})
.superRefine((data, ctx) => {
    if (
        data.from !== undefined &&
        data.to !== undefined &&
        data.from.getTime() > data.to.getTime()
    ) {
        ctx.addIssue({
            code : z.ZodIssueCode.custom,
            path : ['to'],
            message : 'To Date Must Be Greater Than Or Equal To From Date'
        })
    }
})

export const userIdSchema = z.object({
    userId : z.string().trim().refine(Types.ObjectId.isValid, 'Invalid ObjectId').transform(v => new Types.ObjectId(v))
})

export const changeUserSchema = z.object({
    fullname : z.string().trim().min(4, 'At Least 4 Characters Are Required').max(50, 'Max Characters : 50').optional(),
    username : z.string().trim().min(6, 'At Least 6 Characters Are Required').max(50, 'Max Characters : 50').optional(),
})
.superRefine((data, ctx) => {
    if (
        data.fullname === undefined &&
        data.username === undefined
    ) {
        ctx.addIssue({
            code : z.ZodIssueCode.custom,
            message : 'At Least One Of The Fields Is Required'
        })
    }
})

export const adminChangeUserPasswordSchema = z.object({
    newPassword : z.string().trim().min(8, 'At Least 8 Characters Are Required').max(100, 'Max Characters : 100')
})

export type RegisterDto = z.infer<typeof registerSchema>
export type LoginDto = z.infer<typeof loginSchema>
export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>
export type UserQSDto = z.infer<typeof userQS>
export type UserIdDto = z.infer<typeof userIdSchema>
export type ChangeUserDto = z.infer<typeof changeUserSchema>
export type AdminChangeUserPasswordDto = z.infer<typeof adminChangeUserPasswordSchema>