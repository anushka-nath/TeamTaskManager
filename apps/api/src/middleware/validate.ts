import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { errorResponse } from "../utils/apiResponse.js";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      next(errorResponse("VALIDATION_ERROR", "Invalid input data", 400, details));
      return;
    }
    req.body = result.data;
    next();
  };
}
