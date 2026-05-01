import { prisma } from "../utils/prisma.js";
import { errorResponse } from "../utils/apiResponse.js";
import type { CreateTaskInput, UpdateTaskInput } from "@ttm/shared";

const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

export async function createTask(
  projectId: string,
  creatorId: string,
  data: CreateTaskInput
) {
  if (data.dueDate) {
    const due = new Date(data.dueDate);
    if (due < new Date()) {
      throw errorResponse("VALIDATION_ERROR", "Due date must be in the future", 400);
    }
  }

  if (data.assigneeId) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: data.assigneeId,
        },
      },
    });
    if (!member) {
      throw errorResponse("VALIDATION_ERROR", "Assignee is not a project member", 400);
    }
  }

  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      projectId,
      assigneeId: data.assigneeId,
      creatorId,
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      creator: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });
}

export async function getTasksByProject(projectId: string) {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      creator: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return tasks.sort((a, b) => {
    const pa = priorityOrder[a.priority] || 0;
    const pb = priorityOrder[b.priority] || 0;
    return pb - pa;
  });
}

export async function getTaskById(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      creator: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      project: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function updateTask(taskId: string, data: UpdateTaskInput) {
  if (data.dueDate) {
    const due = new Date(data.dueDate);
    if (due < new Date()) {
      throw errorResponse("VALIDATION_ERROR", "Due date must be in the future", 400);
    }
  }

  if (data.assigneeId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });
    if (task) {
      const member = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId: data.assigneeId,
          },
        },
      });
      if (!member) {
        throw errorResponse("VALIDATION_ERROR", "Assignee is not a project member", 400);
      }
    }
  }

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.priority !== undefined && { priority: data.priority }),
      ...(data.dueDate !== undefined && { dueDate: data.dueDate ? new Date(data.dueDate) : null }),
      ...(data.assigneeId !== undefined && { assigneeId: data.assigneeId }),
    },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
      creator: {
        select: { id: true, name: true, email: true, avatarUrl: true },
      },
    },
  });
}

export async function deleteTask(taskId: string) {
  await prisma.task.delete({ where: { id: taskId } });
}
