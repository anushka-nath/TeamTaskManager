import { Router } from "express";
import { MemberRole } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";
import { authorizeProjectRole, authorizeTaskUpdate } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import { createTask, getTasks, getTask, updateTask, deleteTask } from "../controllers/task.controller.js";
import { createTaskSchema, updateTaskSchema } from "@ttm/shared";

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(authorizeProjectRole([MemberRole.ADMIN, MemberRole.MEMBER]));

router.post("/", authorizeProjectRole([MemberRole.ADMIN]), validateBody(createTaskSchema), createTask);
router.get("/", getTasks);
router.get("/:taskId", getTask);
router.patch("/:taskId", authorizeTaskUpdate, validateBody(updateTaskSchema), updateTask);
router.delete("/:taskId", authorizeProjectRole([MemberRole.ADMIN]), deleteTask);

export default router;
