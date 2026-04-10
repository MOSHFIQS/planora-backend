import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { EventController } from "./event.controller";

const router = Router();
// Public
router.get("/", EventController.getAllEvents);
router.get("/featured", checkAuth(Role.ADMIN, Role.SUPERADMIN), EventController.getFeaturedEvents);
router.get("/public/:id", checkAuth(Role.USER, Role.ADMIN, Role.SUPERADMIN, Role.ORGANIZER), EventController.getSingleEventPublic);

// Admin
router.get("/admin/all", checkAuth(Role.ADMIN, Role.SUPERADMIN), EventController.getAllEventsAdmin);
router.delete("/admin/:id", checkAuth(Role.ADMIN, Role.SUPERADMIN), EventController.deleteEventByAdmin);
router.patch("/admin/feature/:id", checkAuth(Role.ADMIN, Role.SUPERADMIN), EventController.updateFeaturedStatus);

// User / Organizer
router.post("/", checkAuth(Role.ORGANIZER), EventController.createEvent);
router.get("/me/events", checkAuth(Role.ORGANIZER), EventController.getOrganizerEvents);

// 👇 IMPORTANT: keep dynamic routes LAST
router.get("/:id", checkAuth(Role.ORGANIZER), EventController.organizersSingleEventById);
router.patch("/:id", checkAuth(Role.ORGANIZER), EventController.updateEvent);
router.delete("/:id", checkAuth(Role.ORGANIZER), EventController.deleteEventByOrganizer);


export const EventRoutes = router;