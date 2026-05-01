import type { Request, Response, NextFunction } from "express";
import * as projectService from "../services/project.service.js";
import { successResponse } from "../utils/apiResponse.js";

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.createProject(req.user!.id, req.body);
    res.status(201).json(successResponse(project));
  } catch (err) {
    next(err);
  }
}

export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const includeArchived = req.query.includeArchived === "true";
    const projects = await projectService.getProjectsForUser(req.user!.id, includeArchived);
    res.status(200).json(successResponse(projects));
  } catch (err) {
    next(err);
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.getProjectById(req.params.id);
    if (!project) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      });
      return;
    }
    res.status(200).json(successResponse(project));
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await projectService.updateProject(req.params.id, req.body);
    res.status(200).json(successResponse(project));
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    await projectService.deleteProject(req.params.id);
    res.status(200).json(successResponse({ success: true }));
  } catch (err) {
    next(err);
  }
}

export async function inviteMember(req: Request, res: Response, next: NextFunction) {
  try {
    const member = await projectService.inviteMember(req.params.id, req.body);
    res.status(201).json(successResponse(member));
  } catch (err) {
    next(err);
  }
}

export async function removeMember(req: Request, res: Response, next: NextFunction) {
  try {
    await projectService.removeMember(req.params.id, req.params.userId);
    res.status(200).json(successResponse({ success: true }));
  } catch (err) {
    next(err);
  }
}

export async function updateMemberRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = req.body;
    const member = await projectService.updateMemberRole(req.params.id, req.params.userId, role);
    res.status(200).json(successResponse(member));
  } catch (err) {
    next(err);
  }
}
