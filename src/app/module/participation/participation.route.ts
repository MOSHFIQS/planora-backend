import { Router } from "express";
import { ParticipationController } from "./participation.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// 👤 User routes
router.post(
     "/join/:eventId",
     checkAuth(Role.USER, Role.ADMIN),
     ParticipationController.joinEvent,
);

router.delete(
     "/cancel/:eventId",
     checkAuth(Role.USER, Role.ADMIN),
     ParticipationController.cancelParticipation,
);

router.get(
     "/my-events",
     checkAuth(Role.USER, Role.ADMIN),
     ParticipationController.getMyEvents,
);

// Organizer/Admin routes
router.get(
     "/event/:eventId",
     checkAuth(Role.USER, Role.ADMIN),
     ParticipationController.getEventParticipants,
);

router.patch(
     "/:id/status",
     checkAuth(Role.USER, Role.ADMIN),
     ParticipationController.updateStatus,
);

export const ParticipationRoutes = router;
