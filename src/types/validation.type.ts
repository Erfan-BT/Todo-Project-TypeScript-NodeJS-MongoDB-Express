import z from "zod"

export interface ValidationSchemas {
    body?: z.ZodObject<any, any>
    query?: z.ZodObject<any, any>
    params?: z.ZodObject<any, any>
}