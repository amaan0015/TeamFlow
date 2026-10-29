
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";


import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
} from "../controllers/taskController.js";

import {
  createTaskComment,
  getTaskComments,
} from "../controllers/commentController.js";

import activityRoutes from "./activityRoutes.js";

const router = Router({ mergeParams: true });

router.use(protect);

router.get("/", getTasks);
router.post("/", createTask);
router.patch("/:taskId", updateTask);
router.delete("/:taskId", deleteTask);

router.get("/:taskId/comments", getTaskComments);
router.post("/:taskId/comments", createTaskComment);
router.use("/:taskId/activities", activityRoutes);

export default router;
