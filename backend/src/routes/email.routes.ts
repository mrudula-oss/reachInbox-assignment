import { Router } from "express";
import {
  healthCheck,
  scheduleEmail,
  getScheduledEmails,
  getSentEmails,
} from "../controllers/email.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/", healthCheck);
router.post("/emails", authenticate, scheduleEmail);
router.get("/emails/scheduled", authenticate, getScheduledEmails);
router.get("/emails/sent", authenticate, getSentEmails);

export default router;