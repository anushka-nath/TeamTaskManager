import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  createProjectSchema,
  updateProjectSchema,
  inviteMemberSchema,
  createTaskSchema,
  updateTaskSchema,
} from "./schemas.js";

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
