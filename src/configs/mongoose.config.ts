import mongoose from "mongoose";
import { env } from "./env.config.js";

export async function connectDB() {
    await mongoose.connect(env.DB_URL)
}

export async function disconnectDB() {
    await mongoose.disconnect()
}