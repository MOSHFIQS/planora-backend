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

// Organizer
router.get(
     "/event/:eventId",
     checkAuth(Role.ORGANIZER),
     ParticipationController.getEventParticipants,
);
router.get(
     "/my-all-participants",
     checkAuth(Role.ORGANIZER),
     ParticipationController.getMyAllEventParticipants
);

router.patch(
     "/:id/status",
     checkAuth(Role.ORGANIZER),
     ParticipationController.updateStatus,
);

export const ParticipationRoutes = router;