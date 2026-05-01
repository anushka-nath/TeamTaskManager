import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.js";
import { errorResponse } from "../utils/apiResponse.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next(errorResponse("UNAUTHORIZED", "Missing or invalid authorization header", 401));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch {
    next(errorResponse("UNAUTHORIZED", "Invalid or expired token", 401));
  }
}
