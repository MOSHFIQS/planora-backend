import { Router } from "express";
import { ParticipationController } from "./participation.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// User routes
router.get(
     "/my-events",
     checkAuth(Role.USER, Role.ADMIN),
     ParticipationController.getMyEvents,
);
// routes/participation.routes.ts
router.get(
     "/me/:id",                     // participant's own participation
     checkAuth(Role.USER, Role.ADMIN),
     ParticipationController.getMySingleEvent
);

// Organizer/Admin routes
router.get(
     "/event/:eventId",
     checkAuth(Role.USER, Role.ADMIN),
     ParticipationController.getEventParticipants,
);
router.get(
     "/my-all-participants",
     checkAuth(Role.USER, Role.ADMIN),
     ParticipationController.getMyAllEventParticipants
);

router.patch(
     "/:id/status",
     checkAuth(Role.USER, Role.ADMIN),
     ParticipationController.updateStatus,
);

export const ParticipationRoutes = router;
