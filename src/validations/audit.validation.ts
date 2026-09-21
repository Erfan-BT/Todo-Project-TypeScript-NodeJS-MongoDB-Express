import z from "zod";

export const reasonSchema = z.object({
    reason : z.string().trim().min(3).max(200)
})

export type ReasonDto = z.infer<typeof reasonSchema>