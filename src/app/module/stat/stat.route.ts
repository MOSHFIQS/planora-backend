import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { StatController } from "./stat.controller";

const router = Router();

router.get("/superadmin", checkAuth(Role.SUPERADMIN), StatController.getSuperAdminStats);
router.get("/admin", checkAuth(Role.ADMIN, Role.SUPERADMIN), StatController.getAdminStats);
router.get("/organizer", checkAuth(Role.ORGANIZER, Role.ADMIN, Role.SUPERADMIN), StatController.getOrganizerStats);
router.get("/user", checkAuth(Role.USER, Role.ORGANIZER, Role.ADMIN, Role.SUPERADMIN), StatController.getUserStats);

router.get("/public", StatController.getPublicStats);

export const StatRoutes = router;