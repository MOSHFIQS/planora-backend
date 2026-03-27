import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router()

router.post("/register", AuthController.registerUser)
router.post("/login", AuthController.loginUser)
router.post("/refresh-token", AuthController.getNewToken)


export const AuthRoutes = router;