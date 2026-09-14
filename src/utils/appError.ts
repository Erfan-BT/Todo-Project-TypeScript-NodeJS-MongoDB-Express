export class AppError<T> extends Error {
    public readonly statusCode : number;
    public readonly isOperational : boolean;
    public readonly context : T | undefined;
    
    constructor(message : string, statusCode : number = 500, context ?: T, isOperational : boolean = true) {
        super(message)
        this.statusCode = statusCode
        this.isOperational = isOperational
        this.context = context
        Error.captureStackTrace(this.constructor)
    }
}

export class NotFoundError extends AppError<undefined> {
    constructor(resource : string) {
        super(`Not Found => ${resource}`, 404)
    }
}
export class ValidationError extends AppError<any> {
    constructor(message : string =  'Invalid Params', invalidList ?: any) {
        super(message, 400, invalidList)
    }
}

export class BadRequestError extends AppError<string | undefined> {
    constructor(message : string =  'Wrong Data', context ?: string) {
        super(message, 400, context)
    }
}

export class UnauthorizedError extends AppError<undefined> {
    constructor(message : string = 'Login First') {
        super(message, 401)
    }
}

export class ForbiddenError extends AppError<string | undefined> {
    constructor(message: string = 'You Are Not Access', context ?: string) {
        super(message, 403, context)
    }
}

export class InternalServerError extends AppError<any> {
    constructor(message : string = 'Server Error', context ?: any, isOperatinal : boolean = true) {
        super(message, 500, context, isOperatinal)
    }
}

export class ConflictError extends AppError<string | null> {
    constructor(message : string = 'Interference With Current Information', context ?: string) {
        super(message, 409, context)
    }
}