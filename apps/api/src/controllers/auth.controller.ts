import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser, rotateRefreshToken, logoutUser, getCurrentUser } from "../services/auth.service.js";
import { successResponse } from "../utils/apiResponse.js";
import { env } from "../config/env.js";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerUser(req.body);
    res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json(successResponse({ user: result.user, accessToken: result.accessToken }));
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await loginUser(req.body);
    res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json(successResponse({ user: result.user, accessToken: result.accessToken }));
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "No refresh token provided" },
      });
      return;
    }
    const result = await rotateRefreshToken(token);
    res.cookie("refreshToken", result.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json(successResponse({ accessToken: result.accessToken }));
  } catch (err) {
    res.clearCookie("refreshToken", { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict" });
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await logoutUser(token);
    }
    res.clearCookie("refreshToken", { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "strict" });
    res.status(200).json(successResponse({ success: true }));
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getCurrentUser(req.user!.id);
    res.status(200).json(successResponse(user));
  } catch (err) {
    next(err);
  }
}
