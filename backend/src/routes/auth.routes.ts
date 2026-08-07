import { Router } from "express";
import { googleLogin, getProfile } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.post("/google", googleLogin);
router.get("/me", authenticate, getProfile);

export default router;
