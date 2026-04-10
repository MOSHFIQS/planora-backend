import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { AdminController } from "./admin.controller";

const router = Router();



// User management (ADMIN sees users; SUPERADMIN sees both users and admins)
router.get("/users", checkAuth(Role.ADMIN, Role.SUPERADMIN), AdminController.getAllUsers);
router.get("/users/:id", checkAuth(Role.ADMIN, Role.SUPERADMIN), AdminController.getSingleUser);
router.patch("/users/:id/status", checkAuth(Role.ADMIN, Role.SUPERADMIN), AdminController.updateUserStatus);
router.patch("/users/:id/role", checkAuth(Role.ADMIN, Role.SUPERADMIN), AdminController.updateUserRole);
router.delete("/users/:id", checkAuth(Role.ADMIN, Role.SUPERADMIN), AdminController.deleteUser);

// Admin management (SUPERADMIN only)
router.get("/admins", checkAuth(Role.SUPERADMIN), AdminController.getAllAdmins);
router.post("/admins", checkAuth(Role.SUPERADMIN), AdminController.createAdmin);

export const AdminRoutes = router;