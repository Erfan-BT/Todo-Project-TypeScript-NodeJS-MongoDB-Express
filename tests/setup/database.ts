import mongoose from 'mongoose'
import { beforeAll, afterEach, afterAll } from 'vitest'

const TEST_DB_URL = process.env.TEST_DB_URL
process.env.NODE_ENV = 'test'

if (!TEST_DB_URL) {
    throw new Error('TEST_DB_URL is not defined')
}

beforeAll(async () => {
    await mongoose.connect(TEST_DB_URL)
})

afterEach(async () => {
    const collections = mongoose.connection.collections

    for (const collection of Object.values(collections)) {
        await collection.deleteMany({})
    }
})

afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
})