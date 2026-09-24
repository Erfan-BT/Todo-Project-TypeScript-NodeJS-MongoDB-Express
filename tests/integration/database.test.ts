import { describe, it, expect } from 'vitest'
import mongoose from 'mongoose'

describe('Database Integration', () => {

    it('should connect to test database', () => {
        expect(mongoose.connection.readyState).toBe(1)
    })

})