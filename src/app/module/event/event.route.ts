import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { EventController } from "./event.controller";

const router = Router();
// Public route and for public evnent
router.get("/", EventController.getAllEvents);

// Public route need login
router.get("/public/:id",checkAuth(Role.USER, Role.ADMIN),EventController.getSingleEventPublic);


// Organizer / User
router.post("/", checkAuth(Role.USER, Role.ADMIN), EventController.createEvent);
router.get("/me/events", checkAuth(Role.USER, Role.ADMIN), EventController.getMyEvents);
router.get("/:id", checkAuth(Role.USER, Role.ADMIN), EventController.organizersSingleEventById);

// Update/Delete — Organizer or Admin
router.patch("/:id", checkAuth(Role.USER, Role.ADMIN), EventController.updateEvent);
router.delete("/:id", checkAuth(Role.USER, Role.ADMIN), EventController.deleteEvent);

// Admin only
router.get("/admin/all", checkAuth(Role.ADMIN), EventController.getAllEventsAdmin);


export const EventRoutes = router;