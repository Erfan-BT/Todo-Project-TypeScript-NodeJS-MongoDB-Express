import mongoose from "mongoose";

export async function connectDB() {
    await mongoose.connect('mongodb+srv://erfanweb1385_db_user:zIMpskqqM0piKGWV@cluster0.ckv2v26.mongodb.net/')
}