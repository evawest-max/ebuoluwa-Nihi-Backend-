import express from "express";
import { getNotifications, markAsRead } from "../controllers/notification.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", auth, getNotifications);
router.put("/:id/read", auth, markAsRead);

export default router;
