import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";

const router = Router()

router.post("/register", AuthController.registerUser)
router.post("/login", AuthController.loginUser)
router.post("/refresh-token", AuthController.getNewToken)

router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);

router.post(
     "/change-password",
     checkAuth(Role.SUPERADMIN, Role.ADMIN, Role.ORGANIZER, Role.USER),
     AuthController.changePassword,
);

router.post(
     "/logout",
     checkAuth(Role.SUPERADMIN, Role.ADMIN, Role.ORGANIZER, Role.USER),
     AuthController.logoutUser,
);

router.post("/verify-email", AuthController.verifyEmail);
router.post("/forget-password", AuthController.forgetPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post("/resend-otp", AuthController.resendOTP);

export const AuthRoutes = router;