import { Router } from "express";
import { TicketController } from "./ticket.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// User actions
router.get(
  "/my",
  checkAuth(Role.USER, Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
  TicketController.getMyTickets
);

// Organizer/Admin actions
router.get(
  "/event/:eventId",
  checkAuth(Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
  TicketController.getEventTickets
);

router.post(
  "/check-in",
  checkAuth(Role.ORGANIZER),
  TicketController.checkInTicket
);

export const TicketRoutes = router;