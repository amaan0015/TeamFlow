
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createProject,
  getProjects,
} from "../controllers/projectController.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.get("/", getProjects);
router.post("/", createProject);

export default router;
