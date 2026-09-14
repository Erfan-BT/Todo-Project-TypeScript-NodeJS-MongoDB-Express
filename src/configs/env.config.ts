import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    // FrontEnd
    FRONTEND_URL : z.string().min(1),

    // Server
    NODE_ENV: z.enum(['development', 'production', 'test']),
    SERVER_PORT: z.coerce.number().int().positive(),
    

    // Database
    // DB_HOST: z.string().min(1),
    // DB_PORT: z.coerce.number().int().positive(),
    // DB_DATABASE: z.string().min(1),
    // DB_USER: z.string().min(1),
    // DB_PASS: z.string(),

    // JWT
    JWT_SECRET : z.string().min(1),
    JWT_REFRESH_SECRET : z.string().min(1),
    JWT_EXPIRES_IN : z.string().min(1),
    JWT_REFRESH_EXPIRES_IN : z.string().min(1),

});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    let errors : string[] = [];
    for (const issue of parsed.error.issues) {
        errors.push(`- ${issue.path.join('.')}: ${issue.message}`);
    }
    console.error({errors}, 'Invalid Environment Variables');
    process.exit(1);
}

export const env = parsed.data;