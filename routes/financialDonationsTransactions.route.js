import express from "express";
import { auth } from "../middleware/auth.middleware.js";
import { initializeFinancialDonationPayment, verifyFinancialDonationPayment } from "../controllers/financialDonationsTransactions.controller.js";

const router = express.Router();

router.post("/initialize-donation-payment", auth, initializeFinancialDonationPayment);
router.get("/verify-donation-payment/:reference", auth, verifyFinancialDonationPayment);
// router.post("/webhook", express.raw({ type: "application/json" }), paystackWebhook);

export default router;
