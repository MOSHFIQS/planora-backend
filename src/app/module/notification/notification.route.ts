import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get(
  "/",
  checkAuth(Role.USER, Role.ORGANIZER, Role.ADMIN, Role.SUPERADMIN),
  NotificationController.getMyNotifications
);

router.patch(
  "/mark-all-read",
  checkAuth(Role.USER, Role.ORGANIZER, Role.ADMIN, Role.SUPERADMIN),
  NotificationController.markAllAsRead
);

router.patch(
  "/:id/read",
  checkAuth(Role.USER, Role.ORGANIZER, Role.ADMIN, Role.SUPERADMIN),
  NotificationController.markAsRead
);

export const NotificationRoutes = router;
