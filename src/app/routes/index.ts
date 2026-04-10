import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { EventRoutes } from "../module/event/event.route";
import { ParticipationRoutes } from "../module/participation/participation.route";
import { InvitationRoutes } from "../module/invitation/invitation.route";
import { ReviewRoutes } from "../module/review/review.route";
import { PaymentRoutes } from "../module/payment/payment.route";
import { FileRoutes } from "../module/file/file.route";
import { AdminRoutes } from "../module/admin/admin.route";
import { StatRoutes } from "../module/stat/stat.route";
import { ProfileRoutes } from "../module/profile/profile.route";
import { CategoryRoutes } from "../module/category/category.route";
import { BannerRoutes } from "../module/banner/banner.route";
import { TicketRoutes } from "../module/ticket/ticket.route";
import { AuditRoutes } from "../module/audit/audit.route";
import { NotificationRoutes } from "../module/notification/notification.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/event", EventRoutes);
router.use("/participation", ParticipationRoutes);
router.use("/invitation", InvitationRoutes);
router.use("/review", ReviewRoutes);
router.use("/payment", PaymentRoutes);
router.use("/file", FileRoutes);
router.use("/admin", AdminRoutes);
router.use("/profile", ProfileRoutes);
router.use("/category", CategoryRoutes);
router.use("/banner", BannerRoutes);
router.use("/ticket", TicketRoutes);
router.use("/audit", AuditRoutes);
router.use("/notification", NotificationRoutes);
router.use("/stat", StatRoutes);

export const IndexRoutes = router;