import type { Request, Response, NextFunction } from "express";
import * as taskService from "../services/task.service.js";
import { successResponse } from "../utils/apiResponse.js";

export async function createTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await taskService.createTask(req.params.projectId, req.user!.id, req.body);
    res.status(201).json(successResponse(task));
  } catch (err) {
    next(err);
  }
}

export async function getTasks(req: Request, res: Response, next: NextFunction) {
  try {
    const tasks = await taskService.getTasksByProject(req.params.projectId);
    res.status(200).json(successResponse(tasks));
  } catch (err) {
    next(err);
  }
}

export async function getTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await taskService.getTaskById(req.params.taskId);
    if (!task) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Task not found" },
      });
      return;
    }
    res.status(200).json(successResponse(task));
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction) {
  try {
    const task = await taskService.updateTask(req.params.taskId, req.body);
    res.status(200).json(successResponse(task));
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction) {
  try {
    await taskService.deleteTask(req.params.taskId);
    res.status(200).json(successResponse({ success: true }));
  } catch (err) {
    next(err);
  }
}
