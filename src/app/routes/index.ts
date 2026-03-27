import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { EventRoutes } from "../module/event/event.route";
import { ParticipationRoutes } from "../module/participation/participation.route";
import { InvitationRoutes } from "../module/invitation/invitation.route";
import { ReviewRoutes } from "../module/review/review.route";
import { PaymentRoutes } from "../module/payment/payment.route";
import { FileRoutes } from "../module/file/file.route";
import { AdminRoutes } from "../module/admin/admin.route";
import { UserRoutes } from "../module/user/user.route";
import { ProfileRoutes } from "../module/profile/profile.route";

const router = Router();

router.use("/auth", AuthRoutes);
router.use("/event", EventRoutes);
router.use("/participation", ParticipationRoutes);
router.use("/invitation", InvitationRoutes);
router.use("/review", ReviewRoutes);
router.use("/payment", PaymentRoutes);
router.use("/file", FileRoutes);
router.use("/admin", AdminRoutes);
router.use("/user", UserRoutes);
router.use("/profile", ProfileRoutes);

export const IndexRoutes = router;