import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getTaskActivities } from "../controllers/activityController.js";

const router = Router({ mergeParams: true });

router.use(protect);
router.get("/", getTaskActivities);

export default router;