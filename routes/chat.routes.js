import express from "express";
import { sendMessage, getMessages } from "../controllers/chat.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", auth, sendMessage);
router.get("/:userId", auth, getMessages);

export default router;
