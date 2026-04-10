import { Router } from "express";
import { ReviewController } from "./review.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
const router = Router();

// Create
router.post(
  "/",
  checkAuth(Role.USER, Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
  ReviewController.createReview
);

// Update
router.patch(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
  ReviewController.updateReview
);

// Delete (user + organizer + admin handled in service)
router.delete(
  "/:id",
  checkAuth(Role.USER, Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
  ReviewController.deleteReview
);

// My reviews
router.get(
  "/my",
  checkAuth(Role.USER, Role.ADMIN, Role.ORGANIZER, Role.SUPERADMIN),
  ReviewController.getMyReviews
);

// Public: event reviews
router.get(
  "/event/:eventId",
  ReviewController.getEventReviews
);



// Organizer: specific event reviews
router.get(
  "/organizer/events/:eventId",
  checkAuth(Role.ORGANIZER),
  ReviewController.getOrganizerEventReviewsByEventId
);

export const ReviewRoutes = router;