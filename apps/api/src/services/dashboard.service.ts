import { startOfWeek } from "date-fns";
import { prisma } from "../utils/prisma.js";

export async function getStats(userId: string) {
  const projectWhere = {
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } },
    ],
  };

  const [totalProjects, activeTasks, overdueTasks, completedThisWeek] = await Promise.all([
    prisma.project.count({ where: projectWhere }),
    prisma.task.count({
      where: {
        project: projectWhere,
        status: { not: "DONE" },
      },
    }),
    prisma.task.count({
      where: {
        project: projectWhere,
        dueDate: { lt: new Date() },
        status: { not: "DONE" },
      },
    }),
    prisma.task.count({
      where: {
        project: projectWhere,
        status: "DONE",
        updatedAt: { gte: startOfWeek(new Date(), { weekStartsOn: 1 }) },
      },
    }),
  ]);

  const tasksByStatus = await prisma.task.groupBy({
    by: ["status"],
    where: {
      project: projectWhere,
    },
    _count: { status: true },
  });

  const taskStatusCounts = tasksByStatus.reduce<Record<string, number>>((acc, item) => {
    acc[item.status] = item._count.status;
    return acc;
  }, {});

  return {
    totalProjects,
    activeTasks,
    overdueTasks,
    completedThisWeek,
    taskStatusCounts,
  };
}

export async function getOverdueTasks(userId: string) {
  const projectWhere = {
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } },
    ],
  };

  const tasks = await prisma.task.findMany({
    where: {
      project: projectWhere,
      dueDate: { lt: new Date() },
      status: { not: "DONE" },
    },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }],
    take: 50,
  });

  const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  return tasks.sort((a, b) => {
    const pa = priorityOrder[a.priority] || 0;
    const pb = priorityOrder[b.priority] || 0;
    return pb - pa;
  });
}

export async function getRecentTasks(userId: string, limit = 10) {
  const projectWhere = {
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } },
    ],
  };

  return prisma.task.findMany({
    where: {
      project: projectWhere,
    },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}
