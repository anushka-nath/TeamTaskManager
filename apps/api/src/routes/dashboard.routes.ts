import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getDashboardStats, getOverdue, getRecent } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(authenticate);

router.get("/stats", getDashboardStats);
router.get("/overdue", getOverdue);
router.get("/recent", getRecent);

export default router;
