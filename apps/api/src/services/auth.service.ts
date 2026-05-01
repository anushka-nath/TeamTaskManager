import bcrypt from "bcrypt";
import { prisma } from "../utils/prisma.js";
import { signAccessToken, signRefreshToken, generateRefreshTokenPayload } from "../utils/jwt.js";
import { errorResponse } from "../utils/apiResponse.js";
import type { RegisterInput, LoginInput } from "@ttm/shared";

export async function registerUser(data: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existing) {
    throw errorResponse("CONFLICT", "A user with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
    },
  });

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  const refreshTokenString = signRefreshToken(generateRefreshTokenPayload(user.id));
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      expiresAt,
    },
  });

  return { user, accessToken, refreshToken: refreshTokenString };
}

export async function loginUser(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw errorResponse("UNAUTHORIZED", "Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(data.password, user.passwordHash);

  if (!valid) {
    throw errorResponse("UNAUTHORIZED", "Invalid email or password", 401);
  }

  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  const refreshTokenString = signRefreshToken(generateRefreshTokenPayload(user.id));
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenString,
      userId: user.id,
      expiresAt,
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
    accessToken,
    refreshToken: refreshTokenString,
  };
}

export async function rotateRefreshToken(tokenString: string) {
  const existing = await prisma.refreshToken.findUnique({
    where: { token: tokenString },
    include: { user: true },
  });

  if (!existing || existing.expiresAt < new Date()) {
    if (existing) {
      await prisma.refreshToken.delete({ where: { id: existing.id } });
    }
    throw errorResponse("UNAUTHORIZED", "Invalid or expired refresh token", 401);
  }

  await prisma.refreshToken.delete({ where: { id: existing.id } });

  const user = existing.user;
  const accessToken = signAccessToken({
    id: user.id,
    email: user.email,
    name: user.name,
  });

  const newRefreshTokenString = signRefreshToken(generateRefreshTokenPayload(user.id));
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      token: newRefreshTokenString,
      userId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken: newRefreshTokenString };
}

export async function logoutUser(tokenString: string) {
  await prisma.refreshToken.deleteMany({
    where: { token: tokenString },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    throw errorResponse("UNAUTHORIZED", "User not found", 401);
  }

  return user;
}
