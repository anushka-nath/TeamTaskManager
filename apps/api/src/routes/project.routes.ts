import { Router } from "express";
import { MemberRole } from "@prisma/client";
import { authenticate } from "../middleware/auth.js";
import { authorizeProjectRole } from "../middleware/rbac.js";
import { validateBody } from "../middleware/validate.js";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  inviteMember,
  removeMember,
  updateMemberRole,
} from "../controllers/project.controller.js";
import { createProjectSchema, updateProjectSchema, inviteMemberSchema } from "@ttm/shared";
import { z } from "zod";

const router = Router();

router.use(authenticate);

router.post("/", validateBody(createProjectSchema), createProject);
router.get("/", getProjects);
router.get("/:id", authorizeProjectRole([MemberRole.ADMIN, MemberRole.MEMBER]), getProject);
router.patch("/:id", authorizeProjectRole([MemberRole.ADMIN]), validateBody(updateProjectSchema), updateProject);
router.delete("/:id", authorizeProjectRole([MemberRole.ADMIN]), deleteProject);
router.post(
  "/:id/members",
  authorizeProjectRole([MemberRole.ADMIN]),
  validateBody(inviteMemberSchema),
  inviteMember
);
router.delete("/:id/members/:userId", authorizeProjectRole([MemberRole.ADMIN]), removeMember);
router.patch(
  "/:id/members/:userId",
  authorizeProjectRole([MemberRole.ADMIN]),
  validateBody(z.object({ role: z.enum(["ADMIN", "MEMBER"]) })),
  updateMemberRole
);

export default router;
