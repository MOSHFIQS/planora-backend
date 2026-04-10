import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { PaymentController } from "./payment.controller";

const router = Router();


// User initiates payment
router.post(
  "/pay",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPERADMIN, Role.ORGANIZER),
  PaymentController.initiatePayment
);

router.get(
  "/my",
  checkAuth(Role.USER, Role.ADMIN, Role.SUPERADMIN),
  PaymentController.getMyPayments
);

// 🔹 Organizer payments (only events they created)
router.get(
  "/organizer",
  checkAuth(Role.ADMIN, Role.SUPERADMIN, Role.ORGANIZER),
  PaymentController.getOrganizerPayments
);

router.get(
  "/admin",
  checkAuth(Role.ADMIN, Role.SUPERADMIN),
  PaymentController.getAllPayments
);

export const PaymentRoutes = router;