import { adminSeeder } from "./user.seeder.js"

export const initSeeders = async () => {
    await adminSeeder()
} 