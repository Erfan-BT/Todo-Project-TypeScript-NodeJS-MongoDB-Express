import { NextFunction, Request, Response } from "express";
import { ValidationSchemas } from "../types/validation.type.js";
import { ZodError } from "zod";
import { ValidationError } from "../utils/appError.js";


export function validate(schemas: ValidationSchemas) {
    return (req : Request, res: Response, next: NextFunction) => {
        try {
            req.validated ??= {};

            if (schemas.body)
                req.validated.body = schemas.body.parse(req.body);

            if (schemas.query)
                req.validated.query = schemas.query.parse(req.query);

            if (schemas.params)
                req.validated.params = schemas.params.parse(req.params);

            next();
        } catch (error) {
            let errors : string[] = []
            if (error instanceof ZodError) {
                const errorsJson = JSON.parse(String(Array(error.message)[0]))
                errorsJson.map((error : any) => {
                    errors.push(`[${error.path}] : ${error.message}`)                    
                })
                throw new ValidationError(undefined, errors)
            }
            next(error)
        }
    }
}