import { Router } from "express";
import { CategoryController } from "./category.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

// PUBLIC
router.get("/", CategoryController.getAllCategories);
router.get("/:id", CategoryController.getSingleCategory);

// ADMIN
router.post("/", checkAuth(Role.ADMIN, Role.SUPERADMIN), CategoryController.createCategory);
router.patch("/:id", checkAuth(Role.ADMIN, Role.SUPERADMIN), CategoryController.updateCategory);
router.delete("/:id", checkAuth(Role.ADMIN, Role.SUPERADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;