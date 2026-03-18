import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { EventController } from "./event.controller";

const router = Router();
// Public
router.get("/", EventController.getAllEvents);
router.get("/:id", EventController.getSingleEvent);

// Organizer / User
router.post("/", checkAuth(Role.USER, Role.ADMIN), EventController.createEvent);
router.get("/me/events", checkAuth(Role.USER, Role.ADMIN), EventController.getMyEvents);

// Update/Delete — Organizer or Admin
router.patch("/:id", checkAuth(Role.USER, Role.ADMIN), EventController.updateEvent);
router.delete("/:id", checkAuth(Role.USER, Role.ADMIN), EventController.deleteEvent);

// Admin only
router.get("/admin/all", checkAuth(Role.ADMIN), EventController.getAllEventsAdmin);

export const EventRoutes = router;
