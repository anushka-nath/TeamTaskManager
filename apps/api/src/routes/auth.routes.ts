import { Router } from "express";
import { register, login, refresh, logout, me } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { registerSchema, loginSchema } from "@ttm/shared";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

export default router;
