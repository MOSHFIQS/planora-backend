import { Router } from "express";
import { ParticipationController } from "./participation.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();


// 👤 User routes
router.post(
  "/join/:eventId",
  checkAuth(Role.USER, Role.ADMIN),
  ParticipationController.joinEvent
);

router.delete(
  "/cancel/:eventId",
  checkAuth(Role.USER, Role.ADMIN),
  ParticipationController.cancelParticipation
);


export const ParticipationRoutes = router;