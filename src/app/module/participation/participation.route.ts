import { Router } from "express";
import { ParticipationController } from "./participation.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// User routes
router.get(
     "/my-events",
     checkAuth(Role.USER, Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
     ParticipationController.getMyEvents,
);

// Organizer/Admin routes
router.get(
     "/event/:eventId",
     checkAuth(Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
     ParticipationController.getEventParticipants,
);
router.get(
     "/my-all-participants",
     checkAuth(Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
     ParticipationController.getMyAllEventParticipants
);

router.patch(
     "/:id/status",
     checkAuth(Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
     ParticipationController.updateStatus,
);

export const ParticipationRoutes = router;
