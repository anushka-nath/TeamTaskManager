import type { Request, Response, NextFunction } from "express";
import { MemberRole } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { errorResponse } from "../utils/apiResponse.js";

export function authorizeProjectRole(roles: MemberRole[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(errorResponse("UNAUTHORIZED", "Authentication required", 401));
      return;
    }

    const projectId = req.params.id || req.params.projectId;

    if (!projectId) {
      next(errorResponse("NOT_FOUND", "Project ID not found in request", 404));
      return;
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.id,
        },
      },
    });

    if (!membership) {
      next(errorResponse("FORBIDDEN", "You are not a member of this project", 403));
      return;
    }

    if (!roles.includes(membership.role)) {
      next(errorResponse("FORBIDDEN", "Insufficient permissions", 403));
      return;
    }

    req.projectMember = {
      id: membership.id,
      role: membership.role,
      projectId: membership.projectId,
    };

    next();
  };
}
