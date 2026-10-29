
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import projectRoutes from "./projectRoutes.js";
import taskRoutes from "./taskRoutes.js";
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceMembers,
  addWorkspaceMember,
} from "../controllers/workspaceController.js";
import { getProjectActivities } from "../controllers/activityController.js";

const router = Router();

router.use(protect);

router.post("/", createWorkspace);
router.get("/", getWorkspaces);
router.get("/:workspaceId/members", getWorkspaceMembers);
router.post("/:workspaceId/members", addWorkspaceMember);
router.use("/:workspaceId/projects", projectRoutes);
router.get(
  "/:workspaceId/projects/:projectId/activities",
  getProjectActivities
);
router.use("/:workspaceId/projects/:projectId/tasks", taskRoutes);


export default router;
