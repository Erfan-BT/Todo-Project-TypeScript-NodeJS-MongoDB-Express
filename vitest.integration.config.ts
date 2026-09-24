import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

const result = dotenv.config({
    path: '.env.test'
})

console.log(result)
console.log('TEST_DB_URL:', process.env.TEST_DB_URL)

export default defineConfig({
    test: {
        environment: 'node',

        include: [
            'tests/integration/**/*.test.ts'
        ],

        setupFiles: [
            './tests/setup/database.ts'
        ]
    }
})