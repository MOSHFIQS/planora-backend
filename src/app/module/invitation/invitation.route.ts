import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { InvitationController } from "./invitation.controller";

const router = Router();


// Organizer/Admin
router.post(
  "/send",
  checkAuth(Role.ORGANIZER),
  InvitationController.sendInvitation
);

router.get(
  "/event/:eventId",
  checkAuth(Role.ORGANIZER),
  InvitationController.getEventInvitations
);

router.delete(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
  InvitationController.cancelInvitation
);


// Invited user
router.get(
  "/my",
  checkAuth(Role.USER, Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
  InvitationController.getMyInvitations
);



export const InvitationRoutes = router;