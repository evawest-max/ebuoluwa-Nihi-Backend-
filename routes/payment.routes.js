import express from "express";
import {
  initializePayment,
  verifyPayment,
  paystackWebhook,
} from "../controllers/payment.controller.js";
import { auth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/initialize", auth, initializePayment);
router.get("/verify/:reference", auth, verifyPayment);
router.post("/webhook", express.raw({ type: "application/json" }), paystackWebhook);

export default router;
