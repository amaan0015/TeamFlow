
import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";

const router = Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:notificationId/read", markNotificationRead);

export default router;
