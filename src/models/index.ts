import mongoose from "mongoose"
import { IUser, userSchema } from "./user.model.js"
import { ISession, sessionSchema } from "./session.model.js"

export const User = mongoose.model<IUser>('User', userSchema)
export const Session = mongoose.model<ISession>('Session', sessionSchema)