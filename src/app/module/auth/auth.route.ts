import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router()

router.post("/register", AuthController.registerUser)
router.post("/login", AuthController.loginUser)
router.post("/refresh-token", AuthController.getNewToken)

router.get("/login/google", AuthController.googleLogin);
router.get("/google/success", AuthController.googleLoginSuccess);
router.get("/oauth/error", AuthController.handleOAuthError);


export const AuthRoutes = router;