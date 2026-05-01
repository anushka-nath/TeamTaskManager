import type { Request, Response, NextFunction } from "express";
import { getStats, getOverdueTasks, getRecentTasks } from "../services/dashboard.service.js";
import { successResponse } from "../utils/apiResponse.js";

export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await getStats(req.user!.id);
    res.status(200).json(successResponse(stats));
  } catch (err) {
    next(err);
  }
}

export async function getOverdue(req: Request, res: Response, next: NextFunction) {
  try {
    const tasks = await getOverdueTasks(req.user!.id);
    res.status(200).json(successResponse(tasks));
  } catch (err) {
    next(err);
  }
}

export async function getRecent(req: Request, res: Response, next: NextFunction) {
  try {
    const tasks = await getRecentTasks(req.user!.id);
    res.status(200).json(successResponse(tasks));
  } catch (err) {
    next(err);
  }
}
