import z, { string } from "zod";
import { TodoSort, TodoSortType } from "../types/todo.enum.js";
import { Types } from "mongoose";

export const todoQS = z.object({
    page : z.coerce.number().int().positive().default(1),
    limit : z.coerce.number().int().positive().max(30, 'Max Limit : 30').default(15),

    sort : z.enum(TodoSort).default(TodoSort.PRIORITY),
    sortType : z.enum(TodoSortType).default(TodoSortType.DESC),

    q : z.string().trim().max(50, 'Max Characters : 50').optional(),

    priority : z.coerce.number().int().positive().max(10, 'Max Pariority : 10').optional(),
    status : z.enum(['Pending', 'Completed', 'Canceled']).optional(),

    username : z.string().trim().max(50, 'Max Characters : 50').optional(),

    showDeleted : z.enum(['Yes', 'No', 'All']).default('No'),

    from : z.coerce.date().optional(),
    to : z.coerce.date().optional(),

    dueFrom : z.coerce.date().optional(),
    dueTo : z.coerce.date().optional()
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

    if (
        data.dueFrom !== undefined &&
        data.dueTo !== undefined &&
        data.dueFrom.getTime() > data.dueTo.getTime()
    ) {
        ctx.addIssue({
            code : z.ZodIssueCode.custom,
            path : ['dueTo'],
            message : 'Due To Date Must Be Greater Than Or Equal To Due From Date'
        })
    }
})

export const todoIdSchema = z.object({
    todoId : z.string().trim().refine(Types.ObjectId.isValid, 'Invalid ObjectId').transform(v => new Types.ObjectId(v))
})

export type TodoQSDto = z.infer<typeof todoQS>
export type TodoIdDto = z.infer<typeof todoIdSchema>