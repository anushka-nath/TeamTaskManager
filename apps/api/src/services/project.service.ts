import { MemberRole, Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { errorResponse } from "../utils/apiResponse.js";
import type { CreateProjectInput, UpdateProjectInput, InviteMemberInput } from "@ttm/shared";

export async function createProject(userId: string, data: CreateProjectInput) {
  return prisma.project.create({
    data: {
      name: data.name,
      description: data.description,
      ownerId: userId,
      members: {
        create: {
          userId,
          role: MemberRole.ADMIN,
        },
      },
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });
}

export async function getProjectsForUser(userId: string, includeArchived = false) {
  const where: Prisma.ProjectWhereInput = {
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } },
    ],
  };

  if (!includeArchived) {
    where.status = "ACTIVE";
  }

  return prisma.project.findMany({
    where,
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      _count: {
        select: { members: true, tasks: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProjectById(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          assigneeId: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function updateProject(projectId: string, data: UpdateProjectInput) {
  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });
}

export async function deleteProject(projectId: string) {
  await prisma.project.delete({ where: { id: projectId } });
}

export async function getAdminCount(projectId: string) {
  return prisma.projectMember.count({
    where: { projectId, role: MemberRole.ADMIN },
  });
}

export async function inviteMember(projectId: string, data: InviteMemberInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true, name: true, email: true, avatarUrl: true },
  });

  if (!user) {
    throw errorResponse("NOT_FOUND", "User not found", 404);
  }

  const existing = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId: user.id,
      },
    },
  });

  if (existing) {
    throw errorResponse("CONFLICT", "User is already a member of this project", 409);
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId: user.id,
      role: data.role,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });

  return member;
}

export async function removeMember(projectId: string, userId: string) {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  if (!member) {
    throw errorResponse("NOT_FOUND", "Member not found", 404);
  }

  if (member.role === MemberRole.ADMIN) {
    const adminCount = await getAdminCount(projectId);
    if (adminCount <= 1) {
      throw errorResponse(
        "VALIDATION_ERROR",
        "Project must have at least one admin",
        400
      );
    }
  }

  await prisma.projectMember.delete({
    where: { id: member.id },
  });
}

export async function updateMemberRole(
  projectId: string,
  userId: string,
  role: MemberRole
) {
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  if (!member) {
    throw errorResponse("NOT_FOUND", "Member not found", 404);
  }

  if (member.role === MemberRole.ADMIN && role === MemberRole.MEMBER) {
    const adminCount = await getAdminCount(projectId);
    if (adminCount <= 1) {
      throw errorResponse(
        "VALIDATION_ERROR",
        "Project must have at least one admin",
        400
      );
    }
  }

  return prisma.projectMember.update({
    where: { id: member.id },
    data: { role },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });
}
