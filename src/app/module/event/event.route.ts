import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { EventController } from "./event.controller";

const router = Router();
// Public
router.get("/", EventController.getAllEvents);
router.get("/featured", checkAuth(Role.ADMIN), EventController.getFeaturedEvents);
router.get("/public/:id", checkAuth(Role.USER, Role.ADMIN), EventController.getSingleEventPublic);

// Admin
router.get("/admin/all", checkAuth(Role.ADMIN), EventController.getAllEventsAdmin);
router.delete("/admin/:id", checkAuth(Role.ADMIN), EventController.deleteEventByAdmin);
router.patch("/admin/feature/:id", checkAuth(Role.ADMIN), EventController.updateFeaturedStatus);

// User / Organizer
router.post("/", checkAuth(Role.USER, Role.ADMIN), EventController.createEvent);
router.get("/me/events", checkAuth(Role.USER, Role.ADMIN), EventController.getMyEvents);

// 👇 IMPORTANT: keep dynamic routes LAST
router.get("/:id", checkAuth(Role.USER, Role.ADMIN), EventController.organizersSingleEventById);
router.patch("/:id", checkAuth(Role.USER, Role.ADMIN), EventController.updateEvent);
router.delete("/:id", checkAuth(Role.USER, Role.ADMIN), EventController.deleteEventByOrganizer);


export const EventRoutes = router;